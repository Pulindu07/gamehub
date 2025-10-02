import React, { useEffect, useState } from "react";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import {
  setBoard,
  setMemorySequence,
  resetGame,
  createGame,
  recordGameResult,
} from "../store/game/gameSlice";
import type { Cell } from "../types";
import { signalRService } from '../services/signalrService'


interface MemoryBoardProps {
  isMultiplayer?: boolean;
  gameId?: string; // only needed if multiplayer
}

export default function MemoryBoard({
  isMultiplayer = false,
  gameId,
}: MemoryBoardProps) {
  const dispatch = useAppDispatch();
  const board = useAppSelector((s) => s.game.board);
  const gamesWon = useAppSelector((s) => s.game.gamesWon);
  const gamesPlayed = useAppSelector((s) => s.game.gamesPlayed);

  // gridSize can be 4, 9, 16
  const [gridSize, setGridSize] = useState<number>(9);
  const [nextNumberToFind, setNextNumberToFind] = useState(1);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [round, setRound] = useState(1);
  const [gameResultRecorded, setGameResultRecorded] = useState(false);
  const [isFlippingBack, setIsFlippingBack] = useState(false);
  const [connectionStarted, setConnectionStarted] = useState(false)

  

  // helper: generate sequence 1..n shuffled
  const generateSequence = (n = gridSize) => {
    const numbers = Array.from({ length: n }, (_, i) => i + 1);
    return numbers.sort(() => Math.random() - 0.5);
  };

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
  }, [gameStarted, gridSize, isMultiplayer, dispatch])

  useEffect(() => {
    if (isMultiplayer && gameId && !connectionStarted) {
      const startConnection = async () => {
        await signalRService.start(gameId) // connects & joins game
        setConnectionStarted(true)

        // Listen for board updates from server
        signalRService.onBoardUpdate((updatedBoard: Cell[]) => {
          dispatch(setMultiplayerBoard(updatedBoard))
        })

        // Listen for game over from server
        signalRService.onGameOver(() => {
          setGameOver(true)
        })
      }
      startConnection()
    }
  }, [isMultiplayer, gameId, connectionStarted, dispatch])

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
      setGameResultRecorded(false);
      setGameStarted(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameStarted, gridSize, dispatch]);

  const handleFlip = (index: number) => {
    if (gameOver || isFlippingBack) return

    if (isMultiplayer && gameId) {
      // multiplayer: send flip to backend
      signalRService.sendFlip(index)
      return
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
    setGameResultRecorded(false);

    dispatch(resetGame());
    // optional: also dispatch(createGame({ key: 'memory-race' })) if you rely on slice's metadata
    dispatch(createGame({ key: "memory-race" }));
    // the effect will setBoard and setMemorySequence for the new size
  };

  // wrapper for existing single-size startNewGame button
  const startNewGame = () => startNewGameWithSize(gridSize);

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
      {/* Controls: choose grid size */}
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
        >
          2×2
        </button>
        <button
          className={`btn ${gridSize === 9 ? "btn-active" : ""}`}
          onClick={() => startNewGameWithSize(9)}
        >
          3×3
        </button>
        <button
          className={`btn ${gridSize === 16 ? "btn-active" : ""}`}
          onClick={() => startNewGameWithSize(16)}
        >
          4×4
        </button>
      </div>

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
            disabled={gameOver || isFlippingBack}
            style={{ height: 72, fontSize: 18 }}
          >
            {cell.revealed ? cell.value ?? "?" : "?"}
          </button>
        ))}
      </div>

      <div
        className="text-center mt-6"
        style={{ textAlign: "center", marginTop: 12 }}
      >
        <div className="badge" style={{ marginBottom: 8 }}>
          <span
            className="live-dot"
            style={{
              background: "#f59e0b",
              display: "inline-block",
              width: 8,
              height: 8,
              borderRadius: 16,
              marginRight: 8,
            }}
          />
          <span className="text-sm">
            Round {round} • {getStatusText()}
          </span>
        </div>

        {gameOver ? (
          <div className="mt-6">
            <div style={{ fontSize: "3rem", marginBottom: "12px" }}>🎉</div>
            <div
              style={{
                fontSize: "1.25rem",
                fontWeight: "bold",
                marginBottom: "12px",
              }}
            >
              Perfect Memory!
            </div>
            <div
              style={{
                display: "flex",
                gap: 12,
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <button className="btn btn-outline" onClick={startNewGame}>
                🔄 New Game
              </button>
            </div>
          </div>
        ) : (
          <p className="text-xs" style={{ marginTop: 8 }}>
            Click cards to find numbers in order (1→2→3...→{gridSize}). Wrong
            number resets all cards!
          </p>
        )}
      </div>
    </div>
  );
}
