import React from 'react'
import { useAppSelector, useAppDispatch } from '../store/hooks'
import { setBoard } from '../store/game/gameSlice'


export default function MemoryBoard(){
const dispatch = useAppDispatch()
const board = useAppSelector(s => s.game.board)


const handleFlip = (i:number) => {
const newBoard = board.map(c => c.index === i ? { ...c, revealed: !c.revealed, value: c.value ?? String((c.index%9)+1) } : c)
dispatch(setBoard(newBoard))
}


return (
<div>
<div className="grid grid-cols-3 gap-2">
{board.map(cell => (
<button key={cell.index} onClick={()=>handleFlip(cell.index)} className="h-24 rounded-lg bg-slate-200 flex items-center justify-center">
{cell.revealed ? (<span className="text-2xl font-bold">{cell.value}</span>) : (<span className="text-slate-400">Flip</span>)}
</button>
))}
</div>
<div className="mt-4 text-sm text-slate-600">Revealed state tracked • Turn placeholder</div>
</div>
)
}