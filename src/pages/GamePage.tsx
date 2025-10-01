import React, { useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import TicTacToeBoard from "../components/TicTacToeBoard";
import MemoryBoard from "../components/MemoryBoard";
import { asyncCreateGame } from "../store/game/thunks";

export default function GamePage() {
  const params = useParams();
  const [search] = useSearchParams();
  const keyParam = params.gameId || search.get("game") || "tic-tac-toe";
  const dispatch = useAppDispatch();

  useEffect(() => {
    // if param looks like a game key, create placeholder game
    if (keyParam === "tic-tac-toe" || keyParam === "memory-race") {
      // create game
      dispatch(asyncCreateGame(keyParam as any));
    }
  }, [dispatch, keyParam]);

  return (
    <div className="max-w-3xl mx-auto">
      <header className="mb-4">
        <h2 className="text-2xl font-semibold">Game: {keyParam}</h2>
        <p className="text-sm text-slate-600">
          Realtime placeholders shown (SignalR later)
        </p>
      </header>

      <div className="bg-white p-6 rounded-2xl shadow-md">
        {keyParam === "tic-tac-toe" && <TicTacToeBoard />}
        {keyParam === "memory-race" && <MemoryBoard />}
      </div>
    </div>
  );
}
