class InventoryManager {
    constructor() {
        this.items = new Map();
        this.activeEffects = new Map();
        this.ui = null;
        this.scene = null;
        
        // Initialize with 1 coffee
        this.addItem('coffee', 1);
    }

    init(scene) {
        this.scene = scene;
        this.createUI();
        this.setupKeyboardControls();
    }

    addItem(itemId, quantity = 1) {
        if (this.items.has(itemId)) {
            this.items.set(itemId, this.items.get(itemId) + quantity);
        } else {
            this.items.set(itemId, quantity);
        }
        this.updateUI();
    }

    removeItem(itemId, quantity = 1) {
        if (this.items.has(itemId)) {
            const currentQuantity = this.items.get(itemId);
            if (currentQuantity <= quantity) {
                this.items.delete(itemId);
            } else {
                this.items.set(itemId, currentQuantity - quantity);
            }
            this.updateUI();
            return true;
        }
        return false;
    }

    hasItem(itemId) {
        return this.items.has(itemId) && this.items.get(itemId) > 0;
    }

    getItemQuantity(itemId) {
        return this.items.get(itemId) || 0;
    }

    useItem(itemId) {
        if (!this.hasItem(itemId)) {
            return false;
        }

        switch (itemId) {
            case 'coffee':
                this.useCoffee();
                break;
        }

        this.removeItem(itemId, 1);
        return true;
    }

    useCoffee() {
        // Apply speed boost effect for 10 seconds
        const effectId = 'speed_boost';
        const duration = 10000; // 10 seconds
        
        // Remove any existing speed boost
        if (this.activeEffects.has(effectId)) {
            this.scene.time.removeEvent(this.activeEffects.get(effectId));
        }
        
        // Apply the effect
        this.scene.playerSpeedMultiplier = 2.0; // Double speed
        
        // Create timer to remove effect
        const timer = this.scene.time.delayedCall(duration, () => {
            this.scene.playerSpeedMultiplier = 1.0; // Reset to normal speed
            this.activeEffects.delete(effectId);
            this.updateUI();
        });
        
        this.activeEffects.set(effectId, timer);
        this.updateUI();
        
        // Show visual feedback
        this.showItemUsedMessage('Coffee consumed! Speed boost for 10s');
    }

    createUI() {
        if (!this.scene) return;

        // Create inventory background
        this.ui = this.scene.add.container(10, 60);
        this.ui.setDepth(1000);
        this.ui.setScrollFactor(0, 0); // Explicitly set both X and Y scroll factors to 0

        // Background panel
        this.bg = this.scene.add.rectangle(0, 0, 200, 120, 0x000000, 0.7)
            .setOrigin(0, 0);
        this.ui.add(this.bg);

        // Title
        this.titleText = this.scene.add.text(10, 10, 'INVENTORY', {
            fontSize: '14px',
            fill: '#fff',
            fontStyle: 'bold'
        });
        this.ui.add(this.titleText);

        // Items text
        this.itemsText = this.scene.add.text(10, 35, '', {
            fontSize: '12px',
            fill: '#fff'
        });
        this.ui.add(this.itemsText);

        // Effects text
        this.effectsText = this.scene.add.text(10, 80, '', {
            fontSize: '12px',
            fill: '#00ff00'
        });
        this.ui.add(this.effectsText);

        // Instructions
        this.instructionsText = this.scene.add.text(10, 100, 'Press 1 to use Coffee', {
            fontSize: '10px',
            fill: '#aaa'
        });
        this.ui.add(this.instructionsText);

        this.updateUI();
    }

    updateUI() {
        if (!this.itemsText || !this.effectsText) return;

        // Update items display
        let itemsDisplay = '';
        for (const [itemId, quantity] of this.items) {
            const itemName = this.getItemName(itemId);
            itemsDisplay += `${itemName}: ${quantity}\n`;
        }
        this.itemsText.setText(itemsDisplay || 'No items');

        // Update effects display
        let effectsDisplay = '';
        if (this.activeEffects.has('speed_boost')) {
            effectsDisplay = 'SPEED BOOST ACTIVE!';
        }
        this.effectsText.setText(effectsDisplay);
    }

    getItemName(itemId) {
        const itemNames = {
            'coffee': 'Coffee'
        };
        return itemNames[itemId] || itemId;
    }

    setupKeyboardControls() {
        if (!this.scene) return;

        // Add key for using coffee (key "1")
        this.coffeeKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
        
        // Handle key press in scene's update method
        this.scene.input.keyboard.on('keydown-ONE', () => {
            if (this.hasItem('coffee')) {
                this.useItem('coffee');
            }
        });
    }

    showItemUsedMessage(message) {
        if (!this.scene) return;

        // Create temporary message
        const messageText = this.scene.add.text(
            this.scene.cameras.main.width / 2,
            this.scene.cameras.main.height / 2,
            message,
            {
                fontSize: '16px',
                fill: '#00ff00',
                backgroundColor: '#000',
                padding: { x: 10, y: 5 }
            }
        )
        .setOrigin(0.5)
        .setDepth(2000)
        .setScrollFactor(0, 0); // Explicitly set both X and Y scroll factors to 0

        // Fade out after 2 seconds
        this.scene.tweens.add({
            targets: messageText,
            alpha: 0,
            duration: 2000,
            onComplete: () => {
                messageText.destroy();
            }
        });
    }

    destroy() {
        // Clean up active effects
        for (const timer of this.activeEffects.values()) {
            this.scene.time.removeEvent(timer);
        }
        this.activeEffects.clear();

        if (this.ui) {
            this.ui.destroy();
        }
    }
}

// Singleton instance
let inventoryInstance = null;

export function getInventoryManager() {
    if (!inventoryInstance) {
        inventoryInstance = new InventoryManager();
    }
    return inventoryInstance;
}

export default InventoryManager; 