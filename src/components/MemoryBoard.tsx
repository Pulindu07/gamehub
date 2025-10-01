import React from 'react'
import { useAppSelector, useAppDispatch } from '../store/hooks'
import { setBoard } from '../store/game/gameSlice'

export default function MemoryBoard() {
  const dispatch = useAppDispatch()
  const board = useAppSelector(s => s.game.board)

  const handleFlip = (i: number) => {
    const newBoard = board.map(c => c.index === i ? { ...c, revealed: !c.revealed, value: c.value ?? String((c.index%9)+1) } : c)
    dispatch(setBoard(newBoard))
  }

  const getCardStyle = (revealed: boolean, value: string | null) => {
    if (revealed) {
      return 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg'
    }
    return 'bg-gradient-to-br from-slate-200 to-slate-300 hover:from-slate-300 hover:to-slate-400 text-slate-600'
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
        {board.map(cell => (
          <button 
            key={cell.index} 
            onClick={() => handleFlip(cell.index)}
            className={`
              h-20 w-20 rounded-xl text-2xl font-bold 
              flex items-center justify-center 
              transition-all duration-300 
              transform hover:scale-105 active:scale-95
              shadow-lg hover:shadow-xl
              ${getCardStyle(cell.revealed || false, cell.value)}
            `}
          >
            {cell.revealed ? (
              <span className="animate-bounce">
                {cell.value}
              </span>
            ) : (
              <span className="text-slate-500 font-medium">
                ?
              </span>
            )}
          </button>
        ))}
      </div>
      
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 rounded-full shadow-md">
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-gray-700">
            Memory Game • Turn placeholder
          </span>
        </div>
        <p className="text-xs text-gray-500">
          Click cards to reveal numbers and test your memory
        </p>
      </div>
    </div>
  )
}