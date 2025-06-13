// ReduxBridge.js - Utility to connect Phaser with Redux
import { completeQuest } from '../store/activitySlice.js'
import { modifyStats, increaseScore } from '../store/gameStatsSlice.js'
import { addItem, removeItem, useItem } from '../store/inventorySlice.js'
import { updatePosition, updateScene } from '../store/coordinatesSlice.js'

class ReduxBridge {
  constructor() {
    this.store = null;
    this.listeners = new Map();
    this.questCooldowns = new Map(); // Track quest cooldowns
    this.dailyQuestCompletions = new Map(); // Track quests completed per day
    this.currentGameDay = 1; // Track current game day
  }

  // Initialize the bridge with the Redux store
  init(store) {
    this.store = store;
    console.log('ReduxBridge initialized with store');
    
    // Initialize current day from store
    const state = this.store.getState();
    this.currentGameDay = state.gameStats?.stats?.day || 1;
    
    // Start monitoring day changes
    this.monitorDayChanges();
  }

  // Monitor day changes and update quest system
  monitorDayChanges() {
    if (!this.store) return;

    let previousDay = this.currentGameDay;
    
    this.store.subscribe(() => {
      const state = this.store.getState();
      const currentDay = state.gameStats?.stats?.day || 1;
      
      if (currentDay !== previousDay) {
        console.log(`Day changed from ${previousDay} to ${currentDay}`);
        this.updateGameDay(currentDay);
        previousDay = currentDay;
      }
    });
  }

  // Get current state
  getState() {
    return this.store ? this.store.getState() : null;
  }

  // Dispatch an action
  dispatch(action) {
    if (this.store) {
      return this.store.dispatch(action);
    }
    console.warn('ReduxBridge: No store available for dispatch');
  }

  // Subscribe to store changes
  subscribe(callback) {
    if (this.store) {
      return this.store.subscribe(callback);
    }
    console.warn('ReduxBridge: No store available for subscription');
  }

  // Get active quests
  getActiveQuests() {
    const state = this.getState();
    return state ? state.activity.activeQuests : [];
  }

  // Get available quests
  getAvailableQuests() {
    const state = this.getState();
    return state ? state.activity.availableQuests : [];
  }

  // Get game stats
  getGameStats() {
    const state = this.getState();
    return state ? state.gameStats : null;
  }

  // Get inventory
  getInventory() {
    const state = this.getState();
    return state ? state.inventory : null;
  }

  // Get coordinates
  getCoordinates() {
    const state = this.getState();
    return state ? state.coordinates : null;
  }

  // Update player position
  updatePlayerPosition(x, y) {
    this.dispatch(updatePosition({ x, y }));
  }

  // Update current scene
  updateCurrentScene(sceneKey) {
    this.dispatch(updateScene(sceneKey));
  }

  // Add item to inventory
  addItemToInventory(itemId, quantity = 1) {
    this.dispatch(addItem({ itemId, quantity }));
  }

  // Remove item from inventory
  removeItemFromInventory(itemId, quantity = 1) {
    this.dispatch(removeItem({ itemId, quantity }));
  }

  // Use item from inventory
  useItemFromInventory(itemId) {
    this.dispatch(useItem({ itemId }));
  }

  // Check if player should have speed boost
  hasSpeedBoost() {
    const inventory = this.getInventory();
    if (!inventory) return false;
    
    return inventory.activeEffects.some(effect => 
      effect.id === 'speed_boost' && 
      (Date.now() - effect.startTime) < effect.duration
    );
  }

  // Check if player is near a quest location
  checkQuestProximity(playerX, playerY, threshold = 50) {
    const activeQuests = this.getActiveQuests();
    const nearbyQuests = [];

    activeQuests.forEach(quest => {
      const distance = Math.sqrt(
        Math.pow(playerX - quest.x, 2) + Math.pow(playerY - quest.y, 2)
      );
      
      if (distance <= threshold) {
        nearbyQuests.push({
          ...quest,
          distance
        });
      }
    });

    return nearbyQuests;
  }

  // Check if quest is on cooldown
  isQuestOnCooldown(questId) {
    const cooldownData = this.questCooldowns.get(questId);
    if (!cooldownData) return false;
    
    const currentTime = Date.now();
    return currentTime < cooldownData.endTime;
  }

  // Get remaining cooldown time for a quest
  getQuestCooldownRemaining(questId) {
    const cooldownData = this.questCooldowns.get(questId);
    if (!cooldownData) return 0;
    
    const currentTime = Date.now();
    const remaining = Math.max(0, cooldownData.endTime - currentTime);
    return Math.ceil(remaining / 1000); // Return seconds
  }

  // Get total cooldown duration for a quest
  getQuestCooldownDuration(questId) {
    const cooldownData = this.questCooldowns.get(questId);
    if (!cooldownData) return 0;
    
    return cooldownData.duration; // Return milliseconds
  }

  // Check if quest was completed today
  isQuestCompletedToday(questId) {
    const completionKey = `${questId}_day_${this.currentGameDay}`;
    return this.dailyQuestCompletions.has(completionKey);
  }

  // Mark quest as completed for current day
  markQuestCompletedToday(questId) {
    const completionKey = `${questId}_day_${this.currentGameDay}`;
    this.dailyQuestCompletions.set(completionKey, true);
  }

  // Update game day and clear old completions
  updateGameDay(newDay) {
    if (newDay !== this.currentGameDay) {
      console.log(`Game day changed from ${this.currentGameDay} to ${newDay}`);
      this.currentGameDay = newDay;
      
      // Clear old daily completions (keep only current day)
      const currentDayPrefix = `_day_${newDay}`;
      const keysToDelete = [];
      
      for (const key of this.dailyQuestCompletions.keys()) {
        if (!key.endsWith(currentDayPrefix)) {
          keysToDelete.push(key);
        }
      }
      
      keysToDelete.forEach(key => this.dailyQuestCompletions.delete(key));
      console.log(`Cleared ${keysToDelete.length} old quest completions`);
    }
  }

  // Start local quest completion (for scene-specific quests)
  startQuestCompletionLocal(questData, scene = null) {
    if (!this.store) {
      console.warn('ReduxBridge: No store available for quest completion');
      return false;
    }

    // Check if quest was already completed today
    if (this.isQuestCompletedToday(questData.id)) {
      console.log(`Quest ${questData.id} already completed today`);
      
      // Show already completed message in scene if provided
      if (scene && scene.player) {
        this.showAlreadyCompletedMessage(scene, questData.title);
      }
      return false;
    }

    // Check if quest is already on cooldown
    if (this.isQuestOnCooldown(questData.id)) {
      const remaining = this.getQuestCooldownRemaining(questData.id);
      console.log(`Quest ${questData.id} is on cooldown for ${remaining} more seconds`);
      
      // Show cooldown message in scene if provided
      if (scene && scene.player) {
        this.showCooldownMessage(scene, questData.id, remaining);
      }
      return false;
    }

    // Generate random cooldown between 5-15 seconds
    const cooldownSeconds = Math.floor(Math.random() * 11) + 5; // 5-15 seconds
    const cooldownMs = cooldownSeconds * 1000;
    const startTime = Date.now();
    const endTime = startTime + cooldownMs;

    // Store cooldown data
    this.questCooldowns.set(questData.id, {
      startTime,
      endTime,
      duration: cooldownMs,
      questTitle: questData.title
    });

    console.log(`Starting local quest completion: ${questData.title} (${cooldownSeconds}s cooldown)`);

    // Show progress message in scene if provided
    if (scene && scene.player) {
      this.showQuestProgress(scene, questData, cooldownSeconds);
    }

    // Set timer to complete quest after cooldown
    setTimeout(() => {
      this.completeLocalQuest(questData);
      // Mark quest as completed for today
      this.markQuestCompletedToday(questData.id);
      // Remove from cooldown tracking
      this.questCooldowns.delete(questData.id);
    }, cooldownMs);

    return true;
  }

  // Complete local quest (internal method for scene-specific quests)
  completeLocalQuest(questData) {
    if (!this.store) {
      console.warn('ReduxBridge: No store available for quest completion');
      return;
    }

    console.log(`Completing local quest: ${questData.title}`);
    console.log('Quest stat changes:', questData.statChanges);
    console.log('Quest score increase:', questData.scoreIncrease);

    // Apply stat changes directly
    this.dispatch(modifyStats(questData.statChanges));
    
    // Apply score increase
    if (questData.scoreIncrease > 0) {
      this.dispatch(increaseScore(questData.scoreIncrease));
    }
    
    console.log(`Local quest ${questData.title} completed successfully!`);
  }

  // Start quest completion with cooldown
  startQuestCompletion(questId, scene = null) {
    if (!this.store) {
      console.warn('ReduxBridge: No store available for quest completion');
      return false;
    }

    // Check if quest is already on cooldown
    if (this.isQuestOnCooldown(questId)) {
      const remaining = this.getQuestCooldownRemaining(questId);
      console.log(`Quest ${questId} is on cooldown for ${remaining} more seconds`);
      
      // Show cooldown message in scene if provided
      if (scene && scene.player) {
        this.showCooldownMessage(scene, questId, remaining);
      }
      return false;
    }

    // Find the quest before starting completion
    const quest = this.getActiveQuests().find(q => q.id === questId);
    if (!quest) {
      console.warn(`ReduxBridge: Quest with ID ${questId} not found in active quests`);
      return false;
    }

    // Generate random cooldown between 5-15 seconds
    const cooldownSeconds = Math.floor(Math.random() * 11) + 5; // 5-15 seconds
    const cooldownMs = cooldownSeconds * 1000;
    const startTime = Date.now();
    const endTime = startTime + cooldownMs;

    // Store cooldown data
    this.questCooldowns.set(questId, {
      startTime,
      endTime,
      duration: cooldownMs,
      questTitle: quest.title
    });

    console.log(`Starting quest completion: ${quest.title} (${cooldownSeconds}s cooldown)`);

    // Show progress message in scene if provided
    if (scene && scene.player) {
      this.showQuestProgress(scene, quest, cooldownSeconds);
    }

    // Set timer to complete quest after cooldown
    setTimeout(() => {
      this.completeQuest(questId);
      // Remove from cooldown tracking
      this.questCooldowns.delete(questId);
    }, cooldownMs);

    return true;
  }

  // Complete a quest (internal method called after cooldown)
  completeQuest(questId) {
    if (!this.store) {
      console.warn('ReduxBridge: No store available for quest completion');
      return;
    }

    // Find the quest before completing it
    const quest = this.getActiveQuests().find(q => q.id === questId);
    if (!quest) {
      console.warn(`ReduxBridge: Quest with ID ${questId} not found in active quests`);
      return;
    }

    console.log(`Completing quest: ${quest.title}`);
    console.log('Quest stat changes:', quest.statChanges);
    console.log('Quest score increase:', quest.scoreIncrease);

    // Apply stat changes first
    this.dispatch(modifyStats(quest.statChanges));
    
    // Apply score increase
    if (quest.scoreIncrease > 0) {
      this.dispatch(increaseScore(quest.scoreIncrease));
    }
    
    // Mark quest as completed
    this.dispatch(completeQuest(questId));
    
    console.log(`Quest ${quest.title} completed successfully!`);
  }

  // Show quest progress message
  showQuestProgress(scene, quest, cooldownSeconds) {
    if (!scene || !scene.add) return;

    const playerX = scene.player ? scene.player.x : scene.cameras.main.centerX;
    const playerY = scene.player ? scene.player.y : scene.cameras.main.centerY;

    // Create progress message
    const progressText = scene.add.text(playerX, playerY - 60, 
      `Starting: ${quest.title}\n(${cooldownSeconds}s remaining)`, {
      fontFamily: 'Pixelify Sans',
      fontSize: '14px',
      fill: '#FFD700',
      backgroundColor: '#000000',
      padding: { x: 8, y: 4 },
      align: 'center'
    }).setOrigin(0.5).setDepth(200);

    // Update countdown every second
    const updateInterval = setInterval(() => {
      const remaining = this.getQuestCooldownRemaining(quest.id);
      if (remaining > 0) {
        progressText.setText(`Completing: ${quest.title}\n(${remaining}s remaining)`);
      } else {
        // Quest completed
        progressText.setText(`${quest.title} Completed!`);
        progressText.setStyle({ fill: '#00FF00' });
        
        // Remove message after 2 seconds
        setTimeout(() => {
          clearInterval(updateInterval);
          progressText.destroy();
        }, 2000);
      }
    }, 1000);

    // Cleanup interval if text is destroyed early
    progressText.on('destroy', () => {
      clearInterval(updateInterval);
    });
  }

  // Show cooldown message when quest is already in progress
  showCooldownMessage(scene, questId, remainingSeconds) {
    if (!scene || !scene.add) return;

    const playerX = scene.player ? scene.player.x : scene.cameras.main.centerX;
    const playerY = scene.player ? scene.player.y : scene.cameras.main.centerY;

    const cooldownData = this.questCooldowns.get(questId);
    const questTitle = cooldownData ? cooldownData.questTitle : 'Quest';

    const cooldownText = scene.add.text(playerX, playerY - 60, 
      `${questTitle} in progress\n(${remainingSeconds}s remaining)`, {
      fontFamily: 'Pixelify Sans',
      fontSize: '14px',
      fill: '#FFA500',
      backgroundColor: '#000000',
      padding: { x: 8, y: 4 },
      align: 'center'
    }).setOrigin(0.5).setDepth(200);

    // Remove message after 2 seconds
    setTimeout(() => {
      cooldownText.destroy();
    }, 2000);
  }

  // Show already completed message in scene
  showAlreadyCompletedMessage(scene, questTitle) {
    if (!scene || !scene.add) return;
    
    const playerX = scene.player ? scene.player.x : scene.cameras.main.centerX;
    const playerY = scene.player ? scene.player.y : scene.cameras.main.centerY;
    
    const message = scene.add.text(playerX, playerY - 60, 
      `${questTitle} sudah selesai hari ini!`, {
      fontFamily: 'Pixelify Sans',
      fontSize: '14px',
      fill: '#888888',
      backgroundColor: '#000000',
      padding: { x: 8, y: 4 },
      align: 'center'
    }).setOrigin(0.5).setDepth(200);
    
    // Remove message after 2 seconds
    setTimeout(() => {
      message.destroy();
    }, 2000);
  }

  // Add quest markers to a Phaser scene
  addQuestMarkersToScene(scene) {
    const activeQuests = this.getActiveQuests();
    const questMarkers = [];

    console.log('Adding quest markers, active quests:', activeQuests.length);

    activeQuests.forEach(quest => {
      console.log('Creating quest marker for:', quest.title, 'at', quest.x, quest.y);
      
      // Try to create a quest marker using star image, fallback to circle if star doesn't exist
      let marker;
      try {
        if (scene.textures.exists('star')) {
          marker = scene.add.image(quest.x, quest.y, 'star');
          marker.setScale(0.8); // Make star a bit smaller
          console.log('Created star marker for quest:', quest.title);
        } else {
          // Fallback to yellow circle if star texture doesn't exist
          marker = scene.add.circle(quest.x, quest.y, 15, 0xffff00, 0.8);
          console.log('Star texture not found, using circle fallback for quest:', quest.title);
        }
      } catch (error) {
        console.error('Error creating star marker, using circle fallback:', error);
        marker = scene.add.circle(quest.x, quest.y, 15, 0xffff00, 0.8);
      }
      
      marker.setDepth(150); // Increased depth to ensure visibility
      marker.questId = quest.id;
      
      // Add floating animation (up and down movement)
      scene.tweens.add({
        targets: marker,
        y: quest.y - 10,
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      
      // Add gentle rotation animation (only for images, not circles)
      if (marker.type === 'Image') {
        scene.tweens.add({
          targets: marker,
          rotation: Phaser.Math.PI2,
          duration: 3000,
          repeat: -1,
          ease: 'Linear'
        });
      }

      // Add quest text
      const questText = scene.add.text(quest.x, quest.y - 35, quest.title, {
        fontFamily: 'Pixelify Sans',
        fontSize: '12px',
        fill: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 4, y: 2 }
      }).setOrigin(0.5).setDepth(151);

      questMarkers.push({ marker, text: questText, quest });
    });

    console.log('Total quest markers created:', questMarkers.length);
    return questMarkers;
  }

  // Update quest markers based on current state
  updateQuestMarkers(scene, questMarkers) {
    const activeQuests = this.getActiveQuests();
    const activeQuestIds = new Set(activeQuests.map(q => q.id));

    // Remove markers for completed/cancelled quests
    questMarkers.forEach((markerData, index) => {
      if (!activeQuestIds.has(markerData.quest.id)) {
        markerData.marker.destroy();
        markerData.text.destroy();
        questMarkers.splice(index, 1);
      }
    });

    // Add markers for new quests
    activeQuests.forEach(quest => {
      const existingMarker = questMarkers.find(m => m.quest.id === quest.id);
      if (!existingMarker) {
        console.log('Adding new quest marker for:', quest.title);
        
        // Try to create a quest marker using star image, fallback to circle if star doesn't exist
        let marker;
        try {
          if (scene.textures.exists('star')) {
            marker = scene.add.image(quest.x, quest.y, 'star');
            marker.setScale(0.8); // Make star a bit smaller
            console.log('Created star marker for new quest:', quest.title);
          } else {
            // Fallback to yellow circle if star texture doesn't exist
            marker = scene.add.circle(quest.x, quest.y, 15, 0xffff00, 0.8);
            console.log('Star texture not found, using circle fallback for new quest:', quest.title);
          }
        } catch (error) {
          console.error('Error creating star marker for new quest, using circle fallback:', error);
          marker = scene.add.circle(quest.x, quest.y, 15, 0xffff00, 0.8);
        }
        
        marker.setDepth(150); // Increased depth to ensure visibility
        marker.questId = quest.id;
        
        // Add floating animation (up and down movement)
        scene.tweens.add({
          targets: marker,
          y: quest.y - 10,
          duration: 1500,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
        
        // Add gentle rotation animation (only for images, not circles)
        if (marker.type === 'Image') {
          scene.tweens.add({
            targets: marker,
            rotation: Phaser.Math.PI2,
            duration: 3000,
            repeat: -1,
            ease: 'Linear'
          });
        }

        const questText = scene.add.text(quest.x, quest.y - 35, quest.title, {
          fontFamily: 'Pixelify Sans',
          fontSize: '12px',
          fill: '#ffffff',
          backgroundColor: '#000000',
          padding: { x: 4, y: 2 }
        }).setOrigin(0.5).setDepth(151);

        questMarkers.push({ marker, text: questText, quest });
      }
    });
  }
}

// Create a singleton instance
const reduxBridge = new ReduxBridge();

export default reduxBridge; 