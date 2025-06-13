import Phaser from 'phaser';
import { getReduxInventoryManager } from '../items/ReduxInventoryManager.js';
import reduxBridge from '../ReduxBridge.js';

export default class HouseScene extends Phaser.Scene {
    constructor() {
        super({ key: 'HouseScene' });
        this.player = null;
        this.cursors = null;
        this.lastDirection = 'down';

        this.nearExit = false;
        this.exitButton = null;
        this.exitZones = [];
        
        // Quest system variables
        this.nearQuest = false;
        this.questButton = null;
        this.nearestQuestId = null;
        this.questKeyPressed = false;
        this.questMarkers = [];
        this.isDoingQuest = false; // Track if player is currently doing a quest
        
        // Sleep system variables
        this.nearSleep = false;
        this.sleepButton = null;
        this.sleepZone = null;
        this.isSleeping = false;
        
        this.playerSpeedMultiplier = 1.0; // For inventory speed effects
        this.inventory = null;
    }

    preload() {
        // Load the house map
        this.load.tilemapTiledJSON('house_map', '/map/house.tmj');
        
        // Load interior tileset images
        this.load.image('in_bedroom', '/assets/in_bedroom.png');
        this.load.image('in_floors', '/assets/in_floors.png');
        this.load.image('in_walls', '/assets/in_walls.png');
        this.load.image('in_kitchen', '/assets/in_kitchen.png');
        this.load.image('in_livingroom', '/assets/in_livingroom.png');
        
        // Load quest marker assets
        this.load.image('star', 'assets/star.png');
        
        // Load player sprites
        for (let i = 1; i <= 5; i++) {
            this.load.spritesheet(`player${i}`, `/assets/player${i}.png`, {
                frameWidth: 16,
                frameHeight: 32
            });
        }
    }

    create() {
        this.playerInfo = this.sys.game.registry.get('playerInfo');
        
        // Create the tilemap
        const map = this.make.tilemap({ key: 'house_map' });
        
        // Add all interior tilesets
        const bedroomTileset = map.addTilesetImage('in_bedroom', 'in_bedroom');
        const floorsTileset = map.addTilesetImage('in_floors', 'in_floors');
        const wallsTileset = map.addTilesetImage('in_walls', 'in_walls');
        const kitchenTileset = map.addTilesetImage('in_kitchen', 'in_kitchen');
        const livingroomTileset = map.addTilesetImage('in_livingroom', 'in_livingroom');
        
        // Create layers in the correct order with all tilesets
        const ground = map.createLayer('ground', [floorsTileset]);
        ground.setDepth(0);
        
        const wall = map.createLayer('wall', [wallsTileset]);
        wall.setDepth(1);
        
        const furniture = map.createLayer('furniture', [
            bedroomTileset,
            kitchenTileset,
            livingroomTileset
        ]);
        furniture.setDepth(2);
        
        const roof = map.createLayer('roof', [bedroomTileset]);
        roof.setDepth(3);

        // Set collisions for obstacles
        wall.setCollisionByProperty({ collide: true });
        furniture.setCollisionByProperty({ collide: true });
        roof.setCollisionByProperty({ collide: true });

        // Set world bounds to match the map size
        this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        
        // Create player with selected character
        const playerKey = `player${this.playerInfo.character.id}`;
        this.player = this.physics.add.sprite(100, 100, playerKey);
        this.player.setCollideWorldBounds(true);
        this.player.body.setSize(16, 10);
        this.player.body.setOffset(0, 22);
        this.player.setDepth(2.5);

        // Initialize scene in Redux
        reduxBridge.updateCurrentScene('HouseScene');

        // Set up camera to follow player with bounds
        this.cameras.main.startFollow(this.player);
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.cameras.main.setZoom(1.5);

        // Set up collisions
        this.physics.add.collider(this.player, wall);
        this.physics.add.collider(this.player, furniture);
        this.physics.add.collider(this.player, roof);

        // Set up WASD controls
        this.cursors = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            interact: Phaser.Input.Keyboard.KeyCodes.E,
            quest: Phaser.Input.Keyboard.KeyCodes.Q // Add Q key for quest interaction
        });

        // Create player animations
        const createAnimations = (key) => {
            // Walking animations
            this.anims.create({
                key: `${key}_walk_down`,
                frames: this.anims.generateFrameNumbers(key, { start: 0, end: 3 }),
                frameRate: 10,
                repeat: -1
            });
            this.anims.create({
                key: `${key}_walk_left`,
                frames: this.anims.generateFrameNumbers(key, { start: 4, end: 7 }),
                frameRate: 10,
                repeat: -1
            });
            this.anims.create({
                key: `${key}_walk_right`,
                frames: this.anims.generateFrameNumbers(key, { start: 8, end: 11 }),
                frameRate: 10,
                repeat: -1
            });
            this.anims.create({
                key: `${key}_walk_up`,
                frames: this.anims.generateFrameNumbers(key, { start: 12, end: 15 }),
                frameRate: 10,
                repeat: -1
            });

            // Idle animations
            this.anims.create({
                key: `${key}_idle_down`,
                frames: [{ key: key, frame: 0 }],
                frameRate: 10
            });
            this.anims.create({
                key: `${key}_idle_left`,
                frames: [{ key: key, frame: 4 }],
                frameRate: 10
            });
            this.anims.create({
                key: `${key}_idle_right`,
                frames: [{ key: key, frame: 8 }],
                frameRate: 10
            });
            this.anims.create({
                key: `${key}_idle_up`,
                frames: [{ key: key, frame: 12 }],
                frameRate: 10
            });

            // Sleep animation (row 4-1: frames 168-173)
            // Each row has 56 frames, row 4 starts at 3*56 = 168
            this.anims.create({
                key: `${key}_sleep`,
                frames: this.anims.generateFrameNumbers(key, { start: 168, end: 173 }),
                frameRate: 8, // Match MainScene sleep animation
                repeat: -1
            });

            // Action animation (frames 716-727)
            this.anims.create({
                key: `${key}_action`,
                frames: this.anims.generateFrameNumbers(key, { start: 716, end: 727 }),
                frameRate: 10,
                repeat: -1
            });
        };

        // Create animations for all characters
        for (let i = 1; i <= 5; i++) {
            createAnimations(`player${i}`);
        }



        // Create exit button (initially hidden)
        this.exitButton = this.add.text(0, 0, 'Press E to Exit', {
            fontFamily: 'Pixelify Sans',
            fontSize: '16px',
            fill: '#fff',
            backgroundColor: '#000',
            padding: { x: 10, y: 5 }
        }).setDepth(100).setVisible(false);

        // Create exit zone at specified location
        const exitZone = this.add.zone(48, 240, 64, 32);
        this.physics.add.existing(exitZone, true);
        this.exitZones.push(exitZone);

        // Visual indicator removed for cleaner gameplay
        
        // Add overlap detection between player and exit zones
        this.physics.add.overlap(this.player, this.exitZones, this.handleExitOverlap, null, this);

        // Add debug text to show scene name
        this.add.text(10, 40, 'House Scene', {
            fontFamily: 'Pixelify Sans',
            fontSize: '16px',
            fill: '#fff',
            backgroundColor: '#000',
            padding: { x: 5, y: 5 }
        }).setDepth(1000).setScrollFactor(0);

        // Initialize Redux inventory system
        this.inventory = getReduxInventoryManager();
        this.inventory.init(this);

        // Create quest interaction button (initially hidden)
        this.questButton = this.add.text(0, 0, 'Press Q to Start Quest', {
            fontFamily: 'Pixelify Sans',
            fontSize: '16px',
            fill: '#fff',
            backgroundColor: '#28a745',
            padding: { x: 10, y: 5 }
        }).setDepth(100).setVisible(false);

        // Add house-specific quest markers
        this.addHouseQuests();

        // Create sleep interaction system
        this.createSleepZone();
    }

    createSleepZone() {
        // Create sleep zone at bed location
        this.sleepZone = this.add.zone(35, 69, 32, 32);
        this.physics.add.existing(this.sleepZone, true);

        // Visual indicator removed for cleaner gameplay

        // Create sleep button (initially hidden)
        this.sleepButton = this.add.text(0, 0, 'Press E to Sleep', {
            fontFamily: 'Pixelify Sans',
            fontSize: '16px',
            fill: '#fff',
            backgroundColor: '#4169E1',
            padding: { x: 10, y: 5 }
        }).setDepth(100).setVisible(false);

        // Add overlap detection for sleep zone
        this.physics.add.overlap(this.player, [this.sleepZone], this.handleSleepOverlap, null, this);
    }

    handleSleepOverlap(player, zone) {
        if (!this.nearSleep && !this.isSleeping) {
            this.nearSleep = true;
            this.sleepButton.setPosition(player.x - 50, player.y - 50);
            this.sleepButton.setVisible(true);
        }
    }

    async startSleeping() {
        if (this.isSleeping) return;
        
        this.isSleeping = true;
        this.sleepButton.setVisible(false);
        
        const playerKey = `player${this.playerInfo.character.id}`;
        
        // Stop player movement and play sleep animation
        this.player.setVelocity(0);
        console.log(`Playing sleep animation: ${playerKey}_sleep`);
        
        // Ensure the animation exists before playing
        if (this.anims.exists(`${playerKey}_sleep`)) {
            this.player.anims.play(`${playerKey}_sleep`, true);
            console.log('Sleep animation started successfully');
        } else {
            console.error(`Sleep animation ${playerKey}_sleep not found`);
            // Fallback to idle down
            this.player.anims.play(`${playerKey}_idle_down`, true);
        }
        
        // Create black screen overlay
        const blackScreen = this.add.rectangle(
            this.cameras.main.centerX, 
            this.cameras.main.centerY, 
            this.cameras.main.width * 2, 
            this.cameras.main.height * 2, 
            0x000000, 
            0
        ).setDepth(1000).setScrollFactor(0);
        
        // Add sleep text
        const sleepText = this.add.text(
            this.cameras.main.centerX, 
            this.cameras.main.centerY, 
            'Sleeping...', {
            fontFamily: 'Pixelify Sans',
            fontSize: '32px',
            fill: '#fff'
        }).setDepth(1001).setScrollFactor(0).setOrigin(0.5).setAlpha(0);
        
        // Fade to black
        this.tweens.add({
            targets: blackScreen,
            alpha: 1,
            duration: 2000,
            ease: 'Power2'
        });
        
        // Show sleep text
        this.tweens.add({
            targets: sleepText,
            alpha: 1,
            duration: 2000,
            delay: 1000,
            ease: 'Power2'
        });
        
        // Wait for sleep duration
        await new Promise(resolve => setTimeout(resolve, 4000));
        
        // Apply sleep benefits
        this.applySleepBenefits();
        
        // Update sleep text
        sleepText.setText('Good Morning!\nEnergy Recharged!');
        
        // Wait a bit more
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Fade back in
        this.tweens.add({
            targets: blackScreen,
            alpha: 0,
            duration: 2000,
            ease: 'Power2'
        });
        
        this.tweens.add({
            targets: sleepText,
            alpha: 0,
            duration: 2000,
            ease: 'Power2',
            onComplete: () => {
                blackScreen.destroy();
                sleepText.destroy();
                this.isSleeping = false;
                // Return to idle animation
                this.player.anims.play(`${playerKey}_idle_down`);
            }
        });
    }

    applySleepBenefits() {
        // Get current game stats
        const gameStats = reduxBridge.getGameStats();
        if (!gameStats) return;
        
        // Calculate energy recharge (30% of max, assuming max is 100)
        const energyRecharge = 30;
        const currentEnergy = gameStats.stats.energy || 0;
        const newEnergy = Math.min(100, currentEnergy + energyRecharge);
        
        // Calculate sleep increase (30% of max, assuming max is 100)
        const sleepIncrease = 30;
        const currentSleep = gameStats.stats.sleep || 0;
        const newSleep = Math.min(100, currentSleep + sleepIncrease);
        
        // Calculate hunger decrease (25% of current hunger)
        const currentHunger = gameStats.stats.meal || 0;
        const hungerDecrease = Math.floor(currentHunger * 0.25);
        const newHunger = Math.max(0, currentHunger - hungerDecrease);
        
        // Advance day by 1
        const currentDay = gameStats.stats.day || 1;
        const newDay = currentDay + 1;
        
        // Set time to 8 AM (assuming time is in hours, 0-23)
        const newTime = 8;
        
        // Apply changes through Redux
        reduxBridge.dispatch({
            type: 'gameStats/modifyStats',
            payload: {
                energy: newEnergy - currentEnergy, // Add the difference
                sleep: newSleep - currentSleep, // Add sleep increase
                meal: newHunger - currentHunger, // Subtract hunger decrease
                day: newDay - currentDay, // Add 1 day
                time: newTime - (gameStats.stats.time || 0) // Set to 8 AM
            }
        });
        
        console.log(`Sleep completed: Day ${newDay}, Time: ${newTime}:00, Energy: ${newEnergy}, Sleep: ${newSleep}, Hunger: ${newHunger} (decreased by ${hungerDecrease})`);
    }

    addHouseQuests() {
        // Create house maintenance quests
        const houseQuests = [
            {
                id: 'house_clean_kitchen',
                title: 'Bersihkan Dapur',
                description: 'Membersihkan dan merapikan area dapur',
                x: 165,
                y: 55,
                statChanges: { cleanliness: 15, happiness: 10 },
                scoreIncrease: 50
            },
            {
                id: 'house_organize_bedroom',
                title: 'Rapikan Kamar Tidur',
                description: 'Merapikan kasur dan lemari pakaian',
                x: 40,
                y: 71,
                statChanges: { cleanliness: 20, sleep: 10 },
                scoreIncrease: 60
            },
            {
                id: 'house_vacuum_living',
                title: 'Vacuum Ruang Tamu',
                description: 'Membersihkan lantai ruang tamu dengan vacuum',
                x: 173,
                y: 165,
                statChanges: { cleanliness: 25, happiness: 5 },
                scoreIncrease: 70
            }
        ];

        // Add quest markers to the scene
        houseQuests.forEach(quest => {
            // Create star marker
            let marker;
            try {
                if (this.textures.exists('star')) {
                    marker = this.add.image(quest.x, quest.y, 'star');
                    marker.setScale(0.6); // Smaller for indoor space
                } else {
                    marker = this.add.circle(quest.x, quest.y, 12, 0xffff00, 0.8);
                }
            } catch (error) {
                marker = this.add.circle(quest.x, quest.y, 12, 0xffff00, 0.8);
            }
            
            marker.setDepth(150);
            marker.questId = quest.id;
            marker.questData = quest;
            
            // Add floating animation
            this.tweens.add({
                targets: marker,
                y: quest.y - 8,
                duration: 1200,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
            
            // Add rotation for star markers
            if (marker.type === 'Image') {
                this.tweens.add({
                    targets: marker,
                    rotation: Phaser.Math.PI2,
                    duration: 3000,
                    repeat: -1,
                    ease: 'Linear'
                });
            }

            // Add quest text (no background)
            const questText = this.add.text(quest.x, quest.y - 25, quest.title, {
                fontFamily: 'Pixelify Sans',
                fontSize: '10px',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0.5).setDepth(151);

            this.questMarkers.push({ marker, text: questText, quest });
        });
    }

    handleExitOverlap(player, zone) {
        if (!this.nearExit) {
            this.nearExit = true;
            // Position the button above the player
            this.exitButton.setPosition(player.x - 50, player.y - 50);
            this.exitButton.setVisible(true);
        }
    }



    update() {
        const baseSpeed = 160;
        const speed = baseSpeed * this.playerSpeedMultiplier; // Apply speed multiplier for coffee effect
        const cursors = this.cursors;
        const playerKey = `player${this.playerInfo.character.id}`;

        // Update coordinates in Redux
        if (this.player) {
            const x = Math.round(this.player.x);
            const y = Math.round(this.player.y);
            reduxBridge.updatePlayerPosition(x, y);
        }

        // Update quest marker visibility based on completion status
        this.questMarkers.forEach(questMarker => {
            const isCompleted = reduxBridge.isQuestCompletedToday(questMarker.quest.id);
            const isOnCooldown = reduxBridge.isQuestOnCooldown(questMarker.quest.id);
            
            // Hide markers if completed, show if available or on cooldown
            const shouldShow = !isCompleted;
            questMarker.marker.setVisible(shouldShow);
            questMarker.text.setVisible(shouldShow);
        });

        // Check for nearby house quests (only visible ones)
        const nearbyQuests = this.questMarkers.filter(questMarker => {
            if (!questMarker.marker.visible) return false; // Skip hidden markers
            
            const distance = Phaser.Math.Distance.Between(
                this.player.x, this.player.y,
                questMarker.quest.x, questMarker.quest.y
            );
            return distance < 40; // Smaller radius for indoor space
        });

        if (nearbyQuests.length > 0 && !this.questButton.visible) {
            const nearestQuest = nearbyQuests[0].quest;
            
            // Check if quest was already completed today
            if (reduxBridge.isQuestCompletedToday(nearestQuest.id)) {
                this.questButton.setText(`${nearestQuest.title} (Selesai)`);
                this.questButton.setStyle({ backgroundColor: '#666666' }); // Gray for completed
            }
            // Check if this quest is on cooldown
            else if (reduxBridge.isQuestOnCooldown(nearestQuest.id)) {
                const remaining = reduxBridge.getQuestCooldownRemaining(nearestQuest.id);
                this.questButton.setText(`${nearestQuest.title} (${remaining}s)`);
                this.questButton.setStyle({ backgroundColor: '#FFA500' }); // Orange for cooldown
            } else {
                this.questButton.setText(`Press Q: ${nearestQuest.title}`);
                this.questButton.setStyle({ backgroundColor: '#28a745' }); // Green for available
            }
            
            this.questButton.setPosition(this.player.x - 70, this.player.y - 70);
            this.questButton.setVisible(true);
            this.nearestQuestId = nearestQuest.id;
        } else if (nearbyQuests.length === 0 && this.questButton.visible) {
            this.questButton.setVisible(false);
            this.nearestQuestId = null;
        }

        // Handle quest completion with cooldown
        if (this.nearestQuestId && cursors.quest.isDown && !this.questKeyPressed && !this.isDoingQuest) {
            console.log(`Starting house quest: ${this.nearestQuestId}`);
            this.questKeyPressed = true;
            
            // Find quest data
            const questMarker = this.questMarkers.find(q => q.quest.id === this.nearestQuestId);
            if (questMarker) {
                // Simulate quest completion using direct Redux dispatch
                const started = reduxBridge.startQuestCompletionLocal(questMarker.quest, this);
                
                if (started) {
                    this.questButton.setVisible(false);
                    this.nearestQuestId = null;
                    this.isDoingQuest = true; // Freeze player movement
                    
                    // Play action animation during quest
                    console.log(`Playing action animation: ${playerKey}_action`);
                    console.log(`Available animations:`, this.anims.anims.entries);
                    console.log(`Player current animation:`, this.player.anims.currentAnim);
                    
                    if (this.anims.exists(`${playerKey}_action`)) {
                        console.log(`Action animation exists, attempting to play...`);
                        this.player.anims.play(`${playerKey}_action`, true);
                        console.log(`Action animation play command sent`);
                        console.log(`Player animation after play:`, this.player.anims.currentAnim);
                    } else {
                        console.error(`Action animation ${playerKey}_action not found`);
                        console.log(`Available animations for debugging:`, Object.keys(this.anims.anims.entries));
                        // Fallback to idle animation
                        this.player.anims.play(`${playerKey}_idle_${this.lastDirection}`, true);
                    }
                    
                    // Set timer to unfreeze player when quest completes
                    const cooldownMs = reduxBridge.getQuestCooldownDuration(questMarker.quest.id);
                    if (cooldownMs > 0) {
                        setTimeout(() => {
                            this.isDoingQuest = false;
                            // Return to idle animation after quest completes
                            console.log(`Returning to idle: ${playerKey}_idle_${this.lastDirection}`);
                            this.player.anims.play(`${playerKey}_idle_${this.lastDirection}`, true);
                        }, cooldownMs);
                    }
                }
            }
        } else if (!cursors.quest.isDown) {
            this.questKeyPressed = false;
        }

        // Update quest button position and status
        if (this.questButton.visible && this.nearestQuestId) {
            this.questButton.setPosition(this.player.x - 70, this.player.y - 70);
            
            const questMarker = this.questMarkers.find(q => q.quest.id === this.nearestQuestId);
            if (questMarker) {
                // Update display based on quest status
                if (reduxBridge.isQuestCompletedToday(this.nearestQuestId)) {
                    this.questButton.setText(`${questMarker.quest.title} (Selesai)`);
                    this.questButton.setStyle({ backgroundColor: '#666666' }); // Gray for completed
                }
                // Update cooldown display if quest is on cooldown
                else if (reduxBridge.isQuestOnCooldown(this.nearestQuestId)) {
                    const remaining = reduxBridge.getQuestCooldownRemaining(this.nearestQuestId);
                    this.questButton.setText(`${questMarker.quest.title} (${remaining}s)`);
                    this.questButton.setStyle({ backgroundColor: '#FFA500' }); // Orange for cooldown
                }
                else {
                    this.questButton.setText(`Press Q: ${questMarker.quest.title}`);
                    this.questButton.setStyle({ backgroundColor: '#28a745' }); // Green for available
                }
            }
        }

        // Check if player is near an exit
        const isNearExit = this.exitZones.some(zone => 
            Phaser.Math.Distance.Between(
                this.player.x, this.player.y,
                zone.x, zone.y
            ) < 50
        );

        if (!isNearExit && this.nearExit) {
            this.nearExit = false;
            this.exitButton.setVisible(false);
        }

        // Check if player is near sleep zone
        const isNearSleep = this.sleepZone && Phaser.Math.Distance.Between(
            this.player.x, this.player.y,
            this.sleepZone.x, this.sleepZone.y
        ) < 50;

        if (!isNearSleep && this.nearSleep) {
            this.nearSleep = false;
            this.sleepButton.setVisible(false);
        }

        // Handle sleep interaction
        if (this.nearSleep && cursors.interact.isDown && !this.isSleeping) {
            this.startSleeping();
        }

        // Handle exit interaction
        if (this.nearExit && cursors.interact.isDown && !this.isSleeping) {
            this.scene.start('MainScene');
        }

        // Update button positions to follow player
        if (this.nearExit) {
            this.exitButton.setPosition(this.player.x - 50, this.player.y - 50);
        }
        
        if (this.nearSleep && !this.isSleeping) {
            this.sleepButton.setPosition(this.player.x - 50, this.player.y - 50);
        }

        this.player.setVelocity(0);

        let moving = false;

        // Only allow movement if not doing a quest or sleeping
        if (!this.isDoingQuest && !this.isSleeping) {
        if (cursors.left.isDown) {
            this.player.setVelocityX(-speed);
            this.player.anims.play(`${playerKey}_walk_left`, true);
            this.lastDirection = 'left';
            moving = true;
        } else if (cursors.right.isDown) {
            this.player.setVelocityX(speed);
            this.player.anims.play(`${playerKey}_walk_right`, true);
            this.lastDirection = 'right';
            moving = true;
        }

        if (cursors.up.isDown) {
            this.player.setVelocityY(-speed);
            this.player.anims.play(`${playerKey}_walk_up`, true);
            this.lastDirection = 'up';
            moving = true;
        } else if (cursors.down.isDown) {
            this.player.setVelocityY(speed);
            this.player.anims.play(`${playerKey}_walk_down`, true);
            this.lastDirection = 'down';
            moving = true;
            }
        }

        // Play idle animation if not moving (but not if doing a quest or sleeping)
        if (!moving && !this.isDoingQuest && !this.isSleeping) {
            this.player.anims.stop();
            if (this.lastDirection === 'left') {
                this.player.anims.play(`${playerKey}_idle_left`);
            } else if (this.lastDirection === 'right') {
                this.player.anims.play(`${playerKey}_idle_right`);
            } else if (this.lastDirection === 'up') {
                this.player.anims.play(`${playerKey}_idle_up`);
            } else if (this.lastDirection === 'down') {
                this.player.anims.play(`${playerKey}_idle_down`);
            } else {
                this.player.anims.play(`${playerKey}_idle_down`);
            }
        }
    }
} 