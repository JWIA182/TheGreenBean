// Get references to the DOM elements
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
let platformBounce = 10;
ballImage.src = '/imgs/GreenBean.png';
let lastTimestamp = null;
let maxSpeed = 13;
let isInvincible = false;

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
        visible: true,
        color: 'green' // default to green
      });
    }
  }

  // Generate a random number of blue blocks between 0 and 1
  let numBlueBlocks = Math.floor(Math.random() * 2);

  // Randomly select blocks to be blue
  for (let i = 0; i < numBlueBlocks; i++) {
    let randomBlockIndex = Math.floor(Math.random() * blocks.length);
    blocks[randomBlockIndex].color = 'blue';
  }

  // Generate a random number of red blocks between 1 and 5
  let numRedBlocks = Math.floor(Math.random() * 3) + 1;

  // Randomly select blocks to be red
  for (let i = 0; i < numRedBlocks; i++) {
    let randomBlockIndex = Math.floor(Math.random() * blocks.length);
    blocks[randomBlockIndex].color = 'red';
  }
}

// Draw the blocks
blocks.forEach(block => {
  if (block.visible) {
    ctx.fillStyle = block.color; // use the color property of the block
    ctx.fillRect(block.x, block.y, block.width, block.height);
  }
});

// Handle mouse movement
canvas.addEventListener('mousemove', (event) => {
  if (isGameRunning) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    platformX = (event.clientX - rect.left) * scaleX - platformWidth / 2;
    if (platformX < 0) {
      platformX = 0;
    } else if (platformX + platformWidth > canvas.width) {
      platformX = canvas.width - platformWidth;
    }
  }
});

// Variables to track touch movement
let touchStartX = null;

// Handle touch event for platform movement
canvas.addEventListener('touchstart', (event) => {
  if (isGameRunning) {
    const touch = event.touches[0];
    touchStartX = touch.clientX;
  }
});

// Handle touch event for platform movement
canvas.addEventListener('touchmove', (event) => {
  event.preventDefault(); // Prevent default touch behavior, such as scrolling
  if (isGameRunning) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const touch = event.touches[0];
    platformX = (touch.clientX - rect.left) * scaleX - platformWidth / 2;
    if (platformX < 0) {
      platformX = 0;
    } else if (platformX + platformWidth > canvas.width) {
      platformX = canvas.width - platformWidth;
    }
  }
});

canvas.addEventListener('touchend', () => {
  touchStartX = null;
});

createBlocks(currentLevel);

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

// Start the game loop
gameLoop(performance.now());

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
  ctx.fillStyle = 'black';
  ctx.fillRect(platformX, platformY, platformWidth, platformHeight);

  // Draw the ball with rotation
  if (ballImage.complete) {
    ctx.save(); // Save the current drawing state
    ctx.translate(ballX, ballY); // Move the drawing origin to the center of the ball
    ctx.rotate(ballRotationAngle); // Rotate the canvas
    ctx.drawImage(ballImage, -ballRadius, -ballRadius, ballRadius * 2, ballRadius * 2); // Draw the ball with its top left corner at the drawing origin
    ctx.restore(); // Restore the drawing state to undo the translation and rotation
  }

  // Draw the blocks
  blocks.forEach(block => {
    if (block.visible) {
      ctx.fillStyle = block.color; // use the color property of the block
      ctx.fillRect(block.x, block.y, block.width, block.height);
    }
  });

  // Update ball position
  ballX += ballSpeedX * (elapsed / 16.67);
  ballY += ballSpeedY * (elapsed / 16.67);

  // Update the rotation angle
  ballRotationAngle += ballRotationSpeed;

  // Bounce the ball off the walls
  if (ballX - ballRadius < 0 || ballX + ballRadius > canvas.width) {
    ballSpeedX *= -1;
  }
  if (ballY - ballRadius < 0) {
    ballSpeedY *= -1;
  }

  // Replace the existing collision detection with the new one
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
          console.log("gained speed")

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

        // Exit the loop
        break;
      }
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
    if (!isInvincible) {
      isGameRunning = false;
      createBlocks(currentLevel); // Recreate the blocks
      alert(`Game Over! Your score: ${score}. Press OK or the Start Game button to restart.`);
      resetGame();
      score = 0; // Reset the score
    }else{
      ballSpeedY *= -1;
    }
  }

  // Request the next frame
  requestAnimationFrame(gameLoop);
}

function resetGame() {
  // Reset game variables
  platformX = 350;
  ballX = canvas.width / 2;
  ballY = canvas.height / 2;
  ballSpeedX = 0;
  ballSpeedY = 10;
  lastTimestamp = null;
  platformBounce = 10;
}