import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { GameState, Cell, GameKey } from '../../types'
import { genId } from '../../utils/id'

const emptyCells = (n = 9): Cell[] => Array.from({ length: n }).map((_, i) => ({ index: i, value: null }))
const emptyMemoryCells = (n = 9): Cell[] => Array.from({ length: n }).map((_, i) => ({ index: i, value: null, revealed: false }))

const initialState: GameState = {
  id: undefined,
  key: undefined,
  board: emptyCells(),
  players: [],
  status: 'idle',
  turnPlayerId: null,
  gamesWon: 0,
  gamesPlayed: 0,
  isMultiplayer: false,        // NEW: multiplayer flag
  connectionStatus: 'disconnected', // NEW: SignalR connection state
  sequence: [],                 // NEW: memory race sequence
}

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    createGame(state, action: PayloadAction<{ key: GameKey; isMultiplayer?: boolean }>) {
      state.id = genId()
      state.key = action.payload.key
      state.isMultiplayer = !!action.payload.isMultiplayer
      if (action.payload.key === 'memory-race') {
        state.board = emptyMemoryCells(9)
      } else {
        state.board = emptyCells()
      }
      state.players = []
      state.status = 'ongoing'
      state.turnPlayerId = 'player1'
    },
    setBoard(state, action: PayloadAction<Cell[]>) {
      state.board = action.payload
    },
    setMultiplayerBoard(state, action: PayloadAction<Cell[]>) {
      // NEW: update board coming from backend
      state.board = action.payload
    },
    setPlayers(state, action: PayloadAction<any[]>) {
      state.players = action.payload
    },
    setStatus(state, action: PayloadAction<GameState['status']>) {
      state.status = action.payload
    },
    setTurn(state, action: PayloadAction<string | null>) {
      state.turnPlayerId = action.payload
    },
    makeMove(state, action: PayloadAction<{ index: number; value: string }>) {
      const { index, value } = action.payload
      state.board = state.board.map(cell => 
        cell.index === index ? { ...cell, value } : cell
      )
      // Switch turns
      state.turnPlayerId = state.turnPlayerId === 'player1' ? 'player2' : 'player1'
    },
    recordGameResult(state, action: PayloadAction<{ winner: string | null; isDraw: boolean }>) {
      state.gamesPlayed += 1
      if (action.payload.winner === 'X') {
        state.gamesWon += 1
      }
    },
    resetGame(state) {
      state.id = undefined
      state.key = undefined
      state.board = emptyCells()
      state.players = []
      state.status = 'idle'
      state.turnPlayerId = null
      state.isMultiplayer = false
      state.connectionStatus = 'disconnected'
      state.sequence = []
    },
    setMemorySequence(state, action: PayloadAction<number[]>) {
      state.sequence = action.payload
      state.board = state.board.map((cell, index) => ({
        ...cell,
        value: action.payload[index] ? String(action.payload[index]) : null
      }))
    },
    setConnectionStatus(state, action: PayloadAction<'connected' | 'disconnected' | 'connecting'>) {
      // NEW: SignalR connection state
      state.connectionStatus = action.payload
    }
  }
})

export const {
  createGame,
  setBoard,
  setMultiplayerBoard,
  setPlayers,
  setStatus,
  setTurn,
  makeMove,
  recordGameResult,
  resetGame,
  setMemorySequence,
  setConnectionStatus
} = gameSlice.actions

export default gameSlice.reducer
