var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-canvas',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var game = new Phaser.Game(config);

// Game variables
let platformX, platformY, platformWidth, platformHeight;
let ballX, ballY, ballRadius, ballSpeedX, ballSpeedY, ballRotationAngle, ballRotationSpeed;
let blocks = [];
let blockWidth, blockHeight;
let isGameRunning = false;
let countdownTimer;
let currentLevel = 1;
let score = 0;
let personalBest = 0;
let ballImage;
let platformBounce;
let lastTimestamp = null;
let maxSpeed = 13;
let isInvincible = false;

function preload() {
    this.load.image('ball', '/imgs/GreenBean.png');
}

function create() {
    // Get references to the DOM elements
    const startGameButton = this.add.dom(400, 300, 'button', 'background-color: #4CAF50; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer;', 'Start Game').setOrigin(0.5);
    const countdownContainer = this.add.dom(400, 300, 'div', 'display: none; justify-content: center; align-items: center; font-size: 48px;', '').setOrigin(0.5);
    const countdownElement = this.add.text(0, 0, '', { fontSize: '48px' }).setOrigin(0.5);
    const scoreElement = this.add.text(10, 10, 'Score: 0', { fontSize: '24px' });
    const personalBestElement = this.add.text(10, 40, 'Personal Best: 0', { fontSize: '24px' });

    // Initialize game variables
    platformX = 350;
    platformY = 550;
    platformWidth = 100;
    platformHeight = 20;
    ballX = this.game.config.width / 2;
    ballY = this.game.config.height / 2;
    ballRadius = 20;
    ballSpeedX = 2;
    ballSpeedY = 2;
    blockWidth = 80;
    blockHeight = 30;
    countdownTimer = 3;
    platformBounce = 10;
    ballImage = this.textures.get('ball').source[0].image;
    ballRotationAngle = 0;
    ballRotationSpeed = 0.1;

    // Create blocks
    createBlocks(currentLevel);

    // Start game button click
    startGameButton.setInteractive();
    startGameButton.on('pointerdown', startGame, this);

    // Handle mouse/touch input for platform movement
    this.input.on('pointermove', (pointer) => {
        if (isGameRunning) {
            platformX = Phaser.Math.Clamp(pointer.x - platformWidth / 2, 0, this.game.config.width - platformWidth);
        }
    });
}

function update(time, delta) {
    if (!isGameRunning) {
        return;
    }

    let elapsed = 0;
    if (lastTimestamp) {
        elapsed = time - lastTimestamp;
    }
    lastTimestamp = time;

    // Update ball position
    ballX += ballSpeedX * (elapsed / 16.67);
    ballY += ballSpeedY * (elapsed / 16.67);

    // Update the rotation angle
    ballRotationAngle += ballRotationSpeed;

    // Bounce the ball off the walls
    if (ballX - ballRadius < 0 || ballX + ballRadius > this.game.config.width) {
        ballSpeedX *= -1;
    }
    if (ballY - ballRadius < 0) {
        ballSpeedY *= -1;
    }

    // Handle platform collision
    if (ballY + ballRadius >= platformY && ballY - ballRadius < platformY && ballX >= platformX && ballX <= platformX + platformWidth) {
        // Calculate where the ball hit the platform
        let collidePoint = (ballX - (platformX + platformWidth / 2)) / (platformWidth / 2);

        // Calculate the angle of the ball's bounce
        let angle = collidePoint * (Math.PI / 3);

        // Update ball speed for bounce
        ballSpeedY = -platformBounce * Math.cos(angle);
        ballSpeedX = platformBounce * Math.sin(angle);
    }

    // Check for collisions with blocks
    for (let i = 0; i < blocks.length; i++) {
        let block = blocks[i];
        if (block.visible) {
            if (ballX + ballRadius > block.x && ballX - ballRadius < block.x + block.width && ballY + ballRadius > block.y && ballY - ballRadius < block.y + block.height) {
                // Collision detected, hide the block
                block.visible = false;

                // Bounce the ball
                ballSpeedY *= -1;

                // If the block is blue, make the bean invincible for 5 seconds
                if (block.color === 'blue') {
                    isInvincible = true;
                    setTimeout(() => {
                        isInvincible = false;
                    }, 5000);
                }

                // If the block is red, increase the speed of the ball by 10%
                if (block.color === 'red') {
                    ballSpeedX *= 1.1;
                    ballSpeedY *= 1.1;
                    platformBounce *= 1.1;
                    console.log("gained speed");

                    // Check if the new speed exceeds the maximum limit
                    if (Math.abs(ballSpeedX) > maxSpeed) {
                        ballSpeedX = ballSpeedX > 0 ? maxSpeed : -maxSpeed;
                    }
                    if (Math.abs(ballSpeedY) > maxSpeed) {
                        ballSpeedY = ballSpeedY > 0 ? maxSpeed : -maxSpeed;
                    }
                    if (platformBounce > maxSpeed) {
                        platformBounce = maxSpeed;
                        console.log("Max speed reached");
                    }
                }

                // Increase the score
                score++;

                // Update the personal best
                if (score > personalBest) {
                    personalBest = score;
                    personalBestElement.setText(`Personal Best: ${personalBest}`);
                }

                // Exit the loop
                break;
            }
        }
    }

    // Respawn blocks if all are destroyed
    if (blocks.every(block => !block.visible)) {
        currentLevel++;
        createBlocks(currentLevel);
        isGameRunning = false;
        countdownTimer = 3;
        countdownContainer.setVisible(true);
        countdownElement.setText(countdownTimer);
        const countdownInterval = setInterval(() => {
            countdownTimer--;
            countdownElement.setText(countdownTimer);
            if (countdownTimer === 0) {
                clearInterval(countdownInterval);
                countdownContainer.setVisible(false);
                resetGame();
                startGame();
            }
        }, 1000);
    }

    // Check if the ball falls below the platform
    if (ballY + ballRadius > this.game.config.height) {
        if (!isInvincible) {
            isGameRunning = false;
            createBlocks(currentLevel); // Recreate the blocks
            alert(`Game Over! Your score: ${score}. Press OK or the Start Game button to restart.`);
            resetGame();
            score = 0; // Reset the score
        } else {
            ballSpeedY *= -1;
        }
    }

    // Draw the game objects
    this.clear();
    this.fillStyle('black');
    this.fillRect(platformX, platformY, platformWidth, platformHeight);
    this.save();
    this.translate(ballX, ballY);
    this.rotate(ballRotationAngle);
    this.drawImage(ballImage, -ballRadius, -ballRadius, ballRadius * 2, ballRadius * 2);
    this.restore();
    blocks.forEach(block => {
        if (block.visible) {
            this.fillStyle(block.color);
            this.fillRect(block.x, block.y, block.width, block.height);
        }
    });
    scoreElement.setText(`Score: ${score}`);
}

function startGame() {
    isGameRunning = true;
    countdownTimer = 3;
    this.add.dom(400, 300, 'div', 'display: flex; justify-content: center; align-items: center; font-size: 48px;', countdownTimer.toString()).setOrigin(0.5);
    const countdownInterval = setInterval(() => {
        countdownTimer--;
        this.add.dom(400, 300, 'div', 'display: flex; justify-content: center; align-items: center; font-size: 48px;', countdownTimer.toString()).setOrigin(0.5);
        if (countdownTimer === 0) {
            clearInterval(countdownInterval);
            this.add.dom(400, 300, 'div', 'display: none;', '').setOrigin(0.5);
            resetGame();
            this.gameLoop(performance.now());
        }
    }, 1000);
}

function resetGame() {
    // Reset game variables
    platformX = 350;
    ballX = this.game.config.width / 2;
    ballY = this.game.config.height / 2;
    ballSpeedX = 0;
    ballSpeedY = 10;
    lastTimestamp = null;
    platformBounce = 10;
}

function createBlocks(level) {
    blocks = [];
    const numBlocksX = Math.floor(this.game.config.width / blockWidth) - 1;
    const numBlocksY = Math.floor((this.game.config.height - platformHeight - 400) / blockHeight);
    for (let i = 0; i < numBlocksX; i++) {
        for (let j = 0; j < numBlocksY; j++) {
            blocks.push({
                x: i * blockWidth + 50,
                y: j * blockHeight + 50,
                width: blockWidth,
                height: blockHeight,
                visible: true,
                color: 'green' // default to green
            });
        }
    }

    // Generate a random number of blue blocks between 0 and 1
    let numBlueBlocks = Phaser.Math.Between(0, 1);

    // Randomly select blocks to be blue
    for (let i = 0; i < numBlueBlocks; i++) {
        let randomBlockIndex = Phaser.Math.Between(0, blocks.length - 1);
        blocks[randomBlockIndex].color = 'blue';
    }

    // Generate a random number of red blocks between 1 and 5
    let numRedBlocks = Phaser.Math.Between(1, 3);

    // Randomly select blocks to be red
    for (let i = 0; i < numRedBlocks; i++) {
        let randomBlockIndex = Phaser.Math.Between(0, blocks.length - 1);
        blocks[randomBlockIndex].color = 'red';
    }
}

function gameLoop(timestamp) {
    if (!isGameRunning) {
        return;
    }

    this.update(timestamp, 0);
    requestAnimationFrame(this.gameLoop.bind(this));
}