import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import MainScene from '../game/scenes/MainScene';
import HouseScene from '../game/scenes/HouseScene';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Game = () => {
    const gameRef = useRef(null);
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [showTaskButton, setShowTaskButton] = useState(false);
    const [currentTask, setCurrentTask] = useState(null);

    useEffect(() => {
        if (!currentUser) {
            navigate('/login');
            return;
        }

        const gameConfig = {
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
            scene: [MainScene, HouseScene]
        };

        const game = new Phaser.Game(gameConfig);

        // Initialize player stats if not exists
        if (!game.registry.get('playerStats')) {
            game.registry.set('playerStats', {
                sleep: 100,
                cleanliness: 100
            });
        }

        // Listen for task events
        game.events.on('showTaskButton', (taskName) => {
            setShowTaskButton(true);
            setCurrentTask(taskName);
        });

        game.events.on('hideTaskButton', () => {
            setShowTaskButton(false);
            setCurrentTask(null);
        });

        gameRef.current = game;

        return () => {
            game.destroy(true);
        };
    }, [currentUser, navigate]);

    const handleTaskClick = () => {
        if (gameRef.current) {
            gameRef.current.events.emit('taskButtonClicked');
        }
    };

    return (
        <div className="relative">
            <div id="game-container" className="w-full h-screen"></div>
            {showTaskButton && (
                <button
                    onClick={handleTaskClick}
                    className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-600 transition-colors"
                >
                    {currentTask ? `Press E to ${currentTask}` : 'Press E to Interact'}
                </button>
            )}
        </div>
    );
};

export default Game; 