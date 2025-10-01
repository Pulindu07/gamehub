import React from 'react'
import { useAppSelector, useAppDispatch } from '../store/hooks'
import { setBoard } from '../store/game/gameSlice'


export default function TicTacToeBoard(){
const dispatch = useAppDispatch()
const board = useAppSelector(s => s.game.board)


const handleClick = (i:number) => {
const newBoard = board.map(c => c.index === i ? { ...c, value: c.value ? c.value : 'X' } : c)
dispatch(setBoard(newBoard))
}


return (
<div>
<div className="grid grid-cols-3 gap-2">
{board.map(cell => (
<button key={cell.index} onClick={()=>handleClick(cell.index)} className="h-24 rounded-lg text-2xl bg-slate-100 flex items-center justify-center">{cell.value || ''}</button>
))}
</div>
<div className="mt-4 text-sm text-slate-600">Turn: placeholder • Realtime placeholder</div>
</div>
)
}