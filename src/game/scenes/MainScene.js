import Phaser from 'phaser';
import { getReduxInventoryManager } from '../items/ReduxInventoryManager.js';
import reduxBridge from '../ReduxBridge.js';

export default class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
        this.player = null;
        this.cursors = null;
        this.lastDirection = 'down'; // Initial direction
        this.doorButton = null;
        this.nearDoor = false;
        this.zoomText = null; // Add zoom level display reference
        this.playerSpeedMultiplier = 1.0; // For inventory speed effects
        this.inventory = null;
        this.questMarkers = []; // Array to store quest markers
        this.questButton = null; // Button for quest interaction
        this.questKeyPressed = false; // Track if Q key is currently pressed
        this.currentZoom = 1.5; // Initial zoom level for better character visibility
    }

    preload() {
        console.log('Preload started');
        // Load the map
        this.load.tilemapTiledJSON('map', 'map/mainland.tmj');
        // Load tileset image
        this.load.image('ex_terrain', 'assets/ex_terrain.png');
        this.load.image('ex_villa', 'assets/ex_villa.png');
        
        // Load quest marker assets
        this.load.image('star', 'assets/star.png');
        
        // Load all player sprites
        this.load.spritesheet('player1', 'assets/player1.png', {
            frameWidth: 16,
            frameHeight: 32
        });
        this.load.spritesheet('player2', 'assets/player2.png', {
            frameWidth: 16,
            frameHeight: 32
        });
        this.load.spritesheet('player3', 'assets/player3.png', {
            frameWidth: 16,
            frameHeight: 32
        });
        this.load.spritesheet('player4', 'assets/player4.png', {
            frameWidth: 16,
            frameHeight: 32
        });
        this.load.spritesheet('player5', 'assets/player5.png', {
            frameWidth: 16,
            frameHeight: 32
        });
    }

    create() {
        console.log('Create started');
        this.playerInfo = this.sys.game.registry.get('playerInfo');
        console.log('Player Info:', this.playerInfo);

        if (!this.playerInfo) {
            console.error('No player info found in registry!');
            return;
        }

        // Create the tilemap
        const map = this.make.tilemap({ key: 'map' });
        const terrainTileset = map.addTilesetImage('ex_terrain', 'ex_terrain');
        const villaTileset = map.addTilesetImage('ex_villa', 'ex_villa');
        
        // Create layers (adjust layer names based on your map)
        const ground = map.createLayer('ground', terrainTileset);
        ground.setDepth(0);
        const wall = map.createLayer('wall', villaTileset);
        wall.setDepth(1);
        const roof = map.createLayer('roof', villaTileset);
        roof.setDepth(3);

        // Set collisions for obstacles
        wall.setCollisionByProperty({ collide: true });
        roof.setCollisionByProperty({ collide: true });

        // Set world bounds to match the map size
        this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        
        // Create player with selected character
        const playerKey = `player${this.playerInfo.character.id}`;
        console.log('Creating player with key:', playerKey);
        
        this.player = this.physics.add.sprite(528, 597, playerKey);
        if (!this.player) {
            console.error('Failed to create player sprite!');
            return;
        }
        
        this.player.setCollideWorldBounds(true); // Enable world bounds for player
        this.player.body.setSize(16, 10);
        this.player.body.setOffset(0, 22);
        this.player.setDepth(2);

        // Initialize scene in Redux
        reduxBridge.updateCurrentScene('MainScene');

        // Create zoom level display
        this.zoomText = this.add.text(10, 40, '', {
            fontFamily: 'Pixelify Sans',
            fontSize: '16px',
            fill: '#fff',
            backgroundColor: '#000',
            padding: { x: 5, y: 5 }
        }).setDepth(1000).setScrollFactor(0, 0); // Explicitly set both X and Y scroll factors to 0

        // Set up camera to follow player with bounds
        this.cameras.main.startFollow(this.player);
        // Set camera bounds to match the map size
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        // Set initial zoom level for better character visibility
        this.cameras.main.setZoom(this.currentZoom);

        // Set up collisions
        this.physics.add.collider(this.player, wall);
        this.physics.add.collider(this.player, roof);

        // Set up WASD controls
        this.cursors = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            interact: Phaser.Input.Keyboard.KeyCodes.E, // Add E key for interaction
            quest: Phaser.Input.Keyboard.KeyCodes.Q, // Add Q key for quest interaction
            zoomIn: Phaser.Input.Keyboard.KeyCodes.PLUS, // Add + key for zoom in
            zoomOut: Phaser.Input.Keyboard.KeyCodes.MINUS // Add - key for zoom out
        });

        console.log('Controls set up:', this.cursors);

        // Create player animations for the selected character
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

            // Sleep animation (row 4, activity 1: frames 168-173)
            this.anims.create({
                key: `${key}_sleep`,
                frames: this.anims.generateFrameNumbers(key, { start: 168, end: 173 }),
                frameRate: 8,
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

        // Create interaction button (initially hidden)
        this.doorButton = this.add.text(0, 0, 'Press E to Enter', {
            fontFamily: 'Pixelify Sans',
            fontSize: '16px',
            fill: '#fff',
            backgroundColor: '#000',
            padding: { x: 10, y: 5 }
        }).setDepth(100).setVisible(false);

        // Create door zone at specified coordinates
        const doorZone = this.add.zone(523, 538, 32, 32); // 32x32 is a standard door size
        this.physics.add.existing(doorZone, true);
        
        // Visual indicator and text removed for cleaner gameplay

        // Create beach passage zone at specified coordinates
        const beachZone = this.add.zone(25, 980, 32, 32);
        this.physics.add.existing(beachZone, true);
        beachZone.isBeach = true; // Mark this zone as beach entrance
        
        // Visual indicator and text removed for cleaner gameplay

        // Create lake passage zone at specified coordinates
        const lakeZone = this.add.zone(997, 749, 32, 32);
        this.physics.add.existing(lakeZone, true);
        lakeZone.isLake = true; // Mark this zone as lake entrance
        
        // Visual indicator and text removed for cleaner gameplay

        // Create mountain passage zone at specified coordinates
        const mountainZone = this.add.zone(1011, 247, 32, 32);
        this.physics.add.existing(mountainZone, true);
        mountainZone.isMountain = true; // Mark this zone as mountain entrance
        
        // Visual indicator and text removed for cleaner gameplay

        // Set up door zones array with door, beach, lake, and mountain passages
        this.doorZones = [doorZone, beachZone, lakeZone, mountainZone];

        // Add overlap detection between player and door zones
        this.physics.add.overlap(this.player, this.doorZones, this.handleDoorOverlap, null, this);
        
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
        
        // Initialize quest markers
        this.questMarkers = reduxBridge.addQuestMarkersToScene(this);
        
        console.log('Scene setup complete');
    }

    handleDoorOverlap(player, zone) {
        if (!this.nearDoor) {
            this.nearDoor = true;
            // Set button text based on zone type
            if (zone.isBeach) {
                this.doorButton.setText('Press E to Beach');
            } else if (zone.isLake) {
                this.doorButton.setText('Press E to Lake');
            } else if (zone.isMountain) {
                this.doorButton.setText('Press E to Mountain');
            } else {
                this.doorButton.setText('Press E to Enter');
            }
            // Position the button above the player
            this.doorButton.setPosition(player.x - 50, player.y - 50);
            this.doorButton.setVisible(true);
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

        // Update zoom level display
        if (this.zoomText) {
            this.zoomText.setText(`Zoom: ${this.currentZoom.toFixed(2)}x (+/- to zoom)`);
        }

        // Handle zoom controls
        if (cursors.zoomIn.isDown) {
            this.currentZoom = Math.min(this.currentZoom + 0.02, 3.0); // Max zoom 3x
            this.cameras.main.setZoom(this.currentZoom);
            
            // Ensure UI elements stay fixed after zoom change
            this.zoomText.setScrollFactor(0, 0);
        } else if (cursors.zoomOut.isDown) {
            this.currentZoom = Math.max(this.currentZoom - 0.02, 0.5); // Min zoom 0.5x
            this.cameras.main.setZoom(this.currentZoom);
            
            // Ensure UI elements stay fixed after zoom change
            this.zoomText.setScrollFactor(0, 0);
        }

        this.player.setVelocity(0);

        let moving = false;

        if (cursors.left.isDown) {
            console.log('Moving left');
            this.player.setVelocityX(-speed);
            this.player.anims.play(`${playerKey}_walk_left`, true);
            this.lastDirection = 'left';
            moving = true;
        } else if (cursors.right.isDown) {
            console.log('Moving right');
            this.player.setVelocityX(speed);
            this.player.anims.play(`${playerKey}_walk_right`, true);
            this.lastDirection = 'right';
            moving = true;
        }

        if (cursors.up.isDown) {
            console.log('Moving up');
            this.player.setVelocityY(-speed);
            this.player.anims.play(`${playerKey}_walk_up`, true);
            this.lastDirection = 'up';
            moving = true;
        } else if (cursors.down.isDown) {
            console.log('Moving down');
            this.player.setVelocityY(speed);
            this.player.anims.play(`${playerKey}_walk_down`, true);
            this.lastDirection = 'down';
            moving = true;
        }

        // Play idle animation if not moving
        if (!moving) {
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

        // Check if player is near a door
        const isNearDoor = this.doorZones.some(zone => 
            Phaser.Math.Distance.Between(
                this.player.x, this.player.y,
                zone.x, zone.y
            ) < 50
        );

        if (!isNearDoor && this.nearDoor) {
            this.nearDoor = false;
            this.doorButton.setVisible(false);
        }

        // Handle door interaction
        if (this.nearDoor && cursors.interact.isDown) {
            // Find which zone the player is near
            const nearZone = this.doorZones.find(zone => 
                Phaser.Math.Distance.Between(
                    this.player.x, this.player.y,
                    zone.x, zone.y
                ) < 50
            );
            
            if (nearZone && nearZone.isBeach) {
                this.scene.start('BeachScene');
            } else if (nearZone && nearZone.isLake) {
                this.scene.start('LakeScene');
            } else if (nearZone && nearZone.isMountain) {
                this.scene.start('MountainScene');
            } else {
                this.scene.start('HouseScene');
            }
        }

        // Update button position to follow player
        if (this.nearDoor) {
            this.doorButton.setPosition(this.player.x - 50, this.player.y - 50);
        }

        // Update quest markers
        reduxBridge.updateQuestMarkers(this, this.questMarkers);

        // Check for nearby quests
        const nearbyQuests = reduxBridge.checkQuestProximity(this.player.x, this.player.y, 50);
        
        if (nearbyQuests.length > 0 && !this.questButton.visible) {
            const nearestQuest = nearbyQuests[0];
            
            // Check if this quest is on cooldown
            if (reduxBridge.isQuestOnCooldown(nearestQuest.id)) {
                const remaining = reduxBridge.getQuestCooldownRemaining(nearestQuest.id);
                this.questButton.setText(`${nearestQuest.title} (${remaining}s remaining)`);
                this.questButton.setStyle({ backgroundColor: '#FFA500' }); // Orange for cooldown
            } else {
                this.questButton.setText(`Press Q to Start: ${nearestQuest.title}`);
                this.questButton.setStyle({ backgroundColor: '#28a745' }); // Green for available
            }
            
            this.questButton.setPosition(this.player.x - 80, this.player.y - 80);
            this.questButton.setVisible(true);
            this.nearestQuestId = nearestQuest.id;
        } else if (nearbyQuests.length === 0 && this.questButton.visible) {
            this.questButton.setVisible(false);
            this.nearestQuestId = null;
        }

        // Handle quest completion with cooldown (prevent multiple triggers)
        if (this.nearestQuestId && cursors.quest.isDown && !this.questKeyPressed) {
            console.log(`Attempting to start quest completion: ${this.nearestQuestId}`);
            this.questKeyPressed = true;
            
            // Start quest completion with cooldown
            const started = reduxBridge.startQuestCompletion(this.nearestQuestId, this);
            
            if (started) {
                // Hide quest button while quest is in progress
                this.questButton.setVisible(false);
                this.nearestQuestId = null;
            }
            // If not started (on cooldown), button stays visible for retry
        } else if (!cursors.quest.isDown) {
            this.questKeyPressed = false;
        }

        // Update quest button position and cooldown status
        if (this.questButton.visible && this.nearestQuestId) {
            this.questButton.setPosition(this.player.x - 80, this.player.y - 80);
            
            // Update cooldown display if quest is on cooldown
            if (reduxBridge.isQuestOnCooldown(this.nearestQuestId)) {
                const remaining = reduxBridge.getQuestCooldownRemaining(this.nearestQuestId);
                const nearestQuest = reduxBridge.getActiveQuests().find(q => q.id === this.nearestQuestId);
                if (nearestQuest) {
                    this.questButton.setText(`${nearestQuest.title} (${remaining}s remaining)`);
                    this.questButton.setStyle({ backgroundColor: '#FFA500' }); // Orange for cooldown
                }
            }
        }
    }
} 