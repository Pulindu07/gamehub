import React, { useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import TicTacToeBoard from "../components/TicTacToeBoard";
import MemoryBoard from "../components/MemoryBoard";
import Button from "../components/Button";
import { asyncCreateGame } from "../store/game/thunks";

export default function GamePage() {
  const params = useParams();
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const keyParam = params.gameId || search.get("game") || "tic-tac-toe";
  const dispatch = useAppDispatch();
  const gamesWon = useAppSelector(s => s.game.gamesWon);
  const gamesPlayed = useAppSelector(s => s.game.gamesPlayed);

  useEffect(() => {
    // if param looks like a game key, create placeholder game
    if (keyParam === "tic-tac-toe" || keyParam === "memory-race") {
      // create game
      dispatch(asyncCreateGame(keyParam as any));
    }
  }, [dispatch, keyParam]);

  const getGameInfo = (gameKey: string) => {
    switch (gameKey) {
      case "tic-tac-toe":
        return {
          title: "Tic Tac Toe",
          icon: "⭕",
          description: "Classic 3x3 strategy game",
          color: "from-blue-500 to-indigo-600"
        };
      case "memory-race":
        return {
          title: "Memory Race",
          icon: "🧠",
          description: "Test your memory with number cards",
          color: "from-purple-500 to-pink-600"
        };
      default:
        return {
          title: "Game",
          icon: "🎮",
          description: "Unknown game",
          color: "from-gray-500 to-gray-600"
        };
    }
  };

  const gameInfo = getGameInfo(keyParam);

  const getWinRate = () => {
    if (gamesPlayed === 0) return '0%'
    return `${Math.round((gamesWon / gamesPlayed) * 100)}%`
  }

  return (
    <div>
      {/* Header */}
      <div className="sticky-header">
        <div className="header-inner">
          <div className="title-row">
            <Button variant="ghost" onClick={() => navigate("/")}>← Back</Button>
            <div className="title-row">
              <div className="game-badge">{gameInfo.icon}</div>
              <div>
                <h1 className="card-title">{gameInfo.title}</h1>
                <p className="card-sub">{gameInfo.description}</p>
              </div>
            </div>
          </div>
          <div className="title-row">
            <span className="live-dot"></span>
            <span className="text-sm text-muted">Live</span>
          </div>
        </div>
      </div>

      {/* Game Content */}
      <div className="section">
        <div className="panel">
          {keyParam === "tic-tac-toe" && <TicTacToeBoard />}
          {keyParam === "memory-race" && <MemoryBoard />}
        </div>

        {/* Game Stats */}
        <div className="stats">
          <div className="stat">
            <div className="stat-number" style={{fontSize: '3rem'}}>{gamesWon}</div>
            <div className="stat-label">Games Won</div>
          </div>
          <div className="stat">
            <div className="stat-number purple" style={{fontSize: '3rem'}}>{gamesPlayed}</div>
            <div className="stat-label">Games Played</div>
          </div>
          <div className="stat">
            <div className="stat-number green" style={{fontSize: '3rem'}}>{getWinRate()}</div>
            <div className="stat-label">Win Rate</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex items-center justify-center gap-4" style={{flexWrap:'wrap'}}>
          <Button variant="outline" size="lg" onClick={() => window.location.reload()}>🔄 New Game</Button>
          <Button variant="ghost" size="lg" onClick={() => navigate("/")}>🏠 Home</Button>
        </div>
      </div>
    </div>
  );
}
