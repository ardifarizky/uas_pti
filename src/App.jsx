import { useState, useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { supabase } from './lib/supabase'
import Login from './components/Login'
import Leaderboard from './components/Leaderboard'
import GameStats from './game/GameStats'
import CharacterSelect from './components/CharacterSelect'
import ActivityHandler from './components/ActivityHandler'
import SampleQuests from './components/SampleQuests'
import GameOver from './components/GameOver'
import Inventory from './components/Inventory'
import Coordinates from './components/Coordinates'
import { increaseScore } from './store/gameStatsSlice'
import { store } from './store/index.js'
import reduxBridge from './game/ReduxBridge'
import Phaser from 'phaser'
import config from './game/config'
import './styles/App.css'
import './index.css'

function App() {
  const [session, setSession] = useState(null)
  const [isGuest, setIsGuest] = useState(false)
  const [playerInfo, setPlayerInfo] = useState(null)
  const [gameOver, setGameOver] = useState(false)
  const [failedStat, setFailedStat] = useState(null)
  const [scoreSaved, setScoreSaved] = useState(false)
  const gameRef = useRef(null)
  
  const dispatch = useDispatch()
  const currentScore = useSelector(state => state.gameStats.score)
  const gameStats = useSelector(state => state.gameStats.stats)

  // Initialize Redux bridge
  useEffect(() => {
    reduxBridge.init(store)
  }, [])

  // Monitor stats for game over condition
  useEffect(() => {
    if (!playerInfo || gameOver) return;

    const checkGameOver = () => {
      const { meal, sleep, happiness, cleanliness } = gameStats;
      
      if (meal <= 0) {
        setFailedStat('meal');
        setGameOver(true);
        console.log('Game Over: Meal reached 0%');
        // Save score when game ends
        saveScoreToLeaderboard(currentScore);
      } else if (sleep <= 0) {
        setFailedStat('sleep');
        setGameOver(true);
        console.log('Game Over: Sleep reached 0%');
        // Save score when game ends
        saveScoreToLeaderboard(currentScore);
      } else if (happiness <= 0) {
        setFailedStat('happiness');
        setGameOver(true);
        console.log('Game Over: Happiness reached 0%');
        // Save score when game ends
        saveScoreToLeaderboard(currentScore);
      } else if (cleanliness <= 0) {
        setFailedStat('cleanliness');
        setGameOver(true);
        console.log('Game Over: Cleanliness reached 0%');
        // Save score when game ends
        saveScoreToLeaderboard(currentScore);
      }
    };

    checkGameOver();
  }, [gameStats, playerInfo, gameOver, currentScore])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (playerInfo) {
      // Initialize the game with player info
      if (!gameRef.current) {
        const gameConfig = {
          ...config,
          callbacks: {
            ...config.callbacks,
            preBoot: (game) => {
              // Pass player info to the game
              game.registry.set('playerInfo', playerInfo)
            }
          }
        }
        gameRef.current = new Phaser.Game(gameConfig)
      }
    }

    return () => {
      // Clean up the game when component unmounts
      if (gameRef.current) {
        gameRef.current.destroy(true)
        gameRef.current = null
      }
    }
  }, [playerInfo])

  // Add a new useEffect for score progression
  useEffect(() => {
    let scoreInterval;
    if (playerInfo) { // Only start the score timer if player is selected
      scoreInterval = setInterval(() => {
        dispatch(increaseScore(10)); // Increase score by 10 every 10 seconds
      }, 10000); // Update every 10 seconds (10000 ms)
    }

    return () => clearInterval(scoreInterval);
  }, [playerInfo, dispatch]); // Rerun when playerInfo changes (i.e., game starts)

  // Function to save score to leaderboard
  const saveScoreToLeaderboard = async (score) => {
    try {
      const scoreValue = parseInt(score)
      const username = session ? session.user.email : 'Anonymous Guest'
      const userId = session ? session.user.id : null
      
      // Check if user already has a score
      const { data: existingScores, error: fetchError } = await supabase
        .from('leaderboard')
        .select('*')
        .eq('user_id', userId)
        .eq('username', username)

      if (fetchError) {
        console.error('Error fetching existing scores:', fetchError)
        throw fetchError
      }

      if (existingScores && existingScores.length > 0) {
        // User has existing scores
        const highestExisting = Math.max(...existingScores.map(s => s.score))
        
        if (scoreValue > highestExisting) {
          // New score is higher, delete old scores and insert new one
          const { error: deleteError } = await supabase
            .from('leaderboard')
            .delete()
            .eq('user_id', userId)
            .eq('username', username)

          if (deleteError) {
            console.error('Error deleting old scores:', deleteError)
            throw deleteError
          }

          // Insert new high score
          const { data, error } = await supabase
            .from('leaderboard')
            .insert([{
              score: scoreValue,
              username: username,
              user_id: userId,
            }])
            .select()

          if (error) {
            console.error('Error saving new high score:', error)
            throw error
          }
          
          console.log('New high score saved:', data)
          setScoreSaved(true)
        } else {
          // Score is not higher, don't save
          console.log('Score not higher than existing high score, not saving')
          setScoreSaved(true)
        }
      } else {
        // First time playing, insert new score
        const { data, error } = await supabase
          .from('leaderboard')
          .insert([{
            score: scoreValue,
            username: username,
            user_id: userId,
          }])
          .select()

        if (error) {
          console.error('Error saving first score:', error)
          throw error
        }
        
        console.log('First score saved:', data)
        setScoreSaved(true)
      }
    } catch (error) {
      console.error('Failed to save score:', error.message)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setIsGuest(false)
    setPlayerInfo(null)
  }

  const handleSkipLogin = () => {
    setIsGuest(true)
  }



  const handleStartGame = (info) => {
    setPlayerInfo(info)
  }

  const handleRestart = () => {
    // Reset game over state
    setGameOver(false)
    setFailedStat(null)
    setScoreSaved(false)
    
    // Destroy existing game
    if (gameRef.current) {
      gameRef.current.destroy(true)
      gameRef.current = null
    }
    
    // Reset to character selection
    setPlayerInfo(null)
    
    console.log('Game restarted')
  }

  if (!session && !isGuest) {
    return <Login onSkip={handleSkipLogin} />
  }

  if (!playerInfo) {
    return <CharacterSelect onStartGame={handleStartGame} />
  }

  return (
    <div className="app">
      <SampleQuests />
      <div className="header">
        <h1>🏝️ UCUP MENJELAJAH NUSANTARA 🏝️</h1>
        {session && <button className="logout-btn" onClick={handleSignOut}>⚙️</button>}
      </div>
      <div className="content">
        <div className="left-column">
          <Inventory />
        </div>
        <div className="game-section">
          <h2>Skor Petualangan: {currentScore}</h2>
          <div id="game-container"></div>
        </div>
        <div className="right-column">
          <GameStats />
          <Leaderboard session={session} saveScore={saveScoreToLeaderboard} />
        </div>
      </div>
      
      {/* React UI Components */}
      <Coordinates />
      
      {/* Game Over Modal */}
      {gameOver && (
        <GameOver 
          failedStat={failedStat} 
          onRestart={handleRestart}
        />
      )}
    </div>
  )
}

export default App
