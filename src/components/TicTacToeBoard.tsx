import React from 'react'
import { useAppSelector, useAppDispatch } from '../store/hooks'
import { setBoard } from '../store/game/gameSlice'

export default function TicTacToeBoard() {
  const dispatch = useAppDispatch()
  const board = useAppSelector(s => s.game.board)

  const handleClick = (i: number) => {
    const newBoard = board.map(c => c.index === i ? { ...c, value: c.value ? c.value : 'X' } : c)
    dispatch(setBoard(newBoard))
  }

  const getCellClass = (value: string | null) => {
    if (!value) return 'cell cell-empty'
    if (value === 'X') return 'cell cell-x'
    if (value === 'O') return 'cell cell-o'
    return 'cell'
  }

  return (
    <div>
      <div className="board">
        {board.map(cell => (
          <button 
            key={cell.index} 
            onClick={() => handleClick(cell.index)}
            disabled={!!cell.value}
            className={getCellClass(cell.value)}
          >
            {cell.value || ''}
          </button>
        ))}
      </div>
      
      <div className="text-center mt-6">
        <div className="badge">
          <span className="live-dot"></span>
          <span className="text-sm">Turn: Player X • Realtime placeholder</span>
        </div>
        <p className="text-xs" style={{marginTop:8}}>Click any empty cell to make your move</p>
      </div>
    </div>
  )
}