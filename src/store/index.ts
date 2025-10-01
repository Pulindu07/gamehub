import { configureStore } from "@reduxjs/toolkit";
import thunk from "redux-thunk";
import gameReducer from "./game/gameSlice";
import playerReducer from "./player/playerSlice";
import uiReducer from "./ui/uiSlice";

export const store = configureStore({
  reducer: {
    game: gameReducer,
    player: playerReducer,
    ui: uiReducer,
  },
  middleware: (getDefault) => getDefault().prepend(thunk),
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
