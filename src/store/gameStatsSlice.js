import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  gameTime: {
    day: 1,
    hour: 8,
    minute: 0
  },
  stats: {
    meal: 100,
    sleep: 100,
    happiness: 100,
    cleanliness: 100,
    money: 1000
  },
  score: 0
}

export const gameStatsSlice = createSlice({
  name: 'gameStats',
  initialState,
  reducers: {
    updateTime: (state, action) => {
      state.gameTime = action.payload
    },
    updateStats: (state, action) => {
      // Decrease stats over time
      state.stats.meal = Math.max(0, state.stats.meal - 0.1)
      state.stats.sleep = Math.max(0, state.stats.sleep - 0.1)
      state.stats.happiness = Math.max(0, state.stats.happiness - 0.05)
      state.stats.cleanliness = Math.max(0, state.stats.cleanliness - 0.1)
    },
    modifyStats: (state, action) => {
      // Apply stat changes from activities/quests
      console.log('Modifying stats with:', action.payload);
      const { meal, sleep, happiness, cleanliness, money } = action.payload
      
      if (meal !== undefined) {
        const oldMeal = state.stats.meal;
        state.stats.meal = Math.max(0, Math.min(100, state.stats.meal + meal));
        console.log(`Meal: ${oldMeal} + ${meal} = ${state.stats.meal}`);
      }
      if (sleep !== undefined) {
        const oldSleep = state.stats.sleep;
        state.stats.sleep = Math.max(0, Math.min(100, state.stats.sleep + sleep));
        console.log(`Sleep: ${oldSleep} + ${sleep} = ${state.stats.sleep}`);
      }
      if (happiness !== undefined) {
        const oldHappiness = state.stats.happiness;
        state.stats.happiness = Math.max(0, Math.min(100, state.stats.happiness + happiness));
        console.log(`Happiness: ${oldHappiness} + ${happiness} = ${state.stats.happiness}`);
      }
      if (cleanliness !== undefined) {
        const oldCleanliness = state.stats.cleanliness;
        state.stats.cleanliness = Math.max(0, Math.min(100, state.stats.cleanliness + cleanliness));
        console.log(`Cleanliness: ${oldCleanliness} + ${cleanliness} = ${state.stats.cleanliness}`);
      }
      if (money !== undefined) {
        const oldMoney = state.stats.money;
        state.stats.money = Math.max(0, state.stats.money + money);
        console.log(`Money: ${oldMoney} + ${money} = ${state.stats.money}`);
      }
    },
    updateScore: (state, action) => {
      state.score = action.payload
    },
    increaseScore: (state, action) => {
      console.log(`Increasing score by ${action.payload}. Current score: ${state.score}`);
      state.score += action.payload;
      console.log(`New score: ${state.score}`);
    },
    resetGame: (state) => {
      console.log('Resetting game to initial state');
      state.gameTime = {
        day: 1,
        hour: 8,
        minute: 0
      };
      state.stats = {
        meal: 100,
        sleep: 100,
        happiness: 100,
        cleanliness: 100,
        money: 1000
      };
      state.score = 0;
    }
  },
})

export const { 
  updateTime, 
  updateStats, 
  modifyStats, 
  updateScore, 
  increaseScore,
  resetGame 
} = gameStatsSlice.actions

export default gameStatsSlice.reducer 