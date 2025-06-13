// Quest Creator Utility
// Use this file to easily create quests programmatically

import { store } from '../store/index.js'
import { createQuest } from '../store/activitySlice.js'

/**
 * Create a new quest and add it to the store
 * @param {Object} questData - Quest configuration object
 * @param {string} questData.title - Quest title
 * @param {string} questData.description - Quest description
 * @param {number} questData.x - X coordinate for quest marker
 * @param {number} questData.y - Y coordinate for quest marker
 * @param {string} questData.destination - Destination (house, beach, mountain)
 * @param {Object} questData.statChanges - Stat changes when quest is completed
 * @param {number} questData.statChanges.meal - Meal stat change (-100 to 100)
 * @param {number} questData.statChanges.sleep - Sleep stat change (-100 to 100)
 * @param {number} questData.statChanges.happiness - Happiness stat change (-100 to 100)
 * @param {number} questData.statChanges.cleanliness - Cleanliness stat change (-100 to 100)
 * @param {number} questData.statChanges.money - Money change (can be negative)
 * @param {number} questData.scoreIncrease - Score points awarded
 */
export const createNewQuest = (questData) => {
  const quest = {
    title: questData.title || 'Untitled Quest',
    description: questData.description || 'Complete this quest',
    x: questData.x || 0,
    y: questData.y || 0,
    destination: questData.destination || 'house',
    statChanges: {
      meal: questData.statChanges?.meal || 0,
      sleep: questData.statChanges?.sleep || 0,
      happiness: questData.statChanges?.happiness || 0,
      cleanliness: questData.statChanges?.cleanliness || 0,
      money: questData.statChanges?.money || 0
    },
    scoreIncrease: questData.scoreIncrease || 0
  }
  
  store.dispatch(createQuest(quest))
  console.log(`Quest created: ${quest.title}`)
  return quest
}

/**
 * Create multiple quests at once
 * @param {Array} questsArray - Array of quest data objects
 */
export const createMultipleQuests = (questsArray) => {
  questsArray.forEach(questData => {
    createNewQuest(questData)
  })
  console.log(`Created ${questsArray.length} quests`)
}

/**
 * Predefined quest templates for common activities
 */
export const questTemplates = {
  // Eating/Cooking activities
  cooking: {
    title: "Cooking Session",
    description: "Prepare a delicious meal",
    destination: "house",
    statChanges: { meal: 25, sleep: -5, happiness: 15, cleanliness: -10, money: -20 },
    scoreIncrease: 75
  },
  
  eating: {
    title: "Meal Time",
    description: "Enjoy a satisfying meal",
    destination: "house",
    statChanges: { meal: 40, happiness: 10, money: -15 },
    scoreIncrease: 50
  },

  // Sleeping activities
  nap: {
    title: "Quick Nap",
    description: "Take a refreshing nap",
    destination: "house",
    statChanges: { sleep: 30, happiness: 5 },
    scoreIncrease: 40
  },
  
  fullSleep: {
    title: "Good Night's Sleep",
    description: "Get a full night of rest",
    destination: "house",
    statChanges: { sleep: 80, happiness: 15, meal: -10 },
    scoreIncrease: 100
  },

  // Cleaning activities
  shower: {
    title: "Take a Shower",
    description: "Clean up and feel refreshed",
    destination: "house",
    statChanges: { cleanliness: 50, happiness: 10, sleep: -5 },
    scoreIncrease: 60
  },
  
  houseCleaning: {
    title: "House Cleaning",
    description: "Clean and organize the house",
    destination: "house",
    statChanges: { cleanliness: 30, happiness: 20, sleep: -15, money: 0 },
    scoreIncrease: 90
  },

  // Work/Money activities
  work: {
    title: "Work Shift",
    description: "Complete a work shift to earn money",
    destination: "house",
    statChanges: { meal: -15, sleep: -20, happiness: -5, cleanliness: -10, money: 150 },
    scoreIncrease: 120
  },
  
  partTimeJob: {
    title: "Part-time Job",
    description: "Do some part-time work",
    destination: "house",
    statChanges: { meal: -10, sleep: -10, happiness: 5, money: 75 },
    scoreIncrease: 80
  },

  // Recreation activities
  beachRelax: {
    title: "Beach Relaxation",
    description: "Relax and unwind at the beach",
    destination: "beach",
    statChanges: { happiness: 25, sleep: -5, cleanliness: -15 },
    scoreIncrease: 85
  },
  
  mountainHike: {
    title: "Mountain Adventure",
    description: "Explore the mountains",
    destination: "mountain",
    statChanges: { meal: -20, sleep: -25, happiness: 30, cleanliness: -20 },
    scoreIncrease: 150
  },

  // Shopping activities
  groceryShopping: {
    title: "Grocery Shopping",
    description: "Buy food and supplies",
    destination: "house",
    statChanges: { meal: 15, happiness: 5, sleep: -10, money: -80 },
    scoreIncrease: 60
  },
  
  clothesShopping: {
    title: "Clothes Shopping",
    description: "Buy new clothes",
    destination: "house",
    statChanges: { happiness: 20, cleanliness: 10, sleep: -10, money: -120 },
    scoreIncrease: 70
  }
}

/**
 * Create a quest from a template
 * @param {string} templateName - Name of the template to use
 * @param {number} x - X coordinate for quest marker
 * @param {number} y - Y coordinate for quest marker
 * @param {Object} overrides - Optional overrides for template values
 */
export const createQuestFromTemplate = (templateName, x, y, overrides = {}) => {
  const template = questTemplates[templateName]
  if (!template) {
    console.error(`Template "${templateName}" not found`)
    return null
  }
  
  const questData = {
    ...template,
    x,
    y,
    ...overrides
  }
  
  return createNewQuest(questData)
}

/**
 * Helper function to create quests at common locations
 */
export const commonLocations = {
  houseEntrance: { x: 523, y: 538 },
  beachEntrance: { x: 25, y: 980 },
  mountainEntrance: { x: 997, y: 749 },
  townCenter: { x: 400, y: 400 },
  parkArea: { x: 200, y: 600 },
  shopArea: { x: 600, y: 200 }
}

/**
 * Quick function to create a quest at a common location
 * @param {string} templateName - Template to use
 * @param {string} locationName - Common location name
 * @param {Object} overrides - Optional overrides
 */
export const createQuestAtLocation = (templateName, locationName, overrides = {}) => {
  const location = commonLocations[locationName]
  if (!location) {
    console.error(`Location "${locationName}" not found`)
    return null
  }
  
  return createQuestFromTemplate(templateName, location.x, location.y, overrides)
}

// Example usage (commented out):
/*
// Create a single quest
createNewQuest({
  title: "Morning Exercise",
  description: "Start the day with some exercise",
  x: 300,
  y: 400,
  destination: "house",
  statChanges: {
    meal: -10,
    sleep: -15,
    happiness: 20,
    cleanliness: -25,
    money: 0
  },
  scoreIncrease: 100
})

// Create quest from template
createQuestFromTemplate('cooking', 400, 300)

// Create quest at common location
createQuestAtLocation('beachRelax', 'beachEntrance')

// Create multiple quests
createMultipleQuests([
  { title: "Quest 1", x: 100, y: 100, statChanges: { happiness: 10 }, scoreIncrease: 50 },
  { title: "Quest 2", x: 200, y: 200, statChanges: { meal: 20 }, scoreIncrease: 75 }
])
*/ 