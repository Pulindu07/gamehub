import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { GameState, Cell, GameKey } from '../../types'
import { genId } from '../../utils/id'

const emptyCells = (n=9): Cell[] => Array.from({length: n}).map((_,i)=>({ index:i, value:null }))
const emptyMemoryCells = (n=9): Cell[] => Array.from({length: n}).map((_,i)=>({ index:i, value:null, revealed: false }))

const initialState: GameState = {
  id: undefined,
  key: undefined,
  board: emptyCells(),
  players: [],
  status: 'idle',
  turnPlayerId: null,
  gamesWon: 0,
  gamesPlayed: 0,
}

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    createGame(state, action: PayloadAction<{ key: GameKey }>){
      state.id = genId()
      state.key = action.payload.key
      if (action.payload.key === 'memory-race') {
        state.board = emptyMemoryCells(9)
      } else {
        state.board = emptyCells()
      }
      state.players = []
      state.status = 'ongoing'
      state.turnPlayerId = 'player1' // Start with player 1 (X)
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
    setTurn(state, action: PayloadAction<string | null>){
      state.turnPlayerId = action.payload
    },
    makeMove(state, action: PayloadAction<{ index: number, value: string }>){
      const { index, value } = action.payload
      state.board = state.board.map(cell => 
        cell.index === index ? { ...cell, value } : cell
      )
      // Switch turns
      state.turnPlayerId = state.turnPlayerId === 'player1' ? 'player2' : 'player1'
    },
    recordGameResult(state, action: PayloadAction<{ winner: string | null, isDraw: boolean }>){
      state.gamesPlayed += 1
      if (action.payload.winner === 'X') {
        state.gamesWon += 1
      }
    },
    resetGame(state){
      state.id = undefined
      state.key = undefined
      state.board = emptyCells()
      state.players = []
      state.status = 'idle'
      state.turnPlayerId = null
    },
    setMemorySequence(state, action: PayloadAction<number[]>){
      // Set the sequence of numbers for memory race
      const sequence = action.payload
      state.board = state.board.map((cell, index) => ({
        ...cell,
        value: sequence[index] ? String(sequence[index]) : null
      }))
    }
  }
})

export const { createGame, setBoard, setPlayers, setStatus, setTurn, makeMove, recordGameResult, resetGame, setMemorySequence } = gameSlice.actions
export default gameSlice.reducer