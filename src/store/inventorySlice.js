import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  items: {
    coffee: 1 // Initialize with 1 coffee like the original
  },
  activeEffects: []
}

export const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    addItem: (state, action) => {
      const { itemId, quantity = 1 } = action.payload
      if (state.items[itemId]) {
        state.items[itemId] += quantity
      } else {
        state.items[itemId] = quantity
      }
    },
    removeItem: (state, action) => {
      const { itemId, quantity = 1 } = action.payload
      if (state.items[itemId]) {
        if (state.items[itemId] <= quantity) {
          delete state.items[itemId]
        } else {
          state.items[itemId] -= quantity
        }
      }
    },
    useItem: (state, action) => {
      const { itemId } = action.payload
      if (state.items[itemId] && state.items[itemId] > 0) {
        // Apply item effects
        switch (itemId) {
          case 'coffee':
            state.activeEffects.push({
              id: 'speed_boost',
              name: 'Speed Boost',
              duration: 10000,
              startTime: Date.now()
            })
            break
        }
        
        // Remove one item
        if (state.items[itemId] <= 1) {
          delete state.items[itemId]
        } else {
          state.items[itemId] -= 1
        }
      }
    },
    removeEffect: (state, action) => {
      const { effectId } = action.payload
      state.activeEffects = state.activeEffects.filter(effect => effect.id !== effectId)
    }
  }
})

export const { 
  addItem, 
  removeItem, 
  useItem, 
  removeEffect 
} = inventorySlice.actions

export default inventorySlice.reducer 