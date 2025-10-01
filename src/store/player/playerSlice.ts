import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { type Player } from '../../types'

const initialState: Player | null = null

const slice = createSlice<Player | null, any, 'player'>({
  name: 'player',
  initialState,
  reducers: {
    setPlayer: (_state: any, action: PayloadAction<Player>) => {
      return action.payload
    },
    clearPlayer: () => {
      return null
    }
  }
})

export const { setPlayer, clearPlayer } = slice.actions
export default slice.reducer