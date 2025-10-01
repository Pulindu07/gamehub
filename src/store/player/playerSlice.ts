import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { type Player } from '../../types'

const initialState: Player | null = null

const reducers = {
  setPlayer: (_state: Player | null, action: PayloadAction<Player>) => action.payload as Player | null,
  clearPlayer: (_state: Player | null) => null as Player | null
}

const slice = createSlice<Player | null, typeof reducers, 'player', never>({
  name: 'player',
  initialState,
  reducers
})

export const { setPlayer, clearPlayer } = slice.actions
export default slice.reducer