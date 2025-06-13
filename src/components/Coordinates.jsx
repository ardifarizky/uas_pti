import { useSelector, useDispatch } from 'react-redux'
import { useEffect } from 'react'
import { toggleVisibility } from '../store/coordinatesSlice'
import '../styles/Coordinates.css'

const Coordinates = () => {
  const dispatch = useDispatch()
  const { x, y, scene, isVisible } = useSelector(state => state.coordinates)

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === 'c' || event.key === 'C') {
        dispatch(toggleVisibility())
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [dispatch])

  const getSceneName = (sceneKey) => {
    // Location names removed for cleaner gameplay
    return '---'
  }

  if (!isVisible) {
    return (
      <div className="coordinates-toggle">
        <button 
          className="toggle-btn" 
          onClick={() => dispatch(toggleVisibility())}
          title="Show Coordinates (Press C)"
        >
          📍
        </button>
      </div>
    )
  }

  return (
    <div className="coordinates-container">
      <div className="coordinates-header">
        <h3>POSITION</h3>
        <button 
          className="toggle-btn" 
          onClick={() => dispatch(toggleVisibility())}
          title="Hide Coordinates (Press C)"
        >
          ×
        </button>
      </div>
      
      <div className="coordinates-info">
        <div className="coordinate-item">
          <span className="coordinate-label">X:</span>
          <span className="coordinate-value">{x}</span>
        </div>
        <div className="coordinate-item">
          <span className="coordinate-label">Y:</span>
          <span className="coordinate-value">{y}</span>
        </div>
        <div className="coordinate-item">
          <span className="coordinate-label">Area:</span>
          <span className="coordinate-value">{getSceneName(scene)}</span>
        </div>
      </div>

      <div className="coordinates-instructions">
        <p>Press C to toggle coordinates</p>
      </div>
    </div>
  )
}

export default Coordinates 