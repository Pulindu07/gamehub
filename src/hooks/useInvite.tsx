import React from 'react'
import { genId } from '../utils/id'
import { apiService } from '../services/apiService'


export const useInvite = (gameKey?: string) => {
  // createInvite now attempts to create the game on the server and returns the real gameId
  const createInvite = async (playerName = 'Player') => {
    let gameId = genId();
    try {
      // request server to create a game; apiService.start will create and set currentGameId when called with no gameId and a gameKey
      if (gameKey) {
        await apiService.start(null, playerName, gameKey);
        const diag = apiService.getDiagnostics();
        if (diag && diag.gameId) {
          gameId = String(diag.gameId);
        }
      }
    } catch (err) {
      // if server-side create fails, fall back to locally generated id
      console.warn('Failed to create server game for invite, falling back to local id:', err);
    }

    const url = `${window.location.origin}/game/${encodeURIComponent(gameId)}?game=${encodeURIComponent(gameKey||'')}&name=${encodeURIComponent(playerName)}`
    return { gameId, url }
  }


  const shareWhatsApp = (url:string) => {
    const wa = `https://wa.me/?text=${encodeURIComponent(url)}`
    window.open(wa, '_blank')
  }


  return { createInvite, shareWhatsApp }
}