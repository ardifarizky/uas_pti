import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { resetGame } from '../store/gameStatsSlice'
import { clearAllQuests } from '../store/activitySlice'
import '../styles/GameOver.css'

const GameOver = ({ failedStat, onRestart }) => {
  const dispatch = useDispatch()
  const currentScore = useSelector(state => state.gameStats.score)

  const handleRestart = () => {
    // Reset game stats
    dispatch(resetGame())
    
    // Clear all quests
    dispatch(clearAllQuests())
    
    // Call parent restart function
    if (onRestart) {
      onRestart()
    }
  }

  const getStatMessage = (stat) => {
    const messages = {
      meal: {
        title: "Starvation!",
        message: "You ran out of food and starved to death.",
        icon: "🍽️"
      },
      sleep: {
        title: "Exhaustion!",
        message: "You collapsed from extreme exhaustion.",
        icon: "😴"
      },
      happiness: {
        title: "Depression!",
        message: "Your happiness reached rock bottom and you gave up.",
        icon: "😢"
      },
      cleanliness: {
        title: "Disease!",
        message: "Poor hygiene led to serious illness.",
        icon: "🦠"
      }
    }
    
    return messages[stat] || {
      title: "Game Over!",
      message: "You failed to maintain your basic needs.",
      icon: "💀"
    }
  }

  const statInfo = getStatMessage(failedStat)

  return (
    <div className="game-over-overlay">
      <div className="game-over-modal">
        <div className="game-over-icon">
          {statInfo.icon}
        </div>
        
        <h1 className="game-over-title">{statInfo.title}</h1>
        
        <p className="game-over-message">
          {statInfo.message}
        </p>
        
        <div className="game-over-stats">
          <div className="final-score">
            <h3>🏆 Final Score: {currentScore}</h3>
            <p>Score recorded! Check the leaderboard to see your ranking.</p>
          </div>
          
          <h3>Final Stats:</h3>
          <div className="final-stats-grid">
            <div className="final-stat">
              <span className="stat-name">Meal:</span>
              <span className={`stat-value ${failedStat === 'meal' ? 'failed' : ''}`}>
                {failedStat === 'meal' ? '0%' : 'N/A'}
              </span>
            </div>
            <div className="final-stat">
              <span className="stat-name">Sleep:</span>
              <span className={`stat-value ${failedStat === 'sleep' ? 'failed' : ''}`}>
                {failedStat === 'sleep' ? '0%' : 'N/A'}
              </span>
            </div>
            <div className="final-stat">
              <span className="stat-name">Happiness:</span>
              <span className={`stat-value ${failedStat === 'happiness' ? 'failed' : ''}`}>
                {failedStat === 'happiness' ? '0%' : 'N/A'}
              </span>
            </div>
            <div className="final-stat">
              <span className="stat-name">Cleanliness:</span>
              <span className={`stat-value ${failedStat === 'cleanliness' ? 'failed' : ''}`}>
                {failedStat === 'cleanliness' ? '0%' : 'N/A'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="game-over-actions">
          <button 
            className="restart-button"
            onClick={handleRestart}
          >
            🔄 Restart Game
          </button>
        </div>
        
        <div className="game-over-tips">
          <h4>💡 Tips for next time:</h4>
          <ul>
            <li>Complete quests to improve your stats</li>
            <li>Monitor your stats regularly</li>
            <li>Balance different activities</li>
            <li>Don't let any stat get too low</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default GameOver 