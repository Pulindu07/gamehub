import { useMemo } from 'react'
import { genId } from '../utils/id'


export const useInvite = (gameKey?: string) => {
const createInvite = (playerName = 'Player') => {
const gameId = genId()
const url = `${window.location.origin}/game/${encodeURIComponent(gameId)}?game=${encodeURIComponent(gameKey||'')}&name=${encodeURIComponent(playerName)}`
return { gameId, url }
}


const shareWhatsApp = (url:string) => {
const wa = `https://wa.me/?text=${encodeURIComponent(url)}`
window.open(wa, '_blank')
}


return { createInvite, shareWhatsApp }
}