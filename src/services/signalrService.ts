import * as signalR from "@microsoft/signalr"
import { store } from "../store"
import { setMultiplayerBoard, setConnectionStatus } from "../store/game/gameSlice"
import { getConfig } from "../config/env"

const CONFIG = {
  hubUrl: getConfig().hubUrl,
  retryAttempts: 3,
  retryDelayMs: 2000,
  connectionTimeout: 30000,
  debug: true // Enable detailed logging
}

interface ConnectionTelemetry {
  attempts: number;
  lastError?: string;
  lastAttempt?: Date;
  connectionState?: signalR.HubConnectionState;
  negotiateResponse?: any;
}

class SignalRService {
  private connection: signalR.HubConnection | null = null
  private reconnectAttempts = 0
  private isConnecting = false
  private currentGameId: string | null = null
  private currentPlayerName: string | null = null
  private telemetry: ConnectionTelemetry = { attempts: 0 }

  private logDebug(...args: any[]) {
    if (CONFIG.debug) {
      console.log("[SignalR Debug]", ...args);
    }
  }

  // Wait helper used to poll for a condition with timeout
  private async waitFor(condition: () => boolean, timeoutMs = 10000, intervalMs = 100): Promise<boolean> {
    const start = Date.now();
    while (!condition()) {
      if (Date.now() - start > timeoutMs) return false;
      await new Promise((res) => setTimeout(res, intervalMs));
    }
    return true;
  }

  private getConnectionState(): number | undefined {
    // HubConnection.state typing may not include all runtime states depending on @microsoft/signalr version.
    // Read it as any at runtime to avoid TypeScript mismatch errors when comparing to the enum.
    return (this.connection as any)?.state as number | undefined;
  }

  private async ensureConnection(): Promise<boolean> {
    if (this.getConnectionState() === (signalR.HubConnectionState as any).Connected) {
      this.logDebug("Connection already established.");
      return true;
    }

    // If another initialization is in progress, wait for it to finish instead of creating a new connection
    if (this.isConnecting) {
      this.logDebug("Connection attempt already in progress; waiting for it to complete...");
      const finished = await this.waitFor(() => !this.isConnecting, CONFIG.connectionTimeout, 100);
      if (!finished) {
        this.logDebug("Timed out waiting for in-progress connection attempt to finish.");
        return false;
      }

      // After waiting, check resulting state
      if (this.getConnectionState() === (signalR.HubConnectionState as any).Connected) {
        this.logDebug("Connection finished by another attempt and is now connected.");
        return true;
      }

      // If it ended up disconnected, continue to create a new connection below
    }

    if (this.connection && this.getConnectionState() !== (signalR.HubConnectionState as any).Disconnected) {
      this.logDebug("Connection is not in a disconnected state. Stopping existing connection...");
      try {
        // Await stop to ensure connection moves to Disconnected state before creating new one
        await this.connection.stop();
      } catch (err) {
        this.logDebug("Error stopping existing connection:", err);
      }
    }

    this.isConnecting = true;
    store.dispatch(setConnectionStatus('connecting'));

    try {
      if (!this.connection) {
        this.logDebug("Initializing new SignalR connection...");
        this.connection = new signalR.HubConnectionBuilder()
          .withUrl(CONFIG.hubUrl, {
            logger: {
              log: (logLevel, message) => {
                this.logDebug(`[${logLevel}] ${message}`);
              }
            },
            headers: {
              "X-Client-Version": "1.0.0",
              "X-Debug-Mode": "true"
            }
          })
          .withAutomaticReconnect({
            nextRetryDelayInMilliseconds: (retryContext) => {
              this.logDebug("Retry context:", retryContext);
              if (this.reconnectAttempts++ < CONFIG.retryAttempts) {
                const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 5000);
                this.logDebug(`Next retry in ${delay}ms`);
                return delay;
              }
              return null;
            }
          })
          .configureLogging(signalR.LogLevel.Debug)
          .build();

        this.setupEventHandlers();
      }
      return true;
    } finally {
      this.isConnecting = false;
    }
  }

  async start(gameId: string | null, playerName?: string, gameKey?: string) {
    if (!gameId && !gameKey) {
      throw new Error("Either gameId or gameKey is required to start a multiplayer session");
    }

    // set or generate player name
    this.currentPlayerName = playerName || this.currentPlayerName || `Guest-${Math.random().toString(36).slice(2,7)}`;

    if (gameId) this.currentGameId = gameId;
    this.telemetry.attempts++;
    this.telemetry.lastAttempt = new Date();

    const ensured = await this.ensureConnection();
    if (!ensured) {
      throw new Error("Another connection attempt is in progress or timed out. Please try again shortly.");
    }

    try {
      // Test negotiate endpoint first
      this.logDebug("Testing negotiate endpoint...");
      const negotiateResponse = await fetch(`${CONFIG.hubUrl}/negotiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      this.telemetry.negotiateResponse = await negotiateResponse.text();
      this.logDebug("Negotiate response:", this.telemetry.negotiateResponse);

      const connectionPromise = this.connection!.start();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Connection timeout")), CONFIG.connectionTimeout);
      });

      await Promise.race([connectionPromise, timeoutPromise]);
      this.logDebug("SignalR connection established");

      this.telemetry.connectionState = this.connection!.state;
      store.dispatch(setConnectionStatus('connected'));

      // Helper to wait for server-sent events (Error or GameCreated)
      const waitForServerEvent = (timeoutMs = 5000) => {
        return new Promise<{ type: 'error' | 'gamecreated' | 'gameupdated'; payload: any }>((resolve, reject) => {
          if (!this.connection) return reject(new Error('No connection'));

          const onError = (msg: string) => {
            cleanup();
            resolve({ type: 'error', payload: msg });
          };
          const onGameCreated = (gameState: any) => {
            cleanup();
            resolve({ type: 'gamecreated', payload: gameState });
          };
          const onGameUpdated = (gameState: any) => {
            // Some flows may emit GameUpdated on join; treat as success
            cleanup();
            resolve({ type: 'gameupdated', payload: gameState });
          };

          const cleanup = () => {
            try { this.connection!.off('Error', onError); } catch(e){}
            try { this.connection!.off('GameCreated', onGameCreated); } catch(e){}
            try { this.connection!.off('GameUpdated', onGameUpdated); } catch(e){}
            clearTimeout(timer);
          };

          this.connection.on('Error', onError);
          this.connection.on('GameCreated', onGameCreated);
          this.connection.on('GameUpdated', onGameUpdated);

          const timer = setTimeout(() => {
            cleanup();
            reject(new Error('Server response timeout'));
          }, timeoutMs);
        });
      };

      // If no gameId provided, create a new game on server (require gameKey)
      if (!this.currentGameId) {
        if (!gameKey) throw new Error('Game key required to create a new game');
        this.logDebug('Creating new game on server with key', gameKey);
        // Listen for GameCreated event and use its payload id
        const createPromise = new Promise<any>(async (resolve, reject) => {
          const onCreated = (state: any) => { try { this.connection!.off('GameCreated', onCreated); } catch(e){}; resolve(state); };
          this.connection!.on('GameCreated', onCreated);
          try {
            await this.connection!.invoke('CreateGame', gameKey);
          } catch (err) {
            try { this.connection!.off('GameCreated', onCreated); } catch(e){}
            reject(err);
          }
          // safety timeout
          setTimeout(() => { try { this.connection!.off('GameCreated', onCreated); } catch(e){}; reject(new Error('CreateGame timeout')) }, CONFIG.connectionTimeout);
        });

        const created = await createPromise;
        this.currentGameId = created?.id || (created && created.gameId) || null;
        this.logDebug('Created game on server:', this.currentGameId);
      }

      // Try to join the desired gameId
      if (this.currentGameId) {
        try {
          this.logDebug('Attempting to join game:', this.currentGameId, 'as', this.currentPlayerName);

          // Setup a small listener to detect 'Game not found' error and react
          const serverResult = waitForServerEvent(3000).catch(() => null);
          await this.connection!.invoke('JoinGame', this.currentGameId, this.currentPlayerName);

          const evt = await serverResult;
          if (evt && evt.type === 'error') {
            const msg = String(evt.payload || '').toLowerCase();
            this.logDebug('Server returned error while joining:', msg);
            if (msg.includes('game not found')) {
              // If we were given a gameKey, create a new game and join it
              if (gameKey) {
                this.logDebug('Game not found on server; creating new one with key', gameKey);
                const createdState = await new Promise<any>(async (resolve, reject) => {
                  const onCreated = (st: any) => { try { this.connection!.off('GameCreated', onCreated); } catch(e){}; resolve(st); };
                  this.connection!.on('GameCreated', onCreated);
                  try { await this.connection!.invoke('CreateGame', gameKey); } catch (e) { try { this.connection!.off('GameCreated', onCreated); } catch(e){}; reject(e); }
                  setTimeout(() => { try { this.connection!.off('GameCreated', onCreated); } catch(e){}; reject(new Error('CreateGame timeout')) }, CONFIG.connectionTimeout);
                });
                const newId = createdState?.id || createdState?.gameId;
                if (!newId) throw new Error('Failed to determine new game id from server');
                this.currentGameId = newId;
                this.logDebug('Joining newly created game:', newId);
                await this.connection!.invoke('JoinGame', newId, this.currentPlayerName);
              } else {
                throw new Error('Game not found on server');
              }
            } else {
              // Other server-side error
              throw new Error(String(evt.payload || 'Unknown server error'));
            }
          }

          this.logDebug('Successfully joined game');
        } catch (error) {
          this.logDebug('Failed to join game:', error);
          this.telemetry.lastError = error instanceof Error ? error.message : String(error);
          store.dispatch(setConnectionStatus('disconnected'));
          throw new Error('Failed to join game. Please check if the game server is running and try again.');
        }
      }
    } catch (error) {
      this.logDebug('SignalR connection failed:', error);
      this.telemetry.lastError = error instanceof Error ? error.message : 'Unknown error';
      store.dispatch(setConnectionStatus('disconnected'));
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          throw new Error('Connection timed out. Please check your network connection and try again.');
        } else if (error.message.includes('Failed to fetch')) {
          throw new Error(`Could not reach game server at ${CONFIG.hubUrl}. Please ensure the server is running.`);
        } else if (error.message.includes('CORS')) {
          throw new Error('CORS error - The game server is not accepting connections from this origin.');
        }
      }
      const errorDetail = `Error details: Last attempt: ${this.telemetry.lastAttempt}, Attempts: ${this.telemetry.attempts}, Last error: ${this.telemetry.lastError}`;
      throw new Error(`Failed to connect to game server. ${errorDetail}`);
    }
  }

  private setupEventHandlers() {
    if (!this.connection) return

    this.connection.on("BoardUpdated", (board) => {
      store.dispatch(setMultiplayerBoard(board))
    })

    this.connection.on("Error", (errorMessage) => {
      console.error("SignalR Error:", errorMessage)
    })

    this.connection.onreconnecting(() => {
      this.logDebug("Attempting to reconnect...");
      store.dispatch(setConnectionStatus('connecting'))
    })

    this.connection.onreconnected(() => {
      this.logDebug("Reconnected successfully");
      store.dispatch(setConnectionStatus('connected'))
      
      // Re-join game after reconnection
      if (this.currentGameId && this.connection) {
        // connection exists and should be connected here, assert non-null to satisfy TS
        this.logDebug("Re-joining game after reconnection as", this.currentPlayerName)
        this.connection!.invoke("JoinGame", this.currentGameId, this.currentPlayerName)
          .catch(error => {
            this.logDebug("Failed to re-join game after reconnection:", error);
            store.dispatch(setConnectionStatus('disconnected'))
          })
      }
    })

    this.connection.onclose((error) => {
      this.logDebug("SignalR connection closed:", error);
      store.dispatch(setConnectionStatus('disconnected'))
      this.reconnectAttempts = 0
      this.currentGameId = null
    })
  }

  async sendFlip(index: number) {
    if (!this.connection || this.getConnectionState() !== (signalR.HubConnectionState as any).Connected) {
      throw new Error("No active connection")
    }

    if (!this.currentGameId) {
      throw new Error('Not joined to a game')
    }

    try {
      const payload = {
        GameId: this.currentGameId,
        PlayerId: this.currentPlayerName,
        Position: index
      }
      await this.connection.invoke("FlipCard", payload)
    } catch (error) {
      this.logDebug("Failed to send flip:", error);
      if (error instanceof Error) {
        throw new Error(`Failed to make move: ${error.message}`)
      }
      throw new Error("Failed to make move. Please try again.")
    }
  }

  onBoardUpdate(callback: (board: any) => void) {
    this.connection?.on("BoardUpdated", callback)
  }

  onGameOver(callback: () => void) {
    this.connection?.on("GameOver", callback)
  }

  async stop() {
    try {
      await this.connection?.stop()
      this.connection = null
      this.reconnectAttempts = 0
      this.currentGameId = null
      store.dispatch(setConnectionStatus('disconnected'))
    } catch (error) {
      this.logDebug("Error stopping SignalR connection:", error);
    }
  }

  getDiagnostics() {
    return {
      ...this.telemetry,
      currentState: (this.connection as any)?.state,
      connectionId: (this.connection as any)?.connectionId,
      playerName: this.currentPlayerName,
      gameId: this.currentGameId
    };
  }
}

export const signalRService = new SignalRService()
