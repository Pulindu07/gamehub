import React, { useEffect, useState, useCallback } from "react";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import {
  setBoard,
  setMemorySequence,
  resetGame,
  createGame,
  recordGameResult,
} from "../store/game/gameSlice";
import type { Cell } from "../types";
import { apiService } from '../services/apiService'
import Button from "./Button";

interface MemoryBoardProps {
  isMultiplayer?: boolean;
  gameId?: string; // only needed if multiplayer
  playerName?: string;
  gameKey?: string;
}

export default function MemoryBoard({
  isMultiplayer = false,
  gameId,
  playerName,
  gameKey,
}: MemoryBoardProps) {
  const dispatch = useAppDispatch();
  const board = useAppSelector((s) => s.game.board);
  const gamesWon = useAppSelector((s) => s.game.gamesWon);
  const gamesPlayed = useAppSelector((s) => s.game.gamesPlayed);
  const connectionStatus = useAppSelector((s) => s.game.connectionStatus);

  // gridSize can be 4, 9, 16
  const [gridSize, setGridSize] = useState<number>(9);
  const [nextNumberToFind, setNextNumberToFind] = useState(1);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [round, setRound] = useState(1);
  const [isFlippingBack, setIsFlippingBack] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  // helper: generate sequence 1..n shuffled
  const generateSequence = useCallback((n = gridSize) => {
    const numbers = Array.from({ length: n }, (_, i) => i + 1);
    return numbers.sort(() => Math.random() - 0.5);
  }, [gridSize]);

  useEffect(() => {
    if (!gameStarted && !isMultiplayer) {
      const initialBoard: Cell[] = Array.from({ length: gridSize }, (_, i) => ({
        index: i,
        value: null,
        revealed: false
      }))
      dispatch(setBoard(initialBoard))
      const seq = generateSequence(gridSize)
      dispatch(setMemorySequence(seq))
      setNextNumberToFind(1)
      setGameOver(false)
      setGameStarted(true)
    }
  }, [gameStarted, gridSize, isMultiplayer, dispatch, generateSequence])

  // Cleanup function for SignalR subscriptions
  const cleanupSignalR = useCallback(() => {
    if (isMultiplayer) {
      apiService.stop();
      setRetryCount(0);
      setConnectionError(null);
    }
  }, [isMultiplayer]);

  useEffect(() => {
    if (isMultiplayer) {
      const connectToGame = async () => {
        try {
          setConnectionError(null);
          // pass playerName and gameKey so service can create game when missing
          await apiService.start(gameId || null, playerName, gameKey);
          
          // Store cleanup functions for each subscription
          apiService.onBoardUpdate((updatedBoard: Cell[]) => {
            dispatch(setBoard(updatedBoard));
          });

          apiService.onGameOver(() => {
            setGameOver(true);
          });

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to connect to game';
          setConnectionError(errorMessage);
          console.error("Game connection error:", error);
          
          if (retryCount < maxRetries) {
            const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 5000);
            const timeoutId = setTimeout(() => {
              setRetryCount(prev => prev + 1);
              connectToGame();
            }, retryDelay);
            
            // Clean up timeout if component unmounts during retry delay
            return () => clearTimeout(timeoutId);
          }
        }
      };

      connectToGame();
      return cleanupSignalR;
    }
  }, [isMultiplayer, gameId, playerName, gameKey, dispatch, retryCount, maxRetries, cleanupSignalR]);

  // Initialize board & sequence for the chosen gridSize (runs when gameStarted false)
  useEffect(() => {
    if (!gameStarted) {
      // create empty board for the chosen size
      const initialBoard: Cell[] = Array.from({ length: gridSize }, (_, i) => ({
        index: i,
        value: null,
        revealed: false,
      }));

      dispatch(setBoard(initialBoard));

      // create and set the sequence (fixed for the whole game)
      const seq = generateSequence(gridSize);
      console.log("Initial sequence for size", gridSize, seq);
      dispatch(setMemorySequence(seq));

      setNextNumberToFind(1);
      setGameOver(false);
      setGameStarted(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameStarted, gridSize, dispatch]);

  const handleFlip = async (index: number) => {
    if (gameOver || isFlippingBack) return;

    if (isMultiplayer && gameId) {
      try {
        setConnectionError(null);
        await apiService.sendFlip(index);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to make move';
        setConnectionError(errorMessage);
        console.error("Failed to send flip:", error);
      }
      return;
    }

    // --- SOLO LOGIC AS-IS ---
    if (!board[index] || board[index].revealed) return
    const clickedValue = parseInt(board[index].value || '0', 10)

    const newBoard = board.map(cell =>
      cell.index === index ? { ...cell, revealed: true } : cell
    )
    dispatch(setBoard(newBoard))

    if (clickedValue === nextNumberToFind) {
      if (clickedValue === gridSize) {
        setTimeout(() => {
          setGameOver(true)
          dispatch(recordGameResult({ winner: 'X', isDraw: false }))
        }, 300)
        return
      }
      setNextNumberToFind(prev => prev + 1)
      return
    }

    setIsFlippingBack(true)
    setTimeout(() => {
      const resetBoard = board.map(cell => ({ ...cell, revealed: false }))
      dispatch(setBoard(resetBoard))
      setNextNumberToFind(1)
      setIsFlippingBack(false)
    }, 800)
  }

  const getCardClass = (revealed: boolean) =>
    revealed
      ? "memory-card memory-card-revealed"
      : "memory-card memory-card-hidden";

  // Start a fresh new game with the currently selected grid size
  const startNewGameWithSize = (size: number) => {
    setGridSize(size);
    setGameStarted(false); // trigger useEffect to re-init board & sequence
    setGameOver(false);
    setRound(1);
    setNextNumberToFind(1);
    setConnectionError(null);
    setRetryCount(0);

    dispatch(resetGame());
    // optional: also dispatch(createGame({ key: 'memory-race' })) if you rely on slice's metadata
    dispatch(createGame({ key: "memory-race", isMultiplayer }));
    // the effect will setBoard and setMemorySequence for the new size
  };

  // wrapper for existing single-size startNewGame button
  const startNewGame = () => startNewGameWithSize(gridSize);

  const handleRetryConnection = () => {
    setRetryCount(0);
    setConnectionError(null);
    apiService.start(gameId || null, playerName, gameKey).catch(err => console.error('Retry connection failed', err));
  };

  const getStatusText = () => {
    if (gameOver) return "Round Complete!";
    return `Find number ${nextNumberToFind}`;
  };

  const getWinRate = () => {
    if (gamesPlayed === 0) return "0%";
    return `${Math.round((gamesWon / gamesPlayed) * 100)}%`;
  };

  // grid columns = sqrt(gridSize) (2, 3, or 4)
  const gridCols = Math.sqrt(gridSize);
  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
    gap: "8px",
    maxWidth: `${gridCols * 80}px`,
    margin: "0 auto",
  };

  return (
    <div>
      {/* Controls */}
      <div
        style={{
          display: "flex",
          gap: 8,
          justifyContent: "center",
          marginBottom: 12,
        }}
      >
        <button
          className={`btn ${gridSize === 4 ? "btn-active" : ""}`}
          onClick={() => startNewGameWithSize(4)}
          disabled={isMultiplayer}
        >
          2×2
        </button>
        <button
          className={`btn ${gridSize === 9 ? "btn-active" : ""}`}
          onClick={() => startNewGameWithSize(9)}
          disabled={isMultiplayer}
        >
          3×3
        </button>
        <button
          className={`btn ${gridSize === 16 ? "btn-active" : ""}`}
          onClick={() => startNewGameWithSize(16)}
          disabled={isMultiplayer}
        >
          4×4
        </button>
      </div>

      {/* Connection status */}
      {isMultiplayer && (
        <div className="text-center mb-4">
          <div className={`badge ${
            connectionStatus === 'connected' ? 'bg-green-100' :
            connectionStatus === 'connecting' ? 'bg-yellow-100' :
            'bg-red-100'
          }`}>
            <span className={`live-dot ${
              connectionStatus === 'connected' ? 'bg-green-500' :
              connectionStatus === 'connecting' ? 'bg-yellow-500' :
              'bg-red-500'
            }`} />
            <span className="text-sm">
              {connectionStatus === 'connected' ? 'Connected' :
               connectionStatus === 'connecting' ? 'Connecting...' :
               'Disconnected'}
            </span>
          </div>
          
          {connectionError && (
            <div className="mt-4">
              <div className="text-red-600 text-sm mb-2">
                {connectionError}
              </div>
              {retryCount >= maxRetries && (
                <Button
                  variant="outline"
                  onClick={handleRetryConnection}
                >
                  🔄 Retry Connection
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Game Stats */}
      <div
        className="stats"
        style={{
          marginBottom: "16px",
          display: "flex",
          gap: 16,
          justifyContent: "center",
        }}
      >
        <div className="stat">
          <div className="stat-number" style={{ fontSize: "1.6rem" }}>
            {gamesWon}
          </div>
          <div className="stat-label">Rounds Won</div>
        </div>
        <div className="stat">
          <div className="stat-number purple" style={{ fontSize: "1.6rem" }}>
            {gamesPlayed}
          </div>
          <div className="stat-label">Rounds Played</div>
        </div>
        <div className="stat">
          <div className="stat-number green" style={{ fontSize: "1.6rem" }}>
            {getWinRate()}
          </div>
          <div className="stat-label">Win Rate</div>
        </div>
      </div>

      {/* Memory Grid */}
      <div style={gridStyle}>
        {board.map((cell: Cell) => (
          <button
            key={cell.index}
            onClick={() => handleFlip(cell.index)}
            className={getCardClass(!!cell.revealed)}
            disabled={
              gameOver || 
              isFlippingBack || 
              (isMultiplayer && connectionStatus !== 'connected') ||
              cell.revealed
            }
            style={{ height: 72, fontSize: 18 }}
          >
            {cell.revealed ? cell.value ?? "?" : "?"}
          </button>
        ))}
      </div>

      <div className="text-center mt-6">
        <div className="badge">
          <span className="live-dot" style={{ background: "#f59e0b" }} />
          <span className="text-sm">
            Round {round} • {getStatusText()}
          </span>
        </div>

        {gameOver ? (
          <div className="mt-6">
            <div style={{ fontSize: "3rem", marginBottom: "12px" }}>🎉</div>
            <div style={{ fontSize: "1.25rem", fontWeight: "bold", marginBottom: "12px" }}>
              Perfect Memory!
            </div>
            <Button variant="outline" onClick={startNewGame}>
              🔄 New Game
            </Button>
          </div>
        ) : (
          <p className="text-xs mt-2">
            Click cards to find numbers in order (1→2→3...→{gridSize}). Wrong number resets all cards!
          </p>
        )}
      </div>
    </div>
  );
}
