import { type AppDispatch } from '../index'
import { createGame, setBoard } from './gameSlice'


export const asyncCreateGame = (key:'tic-tac-toe'|'memory-race') => async (dispatch: AppDispatch) => {
// placeholder: call backend or SignalR to create game
dispatch(createGame({ key }))
}


export const asyncJoinGame = (gameId:string) => async (dispatch: AppDispatch) => {
// placeholder: fetch game state
}