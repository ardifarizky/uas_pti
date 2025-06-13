# Activity Handler System

This activity handler system allows you to create custom quests in your PhaserJS + ReactJS game with full Redux state management.

## Features

- **Code-Based Quest Creation**: Create quests programmatically through JavaScript code
- **Redux State Management**: All game stats and quest data managed through Redux
- **Phaser Integration**: Quest markers appear in the game world with visual indicators
- **Real-time Updates**: Stats and scores update immediately when quests are completed
- **Multiple Destinations**: Quests can be set for different locations (house, beach, mountain)
- **Quest Templates**: Pre-built templates for common activities
- **Helper Functions**: Easy-to-use utilities for quest creation

## How to Use

### 1. Creating Quests

Create quests programmatically using the quest creator utility:

```javascript
import { createNewQuest, createQuestFromTemplate, createQuestAtLocation } from './utils/questCreator'

// Method 1: Create a custom quest
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

// Method 2: Use a pre-built template
createQuestFromTemplate('cooking', 400, 300)

// Method 3: Create quest at a common location
createQuestAtLocation('beachRelax', 'beachEntrance')
```

**Quest Parameters:**
- **Title**: Name of your quest
- **Description**: What the quest involves
- **X/Y Coordinates**: Where the quest marker appears in the game world
- **Destination**: Where the quest takes place (house, beach, mountain)
- **Stat Changes**: How completing the quest affects player stats:
  - Meal: Food/hunger level (-100 to +100)
  - Sleep: Rest/energy level (-100 to +100)
  - Happiness: Mood level (-100 to +100)
  - Cleanliness: Hygiene level (-100 to +100)
  - Money: Player's money (can be negative for costs)
- **Score Increase**: Points awarded for completing the quest

### 2. Quest States

Quests have three states:
- **Available**: Created but not started
- **Active**: Started and can be completed in-game
- **Completed**: Finished and rewards applied

### 3. In-Game Interaction

- Quest markers appear as yellow pulsing circles in the game world
- Walk near a quest marker to see the completion prompt
- Press **Q** to complete a quest when near its marker
- Stats and score update immediately upon completion
- **Important**: Quests can ONLY be completed in-game, not from the UI

### 4. Quest Templates

The system includes pre-built templates for common activities:

**Available Templates:**
- `cooking` - Cooking sessions
- `eating` - Meal time
- `nap` - Quick nap
- `fullSleep` - Full night's sleep
- `shower` - Take a shower
- `houseCleaning` - Clean the house
- `work` - Work shift
- `partTimeJob` - Part-time work
- `beachRelax` - Beach relaxation
- `mountainHike` - Mountain hiking
- `groceryShopping` - Grocery shopping
- `clothesShopping` - Clothes shopping

**Common Locations:**
- `houseEntrance` - House door (523, 538)
- `beachEntrance` - Beach entrance (25, 980)
- `mountainEntrance` - Mountain entrance (997, 749)
- `townCenter` - Town center (400, 400)
- `parkArea` - Park area (200, 600)
- `shopArea` - Shopping area (600, 200)

## Technical Implementation

### Redux Store Structure

```javascript
// Game Stats
gameStats: {
  gameTime: { day, hour, minute },
  stats: { meal, sleep, happiness, cleanliness, money },
  score: number
}

// Activity System
activity: {
  availableQuests: [],
  activeQuests: [],
  completedQuests: [],
  questIdCounter: number
}
```

### Key Components

- **ActivityHandler.jsx**: UI for quest management and display
- **questCreator.js**: Utility functions for creating quests programmatically
- **ReduxBridge.js**: Connects Phaser game with Redux store
- **gameStatsSlice.js**: Manages player stats and score
- **activitySlice.js**: Manages quest states and actions

### Phaser Integration

The system integrates with Phaser through:
- Quest markers rendered in game world
- Proximity detection for quest completion
- Real-time updates when Redux state changes
- Visual feedback for quest interactions

## Customization

You can easily customize:
- Quest types and categories
- Stat effects and ranges
- Visual appearance of quest markers
- Completion requirements
- Reward systems

The system is designed to be extensible and can be adapted for different game mechanics and requirements. 