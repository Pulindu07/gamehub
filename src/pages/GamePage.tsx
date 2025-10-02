import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import TicTacToeBoard from "../components/TicTacToeBoard";
import MemoryBoard from "../components/MemoryBoard";
import Button from "../components/Button";
import { asyncCreateGame } from "../store/game/thunks";
import { createGame } from "../store/game/gameSlice";
import ConnectionDiagnostics from "../components/ConnectionDiagnostics";
import ErrorBoundary from "../components/ErrorBoundary";
import type { GameKey } from "../types";

export interface TicTacToeBoardProps {
  isMultiplayer: boolean;
  gameId?: string;
  gameKey: "tic-tac-toe";
  playerName?: string;
}

export default function GamePage() {
  const params = useParams();
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [gameError, setGameError] = useState<string | null>(null);

  // Parse path + query params
  // invite URLs use: /game/{gameId}?game={gameKey}&name={playerName}&mode=multiplayer
  const searchParams = new URLSearchParams(location.search);
  const gameKeyParam = (searchParams.get("game") || "tic-tac-toe") as GameKey; // game type (tic-tac-toe | memory-race)
  const pathGameId = params.gameId || undefined; // path param holds the actual game id for invites
  const isMultiplayer = searchParams.get("mode") === "multiplayer";
  const gameId = pathGameId || searchParams.get("gameId") || undefined;
  const playerName = searchParams.get("name") || undefined;

  const gamesWon = useAppSelector((s) => s.game.gamesWon);
  const gamesPlayed = useAppSelector((s) => s.game.gamesPlayed);

  useEffect(() => {
    const initializeGame = async () => {
      try {
        setGameError(null);
        if (gameKeyParam === "tic-tac-toe" || gameKeyParam === "memory-race") {
          if (isMultiplayer && gameId) {
            dispatch(createGame({ key: gameKeyParam, isMultiplayer: true }));
          } else {
            await dispatch(asyncCreateGame(gameKeyParam));
          }
        }
      } catch (error) {
        setGameError(error instanceof Error ? error.message : 'Failed to initialize game');
      }
    };

    initializeGame();
  }, [dispatch, gameKeyParam, isMultiplayer, gameId]);

  const getGameInfo = (gameKey: string) => {
    switch (gameKey) {
      case "tic-tac-toe":
        return {
          title: "Tic Tac Toe",
          icon: "⭕",
          description: "Classic 3x3 strategy game",
          color: "from-blue-500 to-indigo-600",
        };
      case "memory-race":
        return {
          title: "Memory Race",
          icon: "🧠",
          description: "Test your memory with number cards",
          color: "from-purple-500 to-pink-600",
        };
      default:
        return {
          title: "Game",
          icon: "🎮",
          description: "Unknown game",
          color: "from-gray-500 to-gray-600",
        };
    }
  };

  const gameInfo = getGameInfo(gameKeyParam);

  const getWinRate = () => {
    if (gamesPlayed === 0) return "0%";
    return `${Math.round((gamesWon / gamesPlayed) * 100)}%`;
  };

  const handleErrorReset = () => {
    setGameError(null);
    if (isMultiplayer && gameId) {
      dispatch(createGame({ key: gameKeyParam, isMultiplayer: true }));
    } else {
      dispatch(asyncCreateGame(gameKeyParam));
    }
  };

  if (gameError) {
    return (
      <div className="text-center p-8">
        <div className="text-2xl mb-4">😕 Game Error</div>
        <div className="text-gray-600 mb-6">{gameError}</div>
        <div className="flex gap-4 justify-center">
          <Button variant="outline" onClick={handleErrorReset}>
            🔄 Retry
          </Button>
          <Button variant="ghost" onClick={() => navigate("/")}>
            🏠 Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="sticky-header">
        <div className="header-inner">
          <div className="title-row">
            <Button variant="ghost" onClick={() => navigate("/")}>
              ← Back
            </Button>
            <div className="title-row">
              <div className="game-badge">{gameInfo.icon}</div>
              <div>
                <h1 className="card-title">{gameInfo.title}</h1>
                <p className="card-sub">{gameInfo.description}</p>
              </div>
            </div>
          </div>
          {isMultiplayer && (
            <div className="title-row">
              <span className="live-dot"></span>
              <span className="text-sm text-muted">Multiplayer</span>
            </div>
          )}
        </div>
      </div>

      {/* Game Content */}
      <div className="section">
        <div className="panel">
          <ErrorBoundary onReset={handleErrorReset}>
            {gameKeyParam === "tic-tac-toe" && (
              <TicTacToeBoard isMultiplayer={isMultiplayer} gameId={gameId || undefined} playerName={playerName} gameKey={gameKeyParam} />
            )}
            {gameKeyParam === "memory-race" && (
              <MemoryBoard isMultiplayer={isMultiplayer} gameId={gameId || undefined} playerName={playerName} gameKey={gameKeyParam} />
            )}
          </ErrorBoundary>
        </div>

        {/* Game Stats */}
        <div className="stats">
          <div className="stat">
            <div className="stat-number">
              {gamesWon}
            </div>
            <div className="stat-label">Games Won</div>
          </div>
          <div className="stat">
            <div className="stat-number purple">
              {gamesPlayed}
            </div>
            <div className="stat-label">Games Played</div>
          </div>
          <div className="stat">
            <div className="stat-number green">
              {getWinRate()}
            </div>
            <div className="stat-label">Win Rate</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex items-center justify-center gap-4 flex-wrap">
          <Button
            variant="outline"
            size="lg"
            onClick={() => window.location.reload()}
          >
            🔄 New Game
          </Button>
          <Button variant="ghost" size="lg" onClick={() => navigate("/")}>
            🏠 Home
          </Button>
        </div>
      </div>

      {/* Diagnostics */}
      {isMultiplayer && <ConnectionDiagnostics />}
    </div>
  );
}
