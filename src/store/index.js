import { configureStore } from '@reduxjs/toolkit'
import gameStatsReducer from './gameStatsSlice'
import activityReducer from './activitySlice'
import inventoryReducer from './inventorySlice'
import coordinatesReducer from './coordinatesSlice'

export const store = configureStore({
  reducer: {
    gameStats: gameStatsReducer,
    activity: activityReducer,
    inventory: inventoryReducer,
    coordinates: coordinatesReducer,
  },
}) 