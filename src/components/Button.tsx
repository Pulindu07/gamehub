import React from 'react'
import clsx from 'clsx'


export default function Button({ children, variant='solid', className='', ...props }:{ children:React.ReactNode, variant?:'solid'|'outline', className?:string } & React.ButtonHTMLAttributes<HTMLButtonElement>){
return (
<button {...props} className={clsx('px-4 py-2 rounded-lg font-medium', className, {
'bg-indigo-600 text-white hover:bg-indigo-700': variant === 'solid',
'border border-slate-200 text-slate-700 bg-white hover:bg-slate-50': variant === 'outline'
})}>
{children}
</button>
)
}