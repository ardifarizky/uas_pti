import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  x: 0,
  y: 0,
  scene: 'MainScene',
  isVisible: true
}

export const coordinatesSlice = createSlice({
  name: 'coordinates',
  initialState,
  reducers: {
    updatePosition: (state, action) => {
      const { x, y } = action.payload
      state.x = Math.round(x)
      state.y = Math.round(y)
    },
    updateScene: (state, action) => {
      state.scene = action.payload
    },
    toggleVisibility: (state) => {
      state.isVisible = !state.isVisible
    },
    setVisibility: (state, action) => {
      state.isVisible = action.payload
    }
  }
})

export const { 
  updatePosition, 
  updateScene, 
  toggleVisibility, 
  setVisibility 
} = coordinatesSlice.actions

export default coordinatesSlice.reducer 