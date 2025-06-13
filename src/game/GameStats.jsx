import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateTime, updateStats } from '../store/gameStatsSlice';
import '../styles/GameStats.css';

const GameStats = () => {
  const dispatch = useDispatch();
  const { gameTime, stats } = useSelector(state => state.gameStats);

  // Time progression
  useEffect(() => {
    const timer = setInterval(() => {
      // Update time
      const newTime = { ...gameTime };
      newTime.minute += 1;

      if (newTime.minute >= 60) {
        newTime.minute = 0;
        newTime.hour += 1;
      }

      if (newTime.hour >= 24) {
        newTime.hour = 0;
        newTime.day += 1;
      }

      dispatch(updateTime(newTime));
      
      // Decrease stats over time
      dispatch(updateStats());
    }, 100); // Update every 100ms

    return () => clearInterval(timer);
  }, [dispatch, gameTime]);

  const formatTime = (hour, minute) => {
    const formattedHour = hour.toString().padStart(2, '0');
    const formattedMinute = minute.toString().padStart(2, '0');
    return `${formattedHour}:${formattedMinute}`;
  };

  return (
    <div className="game-stats">
      <div className="time-display">
        <h2>Hari {gameTime.day}</h2>
        <h3>{formatTime(gameTime.hour, gameTime.minute)}</h3>
      </div>
      
      <div className="stats-container">
        <div className="stat">
          <span>🍛 Makanan:</span>
          <div className="stat-bar">
            <div 
              className="stat-fill" 
              style={{ width: `${stats.meal}%`, backgroundColor: '#228B22' }}
            />
          </div>
          <span>{Math.round(stats.meal)}%</span>
        </div>

        <div className="stat">
          <span>😴 Tidur:</span>
          <div className="stat-bar">
            <div 
              className="stat-fill" 
              style={{ width: `${stats.sleep}%`, backgroundColor: '#1E90FF' }}
            />
          </div>
          <span>{Math.round(stats.sleep)}%</span>
        </div>

        <div className="stat">
          <span>😊 Kebahagiaan:</span>
          <div className="stat-bar">
            <div 
              className="stat-fill" 
              style={{ width: `${stats.happiness}%`, backgroundColor: '#FFD700' }}
            />
          </div>
          <span>{Math.round(stats.happiness)}%</span>
        </div>

        <div className="stat">
          <span>🧼 Kebersihan:</span>
          <div className="stat-bar">
            <div 
              className="stat-fill" 
              style={{ width: `${stats.cleanliness}%`, backgroundColor: '#FF8C00' }}
            />
          </div>
          <span>{Math.round(stats.cleanliness)}%</span>
        </div>

        <div className="stat">
          <span>💰 Uang:</span>
          <span className="money">Rp {stats.money.toLocaleString('id-ID')}</span>
        </div>
      </div>
    </div>
  );
};

export default GameStats; 