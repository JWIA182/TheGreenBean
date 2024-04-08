const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const startGameButton = document.querySelector('.start-game-button');
const countdownContainer = document.querySelector('.countdown-container');
const countdownElement = document.querySelector('.countdown');
const scoreElement = document.getElementById('score');
const personalBestElement = document.getElementById('personal-best');

// Game variables
let platformX = 350;
let platformY = 550;
let platformWidth = 100;
let platformHeight = 20;
let ballX = canvas.width / 2;
let ballY = canvas.height / 2;
let ballRadius = 20;
let ballSpeedX = 2;
let ballSpeedY = 2;
let blockWidth = 80;
let blockHeight = 30;
let blocks = [];
let isGameRunning = false;
let countdownTimer = 3;
let currentLevel = 1;
let score = 0;
let personalBest = 0;
let ballRotationAngle = 0;
let ballRotationSpeed = 0.1;
let ballImage = new Image();
ballImage.src = '/imgs/GreenBean.png';
let lastTimestamp = null;

// Create blocks
function createBlocks(level) {
    blocks = [];
    const numBlocksX = Math.floor(canvas.width / blockWidth) - 1;
    const numBlocksY = Math.floor((canvas.height - platformHeight - 400) / blockHeight);
    for (let i = 0; i < numBlocksX; i++) {
        for (let j = 0; j < numBlocksY; j++) {
            blocks.push({
                x: i * blockWidth + 50,
                y: j * blockHeight + 50,
                width: blockWidth,
                height: blockHeight,
                visible: true
            });
        }
    }
}
createBlocks(currentLevel);

// Handle mouse movement
canvas.addEventListener('mousemove', (event) => {
    if (isGameRunning) {
        platformX = event.clientX - canvas.offsetLeft - platformWidth / 2;
        if (platformX < 0) {
            platformX = 0;
        } else if (platformX + platformWidth > canvas.width) {
            platformX = canvas.width - platformWidth;
        }
    }
});

// Handle spacebar press
document.addEventListener('keydown', (event) => {
    if (event.code === 'Space' && !isGameRunning) {
        startGame();
    }
});

// Start game button click
startGameButton.addEventListener('click', startGame);

function startGame() {
    isGameRunning = true;
    countdownTimer = 3;
    countdownContainer.style.display = 'flex';
    countdownElement.textContent = countdownTimer;
    const countdownInterval = setInterval(() => {
        countdownTimer--;
        countdownElement.textContent = countdownTimer;
        if (countdownTimer === 0) {
            clearInterval(countdownInterval);
            countdownContainer.style.display = 'none';
            resetGame();
            gameLoop(performance.now());
        }
    }, 1000);
}

function gameLoop(timestamp) {
    if (!isGameRunning) {
        return;
    }

    let elapsed = 0;
    if (lastTimestamp) {
        elapsed = timestamp - lastTimestamp;
    }
    lastTimestamp = timestamp;

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the platform
    ctx.fillRect(platformX, platformY, platformWidth, platformHeight);

    if (ballImage.complete) {
        ctx.drawImage(ballImage, ballX - ballRadius, ballY - ballRadius, ballRadius * 2, ballRadius * 2);
    }

    // Draw the blocks
    blocks.forEach(block => {
        if (block.visible) {
            ctx.fillRect(block.x, block.y, block.width, block.height);
        }
    });

    // Update ball position
    ballX += ballSpeedX * (elapsed / 16.67);
    ballY += ballSpeedY * (elapsed / 16.67);

    // Bounce the ball off the walls
    if (ballX - ballRadius < 0 || ballX + ballRadius > canvas.width) {
        ballSpeedX *= -1;
    }
    if (ballY - ballRadius < 0) {
        ballSpeedY *= -1;
    }

    // Bounce the ball off the platform
    if (ballY + ballRadius >= platformY && ballY - ballRadius < platformY && ballX >= platformX && ballX <= platformX + platformWidth) {
        ballSpeedY *= -1;
    }

    // Check for block collisions
    let blockHit = false;
    for (let i = 0; i < blocks.length; i++) {
        if (blocks[i].visible && ballX - ballRadius < blocks[i].x + blocks[i].width && ballX + ballRadius > blocks[i].x && ballY - ballRadius < blocks[i].y + blocks[i].height && ballY + ballRadius > blocks[i].y) {
            ballSpeedY *= -1;
            blocks[i].visible = false;
            if (!blockHit) {
                score++;
                scoreElement.textContent = score;
                blockHit = true;
            }
            break; // Exit the loop after the first block is hit
        }
    }

    // Update the personal best
    if (score > personalBest) {
        personalBest = score;
        personalBestElement.textContent = personalBest;
    }

    // Respawn blocks if all are destroyed
    if (blocks.every(block => !block.visible)) {
        currentLevel++;
        createBlocks(currentLevel);
        isGameRunning = false;
        countdownTimer = 3;
        countdownContainer.style.display = 'flex';
        countdownElement.textContent = countdownTimer;
        const countdownInterval = setInterval(() => {
            countdownTimer--;
            countdownElement.textContent = countdownTimer;
            if (countdownTimer === 0) {
                clearInterval(countdownInterval);
                countdownContainer.style.display = 'none';
                resetGame();
                startGame();
            }
        }, 1000);
    }

    // Check if the ball falls below the platform
    if (ballY + ballRadius > canvas.height) {
        isGameRunning = false;
        createBlocks(currentLevel); // Recreate the blocks
        alert(`Game Over! Your score: ${score}. Press OK or the Start Game button to restart.`);
        resetGame();
        score = 0; // Reset the score
    }

    // Request the next frame
    requestAnimationFrame(gameLoop);
}

function resetGame() {
    // Reset game variables
    platformX = 350;
    ballX = canvas.width / 2;
    ballY = canvas.height / 2;
    ballSpeedX = 7;
    ballSpeedY = 7;
    lastTimestamp = null;
}