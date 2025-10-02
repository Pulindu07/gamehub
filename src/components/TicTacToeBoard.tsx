import { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { makeMove, resetGame, createGame, recordGameResult } from '../store/game/gameSlice';
import { signalRService } from '../services/signalrService';

interface TicTacToeBoardProps {
  isMultiplayer?: boolean;
  gameId?: string;
  playerName?: string;
  gameKey?: string;
}

export default function TicTacToeBoard({
  isMultiplayer = false,
  gameId,
  playerName,
  gameKey
}: TicTacToeBoardProps) {
  const dispatch = useAppDispatch()
  const board = useAppSelector(s => s.game.board)
  const [gameResultRecorded, setGameResultRecorded] = useState(false)
  const [connectionStarted, setConnectionStarted] = useState(false);

  // Check for win condition
  const checkWinner = (board: any[]) => {
    const winPatterns = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
      [0, 4, 8], [2, 4, 6] // diagonals
    ]

    for (const pattern of winPatterns) {
      const [a, b, c] = pattern
      if (board[a]?.value && board[a].value === board[b]?.value && board[a].value === board[c]?.value) {
        return board[a].value
      }
    }
    return null
  }

  // Check for draw
  const isDraw = (board: any[]) => {
    return board.every(cell => cell.value !== null)
  }

  // Smart AI move - try to win, then block, then random
  const getAIMove = (board: any[]) => {
    const emptyCells = board.filter(cell => !cell.value)
    if (emptyCells.length === 0) return null

    // Try to win (get 3 O's in a row)
    for (const cell of emptyCells) {
      const testBoard = board.map(c => c.index === cell.index ? { ...c, value: 'O' } : c)
      if (checkWinner(testBoard) === 'O') {
        return cell.index
      }
    }

    // Try to block (prevent 3 X's in a row)
    for (const cell of emptyCells) {
      const testBoard = board.map(c => c.index === cell.index ? { ...c, value: 'X' } : c)
      if (checkWinner(testBoard) === 'X') {
        return cell.index
      }
    }

    // Prefer center, then corners, then edges
    const center = 4
    if (emptyCells.find(cell => cell.index === center)) return center

    const corners = [0, 2, 6, 8]
    for (const corner of corners) {
      if (emptyCells.find(cell => cell.index === corner)) return corner
    }

    const edges = [1, 3, 5, 7]
    for (const edge of edges) {
      if (emptyCells.find(cell => cell.index === edge)) return edge
    }

    // Fallback to random
    return emptyCells[Math.floor(Math.random() * emptyCells.length)].index
  }

  // Handle player move
  const handleClick = (index: number) => {
    if (turnPlayerId !== 'player1' || board[index].value) return;

    if (isMultiplayer && gameId) {
      signalRService.sendFlip(index); // Send move to server
    } else {
      dispatch(makeMove({ index, value: 'X' }));
    }
  }

  // AI move effect
  useEffect(() => {
    if (turnPlayerId === 'player2' && gameStatus === 'ongoing') {
      const winner = checkWinner(board)
      const draw = isDraw(board)
      
      if (!winner && !draw) {
        const aiMove = getAIMove(board)
        if (aiMove !== null) {
          setTimeout(() => {
            dispatch(makeMove({ index: aiMove, value: 'O' }))
          }, 500) // Small delay for better UX
        }
      }
    }
  }, [turnPlayerId, board, dispatch, gameStatus])

  // SignalR connection effect for multiplayer
  useEffect(() => {
    if (isMultiplayer && gameId && !connectionStarted) {
      const startConnection = async () => {
        try {
          await signalRService.start(gameId);
          setConnectionStarted(true);

          signalRService.onBoardUpdate((updatedBoard) => {
            dispatch(makeMove(updatedBoard));
          });

          signalRService.onGameOver(() => {
            dispatch(recordGameResult({ winner: 'O', isDraw: false }));
          });
        } catch (error) {
          console.error('Failed to start SignalR connection:', error);
        }
      };
      startConnection();

      // Cleanup on unmount
      return () => {
        signalRService.stop();
        setConnectionStarted(false);
      };
    }
  }, [isMultiplayer, gameId, connectionStarted, dispatch]);

  const getCellClass = (value: string | null) => {
    if (!value) return 'cell cell-empty'
    if (value === 'X') return 'cell cell-x'
    if (value === 'O') return 'cell cell-o'
    return 'cell'
  }

  const winner = checkWinner(board)
  const draw = isDraw(board)
  const gameOver = winner || draw

  // Record game result when game ends
  useEffect(() => {
    if (gameOver && !gameResultRecorded) {
      dispatch(recordGameResult({ winner, isDraw: draw }))
      setGameResultRecorded(true)
    }
  }, [gameOver, gameResultRecorded, winner, draw, dispatch])

  const getStatusText = () => {
    if (winner) return `${winner} wins!`
    if (draw) return 'It\'s a draw!'
    if (turnPlayerId === 'player1') return 'Your turn (X)'
    if (turnPlayerId === 'player2') return 'AI thinking...'
    return 'Game ready'
  }

  return (
    <div>
      <div className="board">
        {board.map(cell => (
          <button 
            key={cell.index} 
            onClick={() => handleClick(cell.index)}
            disabled={!!cell.value || turnPlayerId !== 'player1' || gameOver}
            className={getCellClass(cell.value)}
          >
            {cell.value || ''}
          </button>
        ))}
      </div>
      
      <div className="text-center mt-6">
        <div className="badge">
          <span className="live-dot"></span>
          <span className="text-sm">{getStatusText()}</span>
        </div>
        
        {/* Large win/draw display */}
        {gameOver && (
          <div className="mt-6">
            <div style={{fontSize: '4rem', marginBottom: '16px'}}>
              {winner === 'X' ? '🎉' : winner === 'O' ? '😢' : '🤝'}
            </div>
            <div style={{fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '16px'}}>
              {winner === 'X' ? 'You Win!' : winner === 'O' ? 'AI Wins!' : 'Draw!'}
            </div>
            <button 
              className="btn btn-solid"
              onClick={() => {
                setGameResultRecorded(false)
                dispatch(resetGame())
                // Create a new game after reset
                setTimeout(() => {
                  dispatch(createGame({ key: 'tic-tac-toe' }))
                }, 100)
              }}
            >
              🔄 New Game
            </button>
          </div>
        )}
        
        {!gameOver && (
          <p className="text-xs" style={{marginTop:8}}>
            {turnPlayerId === 'player1' ? 'Click any empty cell to make your move' : 'AI is making a move...'}
          </p>
        )}
      </div>
    </div>
  )
}