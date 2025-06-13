import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import '../styles/Leaderboard.css'

export default function Leaderboard({ session, saveScore }) {
  const [scores, setScores] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchScores()
  }, [])

  // Refresh leaderboard periodically to show updated scores
  useEffect(() => {
    const interval = setInterval(() => {
      fetchScores()
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const fetchScores = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .order('score', { ascending: false })
        .limit(10)

      if (error) throw error
      console.log('Fetched scores:', data);
      setScores(data || [])
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  // saveScore function is now passed as prop from parent component

  if (loading) return (
    <div className="leaderboard">
      <h2>Leaderboard</h2>
      <div className="leaderboard-loading">Loading...</div>
    </div>
  )
  
  if (error) return (
    <div className="leaderboard">
      <h2>Leaderboard</h2>
      <div className="leaderboard-empty">Error: {error}</div>
    </div>
  )

  return (
    <div className="leaderboard">
      <h2>Leaderboard</h2>
      <div className="leaderboard-list">
        {scores.length === 0 ? (
          <div className="leaderboard-empty">
            🎮 No scores yet!<br />
            Be the first to play!
          </div>
        ) : (
          scores.map((score, index) => (
            <div key={score.id} className="leaderboard-item">
              <span className="rank">
                {index + 1}
              </span>
              <span className="player-name">
                {score.username === 'Anonymous Guest' ? '👤 Guest Player' : score.username}
              </span>
              <span className="score">{score.score}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
} 