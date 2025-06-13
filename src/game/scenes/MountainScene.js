import Phaser from 'phaser';
import { getReduxInventoryManager } from '../items/ReduxInventoryManager.js';
import reduxBridge from '../ReduxBridge.js';

export default class MountainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MountainScene' });
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
        
        this.playerSpeedMultiplier = 1.0; // For inventory speed effects
        this.inventory = null;
    }

    preload() {
        // Load the mountain map
        this.load.tilemapTiledJSON('mountain_map', '/map/mountain.tmj');
        
        // Load mountain tileset images
        this.load.image('ex_terrain', '/assets/ex_terrain.png');
        this.load.image('ex_villa', '/assets/ex_villa.png');
        
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
        const map = this.make.tilemap({ key: 'mountain_map' });
        
        // Add mountain tilesets
        const terrainTileset = map.addTilesetImage('ex_terrain', 'ex_terrain');
        const villaTileset = map.addTilesetImage('ex_villa', 'ex_villa');
        
        // Create layers in the correct order
        const ground = map.createLayer('ground', [terrainTileset, villaTileset]);
        ground.setDepth(0);
        
        // Check if furniture layer exists before creating it
        let furniture = null;
        const furnitureLayer = map.getLayer('furniture');
        if (furnitureLayer) {
            furniture = map.createLayer('furniture', [terrainTileset, villaTileset]);
            furniture.setDepth(2);
            // Set collisions for furniture layer
            furniture.setCollisionByProperty({ collide: true });
        }

        // Set world bounds to match the map size
        this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        
        // Create player with selected character
        const playerKey = `player${this.playerInfo.character.id}`;
        this.player = this.physics.add.sprite(109, 16, playerKey); // Start position on mountain
        this.player.setCollideWorldBounds(true);
        this.player.body.setSize(16, 10);
        this.player.body.setOffset(0, 22);
        this.player.setDepth(2.5);

        // Set up collisions after player is created
        if (furniture) {
            this.physics.add.collider(this.player, furniture);
        }

        // Initialize scene in Redux
        reduxBridge.updateCurrentScene('MountainScene');

        // Set up camera to follow player with bounds
        this.cameras.main.startFollow(this.player);
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.cameras.main.setZoom(2);

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
            // Idle animations
            this.anims.create({
                key: `${key}_idle_right`,
                frames: this.anims.generateFrameNumbers(key, { start: 56, end: 61 }),
                frameRate: 10,
                repeat: -1
            });
            this.anims.create({
                key: `${key}_idle_up`,
                frames: this.anims.generateFrameNumbers(key, { start: 62, end: 67 }),
                frameRate: 10,
                repeat: -1
            });
            this.anims.create({
                key: `${key}_idle_left`,
                frames: this.anims.generateFrameNumbers(key, { start: 68, end: 73 }),
                frameRate: 10,
                repeat: -1
            });
            this.anims.create({
                key: `${key}_idle_down`,
                frames: this.anims.generateFrameNumbers(key, { start: 74, end: 79 }),
                frameRate: 10,
                repeat: -1
            });

            // Walking animations
            this.anims.create({
                key: `${key}_walk_left`,
                frames: this.anims.generateFrameNumbers(key, { start: 124, end: 129 }),
                frameRate: 10,
                repeat: -1
            });
            this.anims.create({
                key: `${key}_walk_right`,
                frames: this.anims.generateFrameNumbers(key, { start: 112, end: 117 }),
                frameRate: 10,
                repeat: -1
            });
            this.anims.create({
                key: `${key}_walk_up`,
                frames: this.anims.generateFrameNumbers(key, { start: 118, end: 123 }),
                frameRate: 10,
                repeat: -1
            });
            this.anims.create({
                key: `${key}_walk_down`,
                frames: this.anims.generateFrameNumbers(key, { start: 130, end: 135 }),
                frameRate: 10,
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

        // Create exit zone at new location
        const exitZone = this.add.zone(120, 71, 32, 32);
        this.physics.add.existing(exitZone, true);
        
        // Visual indicator removed for cleaner gameplay

        // Set up exit zones array
        this.exitZones = [exitZone];

        // Add overlap detection between player and exit zones
        this.physics.add.overlap(this.player, this.exitZones, this.handleExitOverlap, null, this);

        // Create quest interaction button (initially hidden)
        this.questButton = this.add.text(0, 0, 'Press Q to Start Quest', {
            fontFamily: 'Pixelify Sans',
            fontSize: '16px',
            fill: '#fff',
            backgroundColor: '#28a745',
            padding: { x: 10, y: 5 }
        }).setDepth(100).setVisible(false);

        // Add mountain-specific quest markers
        this.addMountainQuests();

        // Initialize Redux inventory system
        this.inventory = getReduxInventoryManager();
        this.inventory.init(this);
    }

    addMountainQuests() {
        // Create mountain activity quests
        const mountainQuests = [
            {
                id: 'mountain_camping',
                title: 'Piknik',
                description: 'Piknik di alam terbuka',
                x: 43,
                y: 179,
                statChanges: { happiness: 25, sleep: -15, meal: 10 },
                scoreIncrease: 120
            },
            {
                id: 'mountain_photography',
                title: 'Fotografi Alam',
                description: 'Mengambil foto pemandangan alam yang indah',
                x: 220,
                y: 160,
                statChanges: { happiness: 30, cleanliness: -5 },
                scoreIncrease: 100
            }
        ];

        // Add quest markers to the scene
        mountainQuests.forEach(quest => {
            // Create star marker
            let marker;
            try {
                if (this.textures.exists('star')) {
                    marker = this.add.image(quest.x, quest.y, 'star');
                    marker.setScale(0.5); // Mountain appropriate size (smaller)
                } else {
                    marker = this.add.circle(quest.x, quest.y, 10, 0xffff00, 0.8);
                }
            } catch (error) {
                marker = this.add.circle(quest.x, quest.y, 10, 0xffff00, 0.8);
            }
            
            marker.setDepth(150);
            marker.questId = quest.id;
            marker.questData = quest;
            
            // Add floating animation
            this.tweens.add({
                targets: marker,
                y: quest.y - 6,
                duration: 1100,
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
            const questText = this.add.text(quest.x, quest.y - 20, quest.title, {
                fontFamily: 'Pixelify Sans',
                fontSize: '9px',
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
        if (!this.player || !this.cursors) {
            console.error('Player or cursors not initialized!');
            return;
        }

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

        // Check for nearby mountain quests (only visible ones)
        const nearbyQuests = this.questMarkers.filter(questMarker => {
            if (!questMarker.marker.visible) return false; // Skip hidden markers
            
            const distance = Phaser.Math.Distance.Between(
                this.player.x, this.player.y,
                questMarker.quest.x, questMarker.quest.y
            );
            return distance < 35; // Smaller radius for mountain (more compact)
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
            
            this.questButton.setPosition(this.player.x - 60, this.player.y - 60);
            this.questButton.setVisible(true);
            this.nearestQuestId = nearestQuest.id;
        } else if (nearbyQuests.length === 0 && this.questButton.visible) {
            this.questButton.setVisible(false);
            this.nearestQuestId = null;
        }

        // Handle quest completion with cooldown
        if (this.nearestQuestId && cursors.quest.isDown && !this.questKeyPressed && !this.isDoingQuest) {
            console.log(`Starting mountain quest: ${this.nearestQuestId}`);
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
                    this.player.anims.play(`${playerKey}_action`, true);
                    
                    // Set timer to unfreeze player when quest completes
                    const cooldownMs = reduxBridge.getQuestCooldownDuration(questMarker.quest.id);
                    if (cooldownMs > 0) {
                        setTimeout(() => {
                            this.isDoingQuest = false;
                            // Return to idle animation after quest completes
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
            this.questButton.setPosition(this.player.x - 60, this.player.y - 60);
            
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

        // Handle exit interaction
        if (this.nearExit && cursors.interact.isDown) {
            this.scene.start('MainScene');
        }

        // Update exit button position to follow player
        if (this.nearExit) {
            this.exitButton.setPosition(this.player.x - 50, this.player.y - 50);
        }

        this.player.setVelocity(0);

        let moving = false;

        // Only allow movement if not doing a quest
        if (!this.isDoingQuest) {
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

        // Play idle animation if not moving (but not if doing a quest)
        if (!moving && !this.isDoingQuest) {
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