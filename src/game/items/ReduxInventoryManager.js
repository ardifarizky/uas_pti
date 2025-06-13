import reduxBridge from '../ReduxBridge.js';

class ReduxInventoryManager {
    constructor() {
        this.scene = null;
        this.speedMultiplierInterval = null;
    }

    init(scene) {
        this.scene = scene;
        this.setupSpeedBoostMonitoring();
    }

    // Monitor for speed boost effects and apply to scene
    setupSpeedBoostMonitoring() {
        if (!this.scene) return;

        // Check speed boost status every second
        this.speedMultiplierInterval = setInterval(() => {
            if (reduxBridge.hasSpeedBoost()) {
                this.scene.playerSpeedMultiplier = 2.0;
            } else {
                this.scene.playerSpeedMultiplier = 1.0;
            }
        }, 1000);
    }

    // Listen for inventory actions from React UI
    // This will be called by the Redux store when inventory changes
    handleInventoryChange(inventoryState) {
        // Apply effects based on inventory state
        if (this.scene) {
            const hasSpeedBoost = inventoryState.activeEffects.some(effect => 
                effect.id === 'speed_boost' && 
                (Date.now() - effect.startTime) < effect.duration
            );
            
            this.scene.playerSpeedMultiplier = hasSpeedBoost ? 2.0 : 1.0;
        }
    }

    // Legacy methods for compatibility - now they use Redux
    addItem(itemId, quantity = 1) {
        reduxBridge.addItemToInventory(itemId, quantity);
    }

    removeItem(itemId, quantity = 1) {
        reduxBridge.removeItemFromInventory(itemId, quantity);
    }

    hasItem(itemId) {
        const inventory = reduxBridge.getInventory();
        return inventory && inventory.items[itemId] > 0;
    }

    getItemQuantity(itemId) {
        const inventory = reduxBridge.getInventory();
        return inventory ? (inventory.items[itemId] || 0) : 0;
    }

    useItem(itemId) {
        if (!this.hasItem(itemId)) {
            return false;
        }

        reduxBridge.useItemFromInventory(itemId);
        return true;
    }

    destroy() {
        if (this.speedMultiplierInterval) {
            clearInterval(this.speedMultiplierInterval);
            this.speedMultiplierInterval = null;
        }
    }
}

// Create a singleton instance
let reduxInventoryManager = null;

export function getReduxInventoryManager() {
    if (!reduxInventoryManager) {
        reduxInventoryManager = new ReduxInventoryManager();
    }
    return reduxInventoryManager;
} 