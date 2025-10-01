import { configureStore } from "@reduxjs/toolkit";
import gameReducer from "./game/gameSlice";
import playerReducer from "./player/playerSlice";
import uiReducer from "./ui/uiSlice";

export const store = configureStore({
  reducer: {
    game: gameReducer,
    player: playerReducer,
    ui: uiReducer,
  },
  // RTK includes redux-thunk by default
  middleware: (getDefault) => getDefault(),
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
