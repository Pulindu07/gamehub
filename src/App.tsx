import React from 'react'
import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import GamePage from './pages/GamePage'


export default function App(){
return (
<div className="min-h-screen bg-gradient-to-br from-sky-50 to-indigo-50 p-6">
<Routes>
<Route path="/" element={<LandingPage/>} />
<Route path="/game/:gameId" element={<GamePage/>} />
<Route path="/invite" element={<GamePage/>} />
</Routes>
</div>
)
}