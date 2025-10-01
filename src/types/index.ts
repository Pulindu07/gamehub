export type GameKey = 'tic-tac-toe' | 'memory-race'


export interface Player {
id: string
name: string
isHost?: boolean
mark?: 'X' | 'O' | number
}

export type Cell = { index: number; value: string | null; revealed?: boolean }


export interface GameState {
id?: string
key?: GameKey
board: Cell[]
turnPlayerId?: string | null
players: Player[]
status: 'idle' | 'ongoing' | 'finished'
}


export interface RootState {}