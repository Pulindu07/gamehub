import React from 'react'


export default function Card({ title, subtitle, children }:{ title:string, subtitle?:string, children?:React.ReactNode }){
return (
<div className="card-shadow">
<h3 className="text-lg font-semibold">{title}</h3>
{subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
<div>{children}</div>
</div>
)
}