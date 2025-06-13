import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { 
  createQuestAtLocation, 
  createQuestFromTemplate, 
  createNewQuest 
} from '../utils/questCreator'

const SampleQuests = () => {
  const questCount = useSelector(state => 
    state.activity.availableQuests.length + 
    state.activity.activeQuests.length + 
    state.activity.completedQuests.length
  )

  useEffect(() => {
    // Only create quests if there are none (prevents duplicates on restart)
    if (questCount > 0) return;
    
    // Add sample quests with a delay to ensure Redux is ready
    const timer = setTimeout(() => {
      // Create quests using the quest creator utility
      
      // Beach activities
      createQuestAtLocation('beachRelax', 'beachEntrance')
      
      // House activities
      createQuestAtLocation('cooking', 'houseEntrance')
      createQuestAtLocation('houseCleaning', 'houseEntrance', {
        title: "House Maintenance",
        description: "Fix and clean things around the house"
      })
      
      // Mountain activities
      createQuestAtLocation('mountainHike', 'mountainEntrance')
      
      // Custom quests at specific locations
      createNewQuest({
        title: "Shopping Trip",
        description: "Go shopping for supplies and groceries",
        x: 200,
        y: 600,
        destination: "house",
        statChanges: {
          meal: 10,
          sleep: -10,
          happiness: 5,
          cleanliness: 0,
          money: -100
        },
        scoreIncrease: 50
      })
      
      // Work quest
      createQuestFromTemplate('work', 600, 200, {
        title: "Office Work",
        description: "Complete your daily work tasks"
      })
      
      console.log('Sample quests created successfully!')
    }, 1000)

    return () => clearTimeout(timer)
  }, [questCount])

  return null // This component doesn't render anything
}

export default SampleQuests 