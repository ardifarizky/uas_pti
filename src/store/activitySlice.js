import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  activeQuests: [],
  availableQuests: [],
  completedQuests: [],
  questIdCounter: 1
}

export const activitySlice = createSlice({
  name: 'activity',
  initialState,
  reducers: {
    createQuest: (state, action) => {
      const quest = {
        id: state.questIdCounter++,
        title: action.payload.title || `Quest ${state.questIdCounter}`,
        description: action.payload.description || 'Complete this quest',
        x: action.payload.x || 0,
        y: action.payload.y || 0,
        destination: action.payload.destination || 'house', // beach, mountain, house
        statChanges: {
          meal: action.payload.statChanges?.meal || 0,
          sleep: action.payload.statChanges?.sleep || 0,
          happiness: action.payload.statChanges?.happiness || 0,
          cleanliness: action.payload.statChanges?.cleanliness || 0,
          money: action.payload.statChanges?.money || 0
        },
        scoreIncrease: action.payload.scoreIncrease || 0,
        isActive: false,
        isCompleted: false,
        createdAt: Date.now()
      }
      
      state.availableQuests.push(quest)
    },
    
    startQuest: (state, action) => {
      const questId = action.payload
      const questIndex = state.availableQuests.findIndex(q => q.id === questId)
      
      if (questIndex !== -1) {
        const quest = state.availableQuests[questIndex]
        quest.isActive = true
        state.activeQuests.push(quest)
        state.availableQuests.splice(questIndex, 1)
      }
    },
    
    completeQuest: (state, action) => {
      const questId = action.payload
      const questIndex = state.activeQuests.findIndex(q => q.id === questId)
      
      if (questIndex !== -1) {
        const quest = state.activeQuests[questIndex]
        quest.isCompleted = true
        quest.completedAt = Date.now()
        state.completedQuests.push(quest)
        state.activeQuests.splice(questIndex, 1)
      }
    },
    
    cancelQuest: (state, action) => {
      const questId = action.payload
      const questIndex = state.activeQuests.findIndex(q => q.id === questId)
      
      if (questIndex !== -1) {
        const quest = state.activeQuests[questIndex]
        quest.isActive = false
        state.availableQuests.push(quest)
        state.activeQuests.splice(questIndex, 1)
      }
    },
    
    removeQuest: (state, action) => {
      const questId = action.payload
      
      // Remove from all arrays
      state.availableQuests = state.availableQuests.filter(q => q.id !== questId)
      state.activeQuests = state.activeQuests.filter(q => q.id !== questId)
      state.completedQuests = state.completedQuests.filter(q => q.id !== questId)
    },
    
    clearCompletedQuests: (state) => {
      state.completedQuests = []
    },
    
    clearAllQuests: (state) => {
      console.log('Clearing all quests');
      state.availableQuests = [];
      state.activeQuests = [];
      state.completedQuests = [];
      state.questIdCounter = 1;
    }
  },
})

export const { 
  createQuest, 
  startQuest, 
  completeQuest, 
  cancelQuest, 
  removeQuest, 
  clearCompletedQuests,
  clearAllQuests 
} = activitySlice.actions

export default activitySlice.reducer 