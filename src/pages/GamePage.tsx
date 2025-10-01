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

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate("/")}
                className="text-gray-600 hover:text-gray-800"
              >
                ← Back
              </Button>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 bg-gradient-to-br ${gameInfo.color} rounded-xl flex items-center justify-center text-xl`}>
                  {gameInfo.icon}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-800">{gameInfo.title}</h1>
                  <p className="text-sm text-gray-600">{gameInfo.description}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">Live</span>
            </div>
          </div>
        </div>
      </div>

      {/* Game Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8">
          {keyParam === "tic-tac-toe" && <TicTacToeBoard />}
          {keyParam === "memory-race" && <MemoryBoard />}
        </div>

        {/* Game Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold text-indigo-600">0</div>
            <div className="text-sm text-gray-600">Games Won</div>
          </div>
          <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">0</div>
            <div className="text-sm text-gray-600">Games Played</div>
          </div>
          <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold text-emerald-600">0%</div>
            <div className="text-sm text-gray-600">Win Rate</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => window.location.reload()}
          >
            🔄 New Game
          </Button>
          <Button 
            variant="ghost" 
            size="lg"
            onClick={() => navigate("/")}
          >
            🏠 Home
          </Button>
        </div>
      </div>
    </div>
  );
}
