import React, { useEffect, useState } from 'react'
import { useAppSelector, useAppDispatch } from '../store/hooks'
import { setBoard, setMemorySequence, resetGame, createGame, recordGameResult } from '../store/game/gameSlice'

export default function MemoryBoard() {
  const dispatch = useAppDispatch()
  const board = useAppSelector(s => s.game.board)
  const gamesWon = useAppSelector(s => s.game.gamesWon)
  const gamesPlayed = useAppSelector(s => s.game.gamesPlayed)
  const [playerSequence, setPlayerSequence] = useState<number[]>([])
  const [gameStarted, setGameStarted] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [round, setRound] = useState(1)
  const [gameResultRecorded, setGameResultRecorded] = useState(false)

  // Generate random sequence of numbers 1-9
  const generateSequence = () => {
    const numbers = Array.from({length: 9}, (_, i) => i + 1)
    return numbers.sort(() => Math.random() - 0.5)
  }

  // Initialize game
  useEffect(() => {
    if (!gameStarted) {
      const sequence = generateSequence()
      console.log('Generated sequence:', sequence) // Debug log
      dispatch(setMemorySequence(sequence))
      setGameStarted(true)
    }
  }, [gameStarted, dispatch])

  // Debug log to see board values
  useEffect(() => {
    console.log('Board values:', board.map(cell => ({ index: cell.index, value: cell.value, revealed: cell.revealed })))
  }, [board])

  const handleFlip = (index: number) => {
    if (gameOver || board[index].revealed) return

    // Always show the number when clicked
    const newBoard = board.map(cell => 
      cell.index === index ? { ...cell, revealed: true } : cell
    )
    dispatch(setBoard(newBoard))

    const actualValue = parseInt(board[index].value || '0')
    const expectedValue = playerSequence.length + 1 // Next number in sequence (1, 2, 3...)

    if (actualValue !== expectedValue) {
      // Wrong number - flip ALL cards back and reset sequence
      setTimeout(() => {
        const resetBoard = board.map(cell => ({ ...cell, revealed: false }))
        dispatch(setBoard(resetBoard))
        setPlayerSequence([]) // Reset the sequence - start over
      }, 1000)
    } else {
      // Correct number - add to sequence and keep revealed
      const newPlayerSequence = [...playerSequence, index]
      setPlayerSequence(newPlayerSequence)

      if (newPlayerSequence.length === 9) {
        // Completed the sequence!
        setGameOver(true)
        if (!gameResultRecorded) {
          dispatch(recordGameResult({ winner: 'X', isDraw: false }))
          setGameResultRecorded(true)
        }
      }
    }
  }

  const getCardClass = (revealed: boolean) => {
    if (revealed) return 'memory-card memory-card-revealed'
    return 'memory-card memory-card-hidden'
  }

  const startNewRound = () => {
    const sequence = generateSequence()
    console.log('New round sequence:', sequence) // Debug log
    dispatch(setMemorySequence(sequence))
    setPlayerSequence([])
    setGameOver(false)
    setGameResultRecorded(false)
    setRound(prev => prev + 1)
    
    // Reset all cards
    const resetBoard = board.map(cell => ({ ...cell, revealed: false }))
    dispatch(setBoard(resetBoard))
  }

  const startNewGame = () => {
    setGameStarted(false)
    setGameOver(false)
    setRound(1)
    setPlayerSequence([])
    setGameResultRecorded(false)
    dispatch(resetGame())
    setTimeout(() => {
      dispatch(createGame({ key: 'memory-race' }))
    }, 100)
  }

  const getStatusText = () => {
    if (gameOver) return 'Round Complete!'
    if (playerSequence.length === 0) return 'Find and click the number 1'
    return `Find and click the number ${playerSequence.length + 1}`
  }

  const getWinRate = () => {
    if (gamesPlayed === 0) return '0%'
    return `${Math.round((gamesWon / gamesPlayed) * 100)}%`
  }

  return (
    <div>
      {/* Game Stats */}
      <div className="stats" style={{marginBottom: '24px'}}>
        <div className="stat">
          <div className="stat-number" style={{fontSize: '2rem'}}>{gamesWon}</div>
          <div className="stat-label">Rounds Won</div>
        </div>
        <div className="stat">
          <div className="stat-number purple" style={{fontSize: '2rem'}}>{gamesPlayed}</div>
          <div className="stat-label">Rounds Played</div>
        </div>
        <div className="stat">
          <div className="stat-number green" style={{fontSize: '2rem'}}>{getWinRate()}</div>
          <div className="stat-label">Win Rate</div>
        </div>
      </div>

      {/* Debug info */}
      <div style={{fontSize: '12px', color: '#666', marginBottom: '10px', textAlign: 'center'}}>
        Debug: {board.map(cell => `${cell.index}:${cell.value || '?'}`).join(' ')}
      </div>

      {/* Memory Grid - 3x3 */}
      <div className="memory-grid-3x3">
        {board.map(cell => (
          <button 
            key={cell.index} 
            onClick={() => handleFlip(cell.index)}
            className={getCardClass(!!cell.revealed)}
            disabled={gameOver}
          >
{cell.revealed ? (cell.value || '?') : '?'}
          </button>
        ))}
      </div>
      
      <div className="text-center mt-6">
        <div className="badge">
          <span className="live-dot" style={{background:'#f59e0b'}}></span>
          <span className="text-sm">Round {round} • {getStatusText()}</span>
        </div>
        
        {gameOver && (
          <div className="mt-6">
            <div style={{fontSize: '4rem', marginBottom: '16px'}}>🎉</div>
            <div style={{fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '16px'}}>
              Perfect Memory!
            </div>
            <div className="flex gap-3 justify-center" style={{flexWrap:'wrap'}}>
              <button 
                className="btn btn-solid"
                onClick={startNewRound}
              >
                🔄 Next Round
              </button>
              <button 
                className="btn btn-outline"
                onClick={startNewGame}
              >
                🏠 New Game
              </button>
            </div>
          </div>
        )}
        
        {!gameOver && (
          <p className="text-xs" style={{marginTop:8}}>
            Click any card to see its number. Find the correct number in sequence (1, 2, 3... 9). Wrong numbers reset the round!
          </p>
        )}
      </div>
    </div>
  )
}