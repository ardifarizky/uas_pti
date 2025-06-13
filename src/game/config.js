import Phaser from 'phaser';
import MainScene from './scenes/MainScene';
import HouseScene from './scenes/HouseScene';
import BeachScene from './scenes/BeachScene';
import LakeScene from './scenes/LakeScene';
import MountainScene from './scenes/MountainScene';

const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [MainScene, HouseScene, BeachScene, LakeScene, MountainScene],
    pixelArt: true,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

export default config; 