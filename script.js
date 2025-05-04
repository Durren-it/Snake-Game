const playBoard = document.querySelector(".play-board");
const scoreElement = document.querySelector(".score");
const highScoreElement = document.querySelector(".high-score");
const controls = document.querySelectorAll(".controls i");

let speedResetTimeoutId;
let gameOver = false;
let foodX, foodY;
let foodDoubleX, foodDoubleY;
let foodPenaltyX, foodPenaltyY;
let foodSpeedX, foodSpeedY;
let foodSlowX, foodSlowY;
let foodTripleX, foodTripleY; 
let snakeX = 5, snakeY = 5;
let velocityX = 0, velocityY = 0;
let snakeBody = [];
let availableCells = [];
let setIntervalId;
let score = 0;

// Getting high score from the local storage
let highScore = localStorage.getItem("high-score") || 0;
highScoreElement.innerText = `High Score: ${highScore}`;

// Functions for food position management
const getAvailableCells = () => {
    const occupiedCells = new Set();
    availableCells = []; // Reset the array before populating it
    
    // Add snake body cells to occupied set
    snakeBody.forEach(([x, y]) => {
        occupiedCells.add(`${x},${y}`);
    });
    
    // Create array of all available cells
    for (let x = 1; x <= 30; x++) {
        for (let y = 1; y <= 30; y++) {
            if (!occupiedCells.has(`${x},${y}`)) {
                availableCells.push([x, y]);
            }
        }
    }
    
    return availableCells;
};

// Get random position from available cells
const getRandomCell = (availableCells) => {
    const randomIndex = Math.floor(Math.random() * availableCells.length);
    return availableCells[randomIndex];
};

// Function to update available cells after food is created
const updateAvailableCells = (cells, position) => {
    return cells.filter(([x, y]) => x !== position[0] || y !== position[1]);
};

const updateFoodPosition = () => {
    let availableCells = getAvailableCells();
    
    // Check for game over condition (snake fills the board)
    if (availableCells.length === 0) {
        gameOver = true;
        return;
    }

    // Generate base food position
    const baseFood = getRandomCell(availableCells);
    [foodX, foodY] = baseFood;
    availableCells = updateAvailableCells(availableCells, baseFood);

    // Generate double food position
    const doubleFood = getRandomCell(availableCells);
    [foodDoubleX, foodDoubleY] = doubleFood;
    availableCells = updateAvailableCells(availableCells, doubleFood);

    // Generate penalty food position
    const penaltyFood = getRandomCell(availableCells);
    [foodPenaltyX, foodPenaltyY] = penaltyFood;
    availableCells = updateAvailableCells(availableCells, penaltyFood);

    // Generate speed food only if snake is not at max speed
    if (Math.abs(velocityX) < 2 && Math.abs(velocityY) < 2) {
        const speedFood = getRandomCell(availableCells);
        [foodSpeedX, foodSpeedY] = speedFood;
        availableCells = updateAvailableCells(availableCells, speedFood);
    } else {
        // Place speed food far outside the grid when not needed
        foodSpeedX = foodSpeedY = -100;
    }

    // TODO: Futuri cibi
    // Priority 5: Slow food
    // Priority 6: Triple temporary food
};

const handleGameOver = () => {
    // Clear the interval and timeout IDs, reloading the page on game over
    clearInterval(setIntervalId);
    if (speedResetTimeoutId) {
        clearTimeout(speedResetTimeoutId);
    }
    
    // Check if game over was caused by filling the board
    const message = availableCells.length === 0 
        ? "Congratulations! You've filled the board! Press OK to play again..."
        : "Game Over! Press OK to play again...";
    
    alert(message);
    location.reload();
}

const changeDirection = e => {
    // Saving the current speed based on velocity values from the speed food
    const currentSpeed = Math.abs(velocityX) === 2 || Math.abs(velocityY) === 2 ? 2 : 1;
    
    // Changing velocity value based on key press and current speed direction
    if(e.key === "ArrowUp" && velocityY <= 0) {
        velocityX = 0;
        velocityY = -currentSpeed;
    } else if(e.key === "ArrowDown" && velocityY >= 0) {
        velocityX = 0;
        velocityY = currentSpeed;
    } else if(e.key === "ArrowLeft" && velocityX <= 0) {
        velocityX = -currentSpeed;
        velocityY = 0;
    } else if(e.key === "ArrowRight" && velocityX >= 0) {
        velocityX = currentSpeed;
        velocityY = 0;
    }
}

// Calling changeDirection on each key click and passing key dataset value as an object
controls.forEach(button => button.addEventListener("click", () => changeDirection({ key: button.dataset.key })));

// Function for score management
const updateScore = () => {
    highScore = score >= highScore ? score : highScore;
    localStorage.setItem("high-score", highScore);
    scoreElement.innerText = `Score: ${score}`;
    highScoreElement.innerText = `High Score: ${highScore}`;
}

// Function to reset snake speed to normal
const resetSpeed = () => {
    const wasMaxSpeed = Math.abs(velocityX) === 2 || Math.abs(velocityY) === 2;
    
    // Reset speed to normal
    velocityX = velocityX === 2 ? 1 : velocityX === -2 ? -1 : velocityX;
    velocityY = velocityY === 2 ? 1 : velocityY === -2 ? -1 : velocityY;
    
    // If we were at max speed and now we're not, update food positions
    if (wasMaxSpeed) {
        updateFoodPosition();
    }
};

// Function to check food collision
const checkFoodCollision = (x, y) => {

    // Function to clear and reset speed timer
    const resetSpeedTimer = () => {
        if (speedResetTimeoutId) {
            clearTimeout(speedResetTimeoutId);
        }
        speedResetTimeoutId = setTimeout(() => {
            velocityX = Math.sign(velocityX);
            velocityY = Math.sign(velocityY);
            speedResetTimeoutId = null;
        }, 15000); // 15 seconds
    };

    // Check collisions with all types of food for a specific position
    if(x === foodX && y === foodY) {
        updateFoodPosition();
        snakeBody.push([foodY, foodX]);
        score++;
        resetSpeed();
        updateScore();
        return true;
    } else if(x === foodDoubleX && y === foodDoubleY) {
        updateFoodPosition();
        snakeBody.push([foodDoubleY, foodDoubleX]);
        snakeBody.push([foodDoubleY, foodDoubleX]);
        score += 2;
        resetSpeed();
        updateScore();
        return true;
    } else if(x === foodPenaltyX && y === foodPenaltyY) {
        if (snakeBody.length === 1) {
            gameOver = true;
            return true;
        }
        updateFoodPosition();
        snakeBody.pop();
        if (score > 0) {
            score--;
            resetSpeed();
            updateScore();
        }
        return true;
    } else if(x === foodSpeedX && y === foodSpeedY) {
        updateFoodPosition();
        velocityX *= 2;
        velocityY *= 2;
        resetSpeedTimer(); // Start the timer when speed food is eaten
        return true;
    }
    return false;

    // TODO: Futuri cibi
    // Priority 5: Slow food collision
    // Priority 6: Triple temporary food collision

    // TODO: Sistemare input di movimento troppo rapidi (Ti uccidi da solo)
    // TODO: Legenda per i cibi (base, doppio, penalty, speed, slow, triple)
}

const initGame = () => {
    if(gameOver) return handleGameOver();

    let html = `
        <div class="food" style="grid-area: ${foodY} / ${foodX}"></div>
        <div class="food-double" style="grid-area: ${foodDoubleY} / ${foodDoubleX}"></div>
        <div class="food-penalty" style="grid-area: ${foodPenaltyY} / ${foodPenaltyX}"></div>
    `;

    // Add speed food only if snake is not at max speed
    if (Math.abs(velocityX) < 2 && Math.abs(velocityY) < 2 && foodSpeedX > 0) {
        html += `<div class="food-speed" style="grid-area: ${foodSpeedY} / ${foodSpeedX}"></div>`;
    }

   // Handle intermediate position check for high speed movement
   if (Math.abs(velocityX) === 2 || Math.abs(velocityY) === 2) {
    const intermediateX = snakeX + Math.sign(velocityX);
    const intermediateY = snakeY + Math.sign(velocityY);
    checkFoodCollision(intermediateX, intermediateY);
    }

    // Updating the snake's head position based on the current velocity
    snakeX += velocityX;
    snakeY += velocityY;

    // Check for food collisions at final position
    checkFoodCollision(snakeX, snakeY);

    // Checking if the snake's head is out of wall, if so setting gameOver to true
    if(snakeX <= 0 || snakeX > 30 || snakeY <= 0 || snakeY > 30) {
        return gameOver = true;
    }

    // Update snake body
    for (let i = snakeBody.length - 1; i > 0; i--) {
        snakeBody[i] = snakeBody[i - 1];
    }
    snakeBody[0] = [snakeX, snakeY];

    // Generate snake body HTML and check self-collision
    for (let i = 0; i < snakeBody.length; i++) {
        html += `<div class="head" style="grid-area: ${snakeBody[i][1]} / ${snakeBody[i][0]}"></div>`;
        
        // Check self-collision only with actual body segments, not intermediate ones
        if (i !== 0 && snakeBody[0][1] === snakeBody[i][1] && snakeBody[0][0] === snakeBody[i][0]) {
            gameOver = true;
        }
    }

    // If speed is 2, add visual intermediate segments (only for display)
    if (Math.abs(velocityX) === 2 || Math.abs(velocityY) === 2) {
        for (let i = 0; i < snakeBody.length - 1; i++) {
            const current = snakeBody[i];
            const next = snakeBody[i + 1];
            const intermediateX = current[0] + Math.sign(next[0] - current[0]);
            const intermediateY = current[1] + Math.sign(next[1] - current[1]);
            
            // Add intermediate segment only for visualization
            html += `<div class="head" style="grid-area: ${intermediateY} / ${intermediateX}"></div>`;
        }
    }

    playBoard.innerHTML = html;
}

updateFoodPosition();
setIntervalId = setInterval(initGame, 100);
document.addEventListener("keyup", changeDirection);