import Phaser from 'phaser';
import { getReduxInventoryManager } from '../items/ReduxInventoryManager.js';
import reduxBridge from '../ReduxBridge.js';
import { modifyStats } from '../../store/gameStatsSlice.js';

export default class BeachScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BeachScene' });
        this.player = null;
        this.cursors = null;
        this.lastDirection = 'down';

        this.nearExit = false;
        this.exitButton = null;
        this.playerSpeedMultiplier = 1.0; // For inventory speed effects
        this.inventory = null;
        
        // Shop variables
        this.nearShop = false;
        this.shopButton = null;
        this.shopMenu = null;
        this.shopVisible = false;

        // Quest system variables
        this.nearQuest = false;
        this.questButton = null;
        this.nearestQuestId = null;
        this.questKeyPressed = false;
        this.questMarkers = [];
        this.isDoingQuest = false; // Track if player is currently doing a quest
    }

    preload() {
        // Load the beach map
        this.load.tilemapTiledJSON('beach_map', '/map/beach.tmj');
        
        // Load beach tileset images
        this.load.image('ex_beach', '/assets/ex_beach.png');
        
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
        const map = this.make.tilemap({ key: 'beach_map' });
        
        // Add beach tileset
        const beachTileset = map.addTilesetImage('ex_beach', 'ex_beach');
        
        // Create layers in the correct order
        const ground = map.createLayer('ground', beachTileset);
        ground.setDepth(0);
        
        const furniture = map.createLayer('furniture', beachTileset);
        furniture.setDepth(2);

        // Set collisions for furniture layer
        furniture.setCollisionByProperty({ collide: true });

        // Set world bounds to match the map size
        this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        
        // Create player with selected character
        const playerKey = `player${this.playerInfo.character.id}`;
        this.player = this.physics.add.sprite(187, 221, playerKey); // Start position on beach
        this.player.setCollideWorldBounds(true);
        this.player.body.setSize(16, 10);
        this.player.body.setOffset(0, 22);
        this.player.setDepth(2.5);

        // Initialize scene in Redux
        reduxBridge.updateCurrentScene('BeachScene');

        // Set up camera to follow player with bounds
        this.cameras.main.startFollow(this.player);
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.cameras.main.setZoom(2);

        // Set up collisions
        this.physics.add.collider(this.player, furniture);

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

        // Create exit zone at spawn location
        const exitZone = this.add.zone(187, 221, 32, 32);
        this.physics.add.existing(exitZone, true);
        
        // Visual indicator removed for cleaner gameplay

        // Set up exit zones array
        this.exitZones = [exitZone];

        // Add overlap detection between player and exit zones
        this.physics.add.overlap(this.player, this.exitZones, this.handleExitOverlap, null, this);

        // Create shop at x=176, y=61
        this.createShop();

        // Create quest interaction button (initially hidden)
        this.questButton = this.add.text(0, 0, 'Press Q to Start Quest', {
            fontFamily: 'Pixelify Sans',
            fontSize: '16px',
            fill: '#fff',
            backgroundColor: '#28a745',
            padding: { x: 10, y: 5 }
        }).setDepth(100).setVisible(false);

        // Add beach-specific quest markers
        this.addBeachQuests();

        // Initialize Redux inventory system
        this.inventory = getReduxInventoryManager();
        this.inventory.init(this);
    }

    addBeachQuests() {
        // Create beach activity quests
        const beachQuests = [
            {
                id: 'beach_collect_shells',
                title: 'Kumpulkan Kerang',
                description: 'Mengumpulkan kerang indah di pantai',
                x: 200,
                y: 150,
                statChanges: { happiness: 20, cleanliness: -5 },
                scoreIncrease: 80
            },
            {
                id: 'beach_volleyball',
                title: 'Membuat Istana Pasir',
                description: 'Membuat Istana Pasir',
                x: 120,
                y: 120,
                statChanges: { happiness: 30, meal: -15 },
                scoreIncrease: 120
            }
        ];

        // Add quest markers to the scene
        beachQuests.forEach(quest => {
            // Create star marker
            let marker;
            try {
                if (this.textures.exists('star')) {
                    marker = this.add.image(quest.x, quest.y, 'star');
                    marker.setScale(0.7); // Beach appropriate size
                } else {
                    marker = this.add.circle(quest.x, quest.y, 14, 0xffff00, 0.8);
                }
            } catch (error) {
                marker = this.add.circle(quest.x, quest.y, 14, 0xffff00, 0.8);
            }
            
            marker.setDepth(150);
            marker.questId = quest.id;
            marker.questData = quest;
            
            // Add floating animation
            this.tweens.add({
                targets: marker,
                y: quest.y - 10,
                duration: 1400,
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
            const questText = this.add.text(quest.x, quest.y - 30, quest.title, {
                fontFamily: 'Pixelify Sans',
                fontSize: '11px',
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

    createShop() {
        // Create shop zone at lowered position (invisible hitbox)
        const shopZone = this.add.zone(176, 90, 48, 48);
        this.physics.add.existing(shopZone, true);
        
        // Add shop text at original position (keep text visible)
        const shopText = this.add.text(176, 61, 'Warung\nMinuman', {
            fontFamily: 'Pixelify Sans',
            fontSize: '10px',
            fill: '#fff',
            backgroundColor: '#8B4513',
            padding: { x: 2, y: 2 },
            align: 'center'
        })
        .setDepth(2)
        .setOrigin(0.5);

        // Create shop button (initially hidden)
        this.shopButton = this.add.text(0, 0, 'Press E to Shop', {
            fontFamily: 'Pixelify Sans',
            fontSize: '16px',
            fill: '#fff',
            backgroundColor: '#8B4513',
            padding: { x: 10, y: 5 }
        }).setDepth(100).setVisible(false);

        // Set up shop zone
        this.shopZone = shopZone;

        // Add overlap detection between player and shop zone
        this.physics.add.overlap(this.player, this.shopZone, this.handleShopOverlap, null, this);
    }

    handleShopOverlap(player, zone) {
        if (!this.nearShop) {
            this.nearShop = true;
            // Position the button above the player
            this.shopButton.setPosition(player.x - 50, player.y - 50);
            this.shopButton.setVisible(true);
        }
    }

    openShop() {
        if (this.shopVisible) return;
        
        this.shopVisible = true;
        
        // Create shop menu
        const shopBg = this.add.rectangle(this.cameras.main.centerX, this.cameras.main.centerY, 400, 300, 0x000000, 0.8)
            .setDepth(200)
            .setScrollFactor(0);
        
        const shopTitle = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY - 120, 'WARUNG MINUMAN PANTAI', {
            fontFamily: 'Pixelify Sans',
            fontSize: '20px',
            fill: '#FFD700',
            fontWeight: 'bold'
        })
        .setDepth(201)
        .setOrigin(0.5)
        .setScrollFactor(0);

        // Get current money
        const gameStats = reduxBridge.getGameStats();
        const currentMoney = gameStats ? gameStats.stats.money : 0;

        const moneyText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY - 90, `Uang: ${currentMoney}`, {
            fontFamily: 'Pixelify Sans',
            fontSize: '16px',
            fill: '#fff'
        })
        .setDepth(201)
        .setOrigin(0.5)
        .setScrollFactor(0);

        // Create drink options
        const drinks = [
            { id: 'es_kelapa', name: 'Es Kelapa', price: 50, description: '+20 Makanan' },
            { id: 'es_campur', name: 'Es Campur', price: 75, description: '+25 Makanan' },
            { id: 'es_cendol', name: 'Es Cendol', price: 100, description: '+30 Makanan' }
        ];

        const drinkTexts = [];
        drinks.forEach((drink, index) => {
            const yPos = this.cameras.main.centerY - 30 + (index * 40);
            const canAfford = currentMoney >= drink.price;
            
            const drinkText = this.add.text(this.cameras.main.centerX, yPos, 
                `${drink.name} - ${drink.price} uang (${drink.description})`, {
                fontFamily: 'Pixelify Sans',
                fontSize: '14px',
                fill: canAfford ? '#fff' : '#666',
                backgroundColor: canAfford ? '#006400' : '#333',
                padding: { x: 10, y: 5 }
            })
            .setDepth(201)
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setInteractive();

            if (canAfford) {
                drinkText.on('pointerdown', () => this.buyDrink(drink));
                drinkText.on('pointerover', () => drinkText.setStyle({ backgroundColor: '#228B22' }));
                drinkText.on('pointerout', () => drinkText.setStyle({ backgroundColor: '#006400' }));
            }

            drinkTexts.push(drinkText);
        });

        // Close button
        const closeButton = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY + 100, 'Tutup (Esc)', {
            fontFamily: 'Pixelify Sans',
            fontSize: '16px',
            fill: '#fff',
            backgroundColor: '#8B0000',
            padding: { x: 10, y: 5 }
        })
        .setDepth(201)
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setInteractive();

        closeButton.on('pointerdown', () => this.closeShop());

        // Store shop elements for cleanup
        this.shopMenu = {
            background: shopBg,
            title: shopTitle,
            money: moneyText,
            drinks: drinkTexts,
            close: closeButton
        };
    }

    buyDrink(drink) {
        const gameStats = reduxBridge.getGameStats();
        const currentMoney = gameStats ? gameStats.stats.money : 0;

        if (currentMoney >= drink.price) {
            // Spend money
            reduxBridge.dispatch(modifyStats({ money: -drink.price }));
            
            // Add drink to inventory
            reduxBridge.addItemToInventory(drink.id, 1);
            
            // Show purchase message
            const purchaseText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY + 60, 
                `Membeli ${drink.name}!`, {
                fontFamily: 'Pixelify Sans',
                fontSize: '16px',
                fill: '#00FF00',
                backgroundColor: '#000',
                padding: { x: 5, y: 2 }
            })
            .setDepth(202)
            .setOrigin(0.5)
            .setScrollFactor(0);

            // Remove message after 2 seconds
            this.time.delayedCall(2000, () => {
                purchaseText.destroy();
            });

            // Close shop after purchase
            this.time.delayedCall(1000, () => {
                this.closeShop();
            });
        }
    }

    closeShop() {
        if (!this.shopVisible) return;
        
        this.shopVisible = false;
        
        // Destroy shop menu elements
        if (this.shopMenu) {
            Object.values(this.shopMenu).forEach(element => {
                if (Array.isArray(element)) {
                    element.forEach(item => item.destroy());
                } else {
                    element.destroy();
                }
            });
            this.shopMenu = null;
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

        // Check for nearby beach quests (only visible ones)
        const nearbyQuests = this.questMarkers.filter(questMarker => {
            if (!questMarker.marker.visible) return false; // Skip hidden markers
            
            const distance = Phaser.Math.Distance.Between(
                this.player.x, this.player.y,
                questMarker.quest.x, questMarker.quest.y
            );
            return distance < 50;
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
            
            this.questButton.setPosition(this.player.x - 70, this.player.y - 80);
            this.questButton.setVisible(true);
            this.nearestQuestId = nearestQuest.id;
        } else if (nearbyQuests.length === 0 && this.questButton.visible) {
            this.questButton.setVisible(false);
            this.nearestQuestId = null;
        }

        // Handle quest completion with cooldown
        if (this.nearestQuestId && cursors.quest.isDown && !this.questKeyPressed && !this.isDoingQuest) {
            console.log(`Starting beach quest: ${this.nearestQuestId}`);
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
                    if (this.anims.exists(`${playerKey}_action`)) {
                        this.player.anims.play(`${playerKey}_action`, true);
                        console.log(`Action animation started successfully`);
                    } else {
                        console.error(`Action animation ${playerKey}_action not found`);
                        // Fallback to idle animation
                        this.player.anims.play(`${playerKey}_idle_${this.lastDirection}`, true);
                    }
                    
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
            this.questButton.setPosition(this.player.x - 70, this.player.y - 80);
            
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

        // Check if player is near the shop
        const isNearShop = this.shopZone && Phaser.Math.Distance.Between(
            this.player.x, this.player.y,
            this.shopZone.x, this.shopZone.y
        ) < 50;

        if (!isNearShop && this.nearShop) {
            this.nearShop = false;
            this.shopButton.setVisible(false);
        }

        // Handle interactions
        if (Phaser.Input.Keyboard.JustDown(cursors.interact)) {
            if (this.nearShop && !this.shopVisible) {
                this.openShop();
            } else if (this.nearExit) {
                this.scene.start('MainScene');
            }
        }

        // Handle ESC key to close shop
        if (this.input.keyboard.addKey('ESC').isDown && this.shopVisible) {
            this.closeShop();
        }

        // Update button positions to follow player
        if (this.nearExit) {
            this.exitButton.setPosition(this.player.x - 50, this.player.y - 50);
        }
        if (this.nearShop) {
            this.shopButton.setPosition(this.player.x - 50, this.player.y - 50);
        }
    }
} 