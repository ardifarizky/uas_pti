import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { startQuest, cancelQuest, removeQuest } from '../store/activitySlice'
import '../styles/ActivityHandler.css'

const ActivityHandler = () => {
  const dispatch = useDispatch()
  const { availableQuests, activeQuests, completedQuests } = useSelector(state => state.activity)

  const handleStartQuest = (questId) => {
    dispatch(startQuest(questId))
  }

  const handleCancelQuest = (questId) => {
    dispatch(cancelQuest(questId))
  }

  const handleRemoveQuest = (questId) => {
    dispatch(removeQuest(questId))
  }

  // Limit to 3 quests per section
  const limitedAvailableQuests = availableQuests.slice(0, 3)
  const limitedActiveQuests = activeQuests.slice(0, 3)
  const limitedCompletedQuests = completedQuests.slice(0, 3)

  return (
    <div className="activity-handler">
      <div className="quest-sections">
        {/* Available Quests */}
        <div className="quest-section">
          <h3>Available ({availableQuests.length})</h3>
          {limitedAvailableQuests.map(quest => (
            <div key={quest.id} className="quest-card available">
              <div className="quest-info">
                <h4>{quest.title}</h4>
                <div className="quest-details">
                  <span>({quest.x}, {quest.y})</span>
                  <span>{quest.destination}</span>
                  <span>+{quest.scoreIncrease}</span>
                </div>
              </div>
              <div className="quest-actions">
                <button onClick={() => handleStartQuest(quest.id)}>Start</button>
                <button onClick={() => handleRemoveQuest(quest.id)}>Remove</button>
              </div>
            </div>
          ))}
        </div>

        {/* Active Quests */}
        <div className="quest-section">
          <h3>Active ({activeQuests.length})</h3>
          {limitedActiveQuests.map(quest => (
            <div key={quest.id} className="quest-card active">
              <div className="quest-info">
                <h4>{quest.title}</h4>
                <div className="quest-details">
                  <span>({quest.x}, {quest.y})</span>
                  <span>{quest.destination}</span>
                  <span>+{quest.scoreIncrease}</span>
                </div>
                <div className="quest-instructions">
                  <span>🎮 Press 'Q' at marker</span>
                </div>
              </div>
              <div className="quest-actions">
                <button onClick={() => handleCancelQuest(quest.id)}>Cancel</button>
              </div>
            </div>
          ))}
        </div>

        {/* Completed Quests */}
        <div className="quest-section">
          <h3>Completed ({completedQuests.length})</h3>
          {limitedCompletedQuests.map(quest => (
            <div key={quest.id} className="quest-card completed">
              <div className="quest-info">
                <h4>{quest.title}</h4>
                <div className="quest-details">
                  <span>+{quest.scoreIncrease}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ActivityHandler 