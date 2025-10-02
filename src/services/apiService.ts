import { store } from "../store"
import { setMultiplayerBoard, setConnectionStatus } from "../store/game/gameSlice"
import { getConfig } from "../config/env"

const CONFIG = {
  apiUrl: getConfig().apiUrl,
  pollIntervalMs: 1000,
}

type BoardCallback = (board: any) => void
type GameOverCallback = (payload?: any) => void

class ApiService {
  private gameId: string | null = null
  private playerId: string | null = null
  private playerName: string | null = null
  private pollingId: any = null
  private lastState: any = null
  private boardCallbacks: BoardCallback[] = []
  private gameOverCallbacks: GameOverCallback[] = []
  private gameType: string | null = null
  private telemetry: any = { attempts: 0 }

  private api(path: string, opts: RequestInit = {}) {
    const url = `${CONFIG.apiUrl.replace(/\/$/, '')}${path.startsWith('/') ? '' : '/'}${path}`
    return fetch(url, { credentials: 'include', headers: { 'Content-Type': 'application/json' }, ...opts })
  }

  private mapGameKeyToType(key?: string) {
    if (!key) return null
    if (key.toLowerCase().includes('memory')) return 'MemoryRace'
    if (key.toLowerCase().includes('tic')) return 'TicTacToe'
    return null
  }

  async start(gameId: string | null, playerName?: string, gameKey?: string) {
    this.telemetry.attempts++
    this.telemetry.lastAttempt = new Date()
    this.playerName = playerName || this.playerName || `Guest-${Math.random().toString(36).slice(2,7)}`

    try {
      store.dispatch(setConnectionStatus('connecting'))

      // If creating new game
      if (!gameId) {
        const gameType = this.mapGameKeyToType(gameKey || undefined)
        if (!gameType) throw new Error('gameKey required to create server game')
        const res = await this.api(`/games`, { method: 'POST', body: JSON.stringify({ gameType }) })
        if (!res.ok) throw new Error(`Create game failed: ${res.status}`)
        const body = await res.json()
        this.gameId = body?.gameId || body?.GameId || body?.state?.gameId || body?.id || null
        this.gameType = body?.gameType || body?.GameType || gameType
      } else {
        this.gameId = gameId
      }

      if (!this.gameId) throw new Error('Failed to determine game id')

      // Join
      const joinRes = await this.api(`/games/${encodeURIComponent(this.gameId)}/join`, { method: 'POST', body: JSON.stringify({ playerName: this.playerName }) })
      if (!joinRes.ok) {
        const txt = await joinRes.text()
        throw new Error(`Join failed: ${joinRes.status} ${txt}`)
      }
      const joinBody = await joinRes.json()
      // server returns { state, player } per controller
      const player = joinBody?.player || joinBody?.playerDto || null
      if (player) this.playerId = player.id || player.Id || this.playerId
      this.gameType = this.gameType || (joinBody?.state?.gameType || joinBody?.state?.GameType)

      store.dispatch(setConnectionStatus('connected'))

      // Seed last state and start polling
      this.lastState = joinBody?.state || joinBody
      this.emitBoard(this.lastState?.board || this.lastState?.Board)

      this.startPolling()

      return this.lastState
    } catch (err) {
      store.dispatch(setConnectionStatus('disconnected'))
      this.telemetry.lastError = err instanceof Error ? err.message : String(err)
      throw err
    }
  }

  private startPolling() {
    if (!this.gameId) return
    if (this.pollingId) return

    this.pollingId = setInterval(async () => {
      try {
        const id = this.gameId
        if (!id) return
        const res = await this.api(`/games/${encodeURIComponent(id)}`)
        if (!res.ok) return
        const body = await res.json()
        // Compare with last state shallowly
        if (JSON.stringify(body) !== JSON.stringify(this.lastState)) {
          this.lastState = body
          this.emitBoard(body.board || body.Board || [])
          if (body.status === 'Finished' || body.Status === 'Finished') {
            this.emitGameOver(body)
          }
        }
      } catch (e) {
        // ignore polling errors
        console.warn('Polling error', e)
      }
    }, CONFIG.pollIntervalMs)
  }

  private emitBoard(board: any) {
    try {
      store.dispatch(setMultiplayerBoard(board || []))
    } catch(e){}
    this.boardCallbacks.forEach(cb => {
      try { cb(board) } catch(e){}
    })
  }

  private emitGameOver(payload?: any) {
    this.gameOverCallbacks.forEach(cb => { try { cb(payload) } catch(e){} })
  }

  async sendFlip(index: number) {
    if (!this.gameId || !this.playerId) throw new Error('Not joined to a game')
    const payload = { gameId: this.gameId, playerId: this.playerId, position: index }
    const path = (this.gameType && this.gameType.toLowerCase().includes('tic')) ? `/games/${encodeURIComponent(this.gameId)}/move` : `/games/${encodeURIComponent(this.gameId)}/flip`
    const res = await this.api(path, { method: 'POST', body: JSON.stringify(payload) })
    if (!res.ok) {
      const txt = await res.text()
      throw new Error(`Move failed: ${res.status} ${txt}`)
    }
    const body = await res.json()
    // if server returned updated state, apply it immediately
    const state = body?.state || body
    if (state) {
      this.lastState = state
      this.emitBoard(state.board || state.Board || [])
      if (state.status === 'Finished' || state.Status === 'Finished') this.emitGameOver(state)
    }
    return body
  }

  onBoardUpdate(cb: BoardCallback) {
    this.boardCallbacks.push(cb)
  }

  onGameOver(cb: GameOverCallback) {
    this.gameOverCallbacks.push(cb)
  }

  async stop() {
    if (this.pollingId) {
      clearInterval(this.pollingId)
      this.pollingId = null
    }
    if (this.gameId && this.playerId) {
      try {
        await this.api(`/games/${encodeURIComponent(this.gameId)}/leave`, { method: 'POST', body: JSON.stringify({ playerId: this.playerId }) })
      } catch(e){}
    }
    this.gameId = null
    this.playerId = null
    this.playerName = null
    this.lastState = null
    store.dispatch(setConnectionStatus('disconnected'))
  }

  getDiagnostics() {
    return {
      attempts: this.telemetry.attempts,
      lastAttempt: this.telemetry.lastAttempt,
      lastError: this.telemetry.lastError,
      gameId: this.gameId,
      playerId: this.playerId,
      gameType: this.gameType,
      // include friendly fields expected by UI
      currentState: (store.getState() as any)?.game?.connectionStatus || 'disconnected',
      connectionId: null,
    }
  }
}

export const apiService = new ApiService()
