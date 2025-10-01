import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { GameState, Cell, GameKey } from '../../types'
import { genId } from '../../utils/id'


const emptyCells = (n=9): Cell[] => Array.from({length: n}).map((_,i)=>({ index:i, value:null }))


const initialState: GameState = {
id: undefined,
key: undefined,
board: emptyCells(),
players: [],
status: 'idle',
}


const gameSlice = createSlice({
name: 'game',
initialState,
reducers: {
createGame(state, action: PayloadAction<{ key: GameKey }>){
state.id = genId()
state.key = action.payload.key
state.board = emptyCells()
state.players = []
state.status = 'ongoing'
},
setBoard(state, action: PayloadAction<Cell[]>){
state.board = action.payload
},
setPlayers(state, action: PayloadAction<any[]>){
state.players = action.payload
},
setStatus(state, action: PayloadAction<GameState['status']>){
state.status = action.payload
},
resetGame(state){
state.id = undefined
state.key = undefined
state.board = emptyCells()
state.players = []
state.status = 'idle'
}
}
})


export const { createGame, setBoard, setPlayers, setStatus, resetGame } = gameSlice.actions
export default gameSlice.reducer