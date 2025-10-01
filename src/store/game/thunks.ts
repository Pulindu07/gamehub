import { type AppDispatch } from '../index'
import { createGame, setBoard, resetGame } from './gameSlice'

export const asyncCreateGame = (key:'tic-tac-toe'|'memory-race') => async (dispatch: AppDispatch) => {
  // Reset any existing game first
  dispatch(resetGame())
  // Create new game
  dispatch(createGame({ key }))
}

export const asyncJoinGame = (gameId:string) => async (dispatch: AppDispatch) => {
  // placeholder: fetch game state
}