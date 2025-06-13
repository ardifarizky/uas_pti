import { EventBus } from '../EventBus';
import { Scene } from 'phaser';

export class Game extends Scene
{
    constructor ()
    {
        super('Game');
    }

    create ()
    {
        // Create a larger world for the player to move in
        this.physics.world.setBounds(0, 0, 2000, 2000);
        
        // Create the player sprite
        this.player = this.physics.add.sprite(400, 300, 'player');
        this.player.setCollideWorldBounds(true);
        
        // Set up camera to follow the player
        this.cameras.main.setBounds(0, 0, 2000, 2000);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setZoom(1);
        
        // Add some background elements to show camera movement
        for (let i = 0; i < 10; i++) {
            const x = Phaser.Math.Between(0, 2000);
            const y = Phaser.Math.Between(0, 2000);
            this.add.image(x, y, 'background').setAlpha(0.5);
        }

        // Set up player movement
        this.cursors = this.input.keyboard.createCursorKeys();

        EventBus.emit('current-scene-ready', this);
    }

    update() {
        // Handle player movement
        const speed = 200;
        
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-speed);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(speed);
        } else {
            this.player.setVelocityX(0);
        }

        if (this.cursors.up.isDown) {
            this.player.setVelocityY(-speed);
        } else if (this.cursors.down.isDown) {
            this.player.setVelocityY(speed);
        } else {
            this.player.setVelocityY(0);
        }
    }

    changeScene ()
    {
        this.scene.start('GameOver');
    }
}
