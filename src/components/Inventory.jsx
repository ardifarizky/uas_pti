import { useSelector, useDispatch } from 'react-redux'
import { useState, useEffect } from 'react'
import { useItem, removeEffect } from '../store/inventorySlice'
import { modifyStats } from '../store/gameStatsSlice'
import '../styles/Inventory.css'

const Inventory = () => {
  const dispatch = useDispatch()
  const { items, activeEffects } = useSelector(state => state.inventory)
  const [message, setMessage] = useState('')

  // Handle effect expiration
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      activeEffects.forEach(effect => {
        if (now - effect.startTime >= effect.duration) {
          dispatch(removeEffect({ effectId: effect.id }))
        }
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [activeEffects, dispatch])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === '1' && items.coffee > 0) {
        handleUseItem('coffee')
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [items, dispatch])

  const handleUseItem = (itemId) => {
    if (items[itemId] > 0) {
      dispatch(useItem({ itemId }))
      
      // Handle stat changes for Indonesian drinks
      if (itemId === 'es_kelapa') {
        dispatch(modifyStats({ meal: 20 }))
      } else if (itemId === 'es_campur') {
        dispatch(modifyStats({ meal: 25 }))
      } else if (itemId === 'es_cendol') {
        dispatch(modifyStats({ meal: 30 }))
      }
      
      showMessage(getItemUseMessage(itemId))
    }
  }

  const showMessage = (msg) => {
    setMessage(msg)
    setTimeout(() => setMessage(''), 3000)
  }

  const getItemName = (itemId) => {
    const itemNames = {
      coffee: 'Coffee',
      es_kelapa: 'Es Kelapa',
      es_campur: 'Es Campur', 
      es_cendol: 'Es Cendol'
    }
    return itemNames[itemId] || itemId
  }

  const getItemUseMessage = (itemId) => {
    const messages = {
      coffee: 'Coffee consumed! Speed boost for 10s',
      es_kelapa: 'Es Kelapa diminum! Makanan +20',
      es_campur: 'Es Campur diminum! Makanan +25',
      es_cendol: 'Es Cendol diminum! Makanan +30'
    }
    return messages[itemId] || `Used ${getItemName(itemId)}`
  }

  const getRemainingTime = (effect) => {
    const elapsed = Date.now() - effect.startTime
    const remaining = Math.max(0, effect.duration - elapsed)
    return Math.ceil(remaining / 1000)
  }

  return (
    <div className="inventory-container">
      <div className="inventory-header">
        <h3>INVENTORY</h3>
      </div>
      
      <div className="inventory-items">
        {Object.keys(items).length === 0 ? (
          <p className="no-items">No items</p>
        ) : (
          Object.entries(items).map(([itemId, quantity]) => (
            <div key={itemId} className="inventory-item">
              <span className="item-name">{getItemName(itemId)}: {quantity}</span>
              {(itemId === 'coffee' || itemId === 'es_kelapa' || itemId === 'es_campur' || itemId === 'es_cendol') && (
                <button 
                  className="use-btn" 
                  onClick={() => handleUseItem(itemId)}
                  title={`Use ${getItemName(itemId)}`}
                >
                  Use
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {activeEffects.length > 0 && (
        <div className="active-effects">
          <h4>Active Effects</h4>
          {activeEffects.map(effect => (
            <div key={effect.id} className="effect-item">
              <span className="effect-name">{effect.name}</span>
              <span className="effect-time">({getRemainingTime(effect)}s)</span>
            </div>
          ))}
        </div>
      )}

      <div className="inventory-instructions">
        <p>Press 1 to use Coffee</p>
        <p>Visit Warung Minuman at beach for Indonesian drinks!</p>
      </div>

      {message && (
        <div className="inventory-message">
          {message}
        </div>
      )}
    </div>
  )
}

export default Inventory 