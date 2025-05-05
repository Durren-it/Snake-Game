const playBoard = document.querySelector(".play-board");
const scoreElement = document.querySelector(".score");
const highScoreElement = document.querySelector(".high-score");
const controls = document.querySelectorAll(".controls b");

// Game state variables
let moveCounter = 0;
let moveDelay = 1; // 1 = normal movement, 2 = half movement
let speedResetTimeoutId;
let tripleFoodTimeoutId;
let gameOver = false;
let canChangeDirection = true;

// Food positions
let foodX, foodY;
let foodDoubleX, foodDoubleY;
let foodPenaltyX, foodPenaltyY;
let foodSpeedX, foodSpeedY;
let foodSlowX, foodSlowY;
let foodTripleX, foodTripleY;

// Snake properties
let snakeX = 5, snakeY = 5;
let velocityX = 0, velocityY = 0;
let snakeBody = [];
let availableCells = [];

// Game control variables
let setIntervalId;
let score = 0;
let inputQueue = [];
const INPUT_DELAY = 50;
let lastMoveTimestamp = Date.now();

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

    // Generate slow food only if snake is not at minimum speed
    if (moveDelay !== 2) {
        const slowFood = getRandomCell(availableCells);
        [foodSlowX, foodSlowY] = slowFood;
        availableCells = updateAvailableCells(availableCells, slowFood);
    } else {
        foodSlowX = foodSlowY = -100;
    }
    
    const tripleFood = getRandomCell(availableCells);
    [foodTripleX, foodTripleY] = tripleFood;
    
    // Set timeout to remove triple food after 5 seconds
    clearTimeout(tripleFoodTimeoutId)
    tripleFoodTimeoutId = setTimeout(() => {
        foodTripleX = foodTripleY = -100;
        tripleFoodTimeoutId = null;
    }, 5000);
};

const handleGameOver = () => {
    // Clear the interval and timeout IDs, reloading the page on game over
    clearInterval(setIntervalId);
    if (speedResetTimeoutId) {
        clearTimeout(speedResetTimeoutId);
    }
    if (tripleFoodTimeoutId) {
        clearTimeout(tripleFoodTimeoutId);
    }
    
    // Check if game over was caused by filling the board
    const message = availableCells.length === 0 
        ? "Congratulations! You've filled the board! Press OK to play again..."
        : "Game Over! Press OK to play again...";
    
    alert(message);
    location.reload();
}

const changeDirection = e => {
    // Create a timestamp to manage input delay
    const currentTime = Date.now();

    // Allow first move regardless of direction
    if (velocityX === 0 && velocityY === 0) {
        switch(e.key) {
            case "ArrowUp":
                velocityY = -1;
                break;
            case "ArrowDown":
                velocityY = 1;
                break;
            case "ArrowLeft":
                velocityX = -1;
                break;
            case "ArrowRight":
                velocityX = 1;
                break;
            default:
                return;
        }
        canChangeDirection = false;
        lastMoveTimestamp = currentTime;
        return;
    }
    
    if (!canChangeDirection) {
        // Queue only valid directional changes based on current movement axis
        if ((velocityX !== 0 && (e.key === "ArrowUp" || e.key === "ArrowDown")) ||
            (velocityY !== 0 && (e.key === "ArrowLeft" || e.key === "ArrowRight"))) {
            inputQueue = [e.key];
        }
        return;
    }

    // Saving the current speed based on velocity values from the speed food
    const currentSpeed = Math.abs(velocityX) === 2 || Math.abs(velocityY) === 2 ? 2 : 1;

    // Get current moving axis (x or y) and prevent opposite direction on same axis
    const isMovingVertically = velocityY !== 0;
    const isMovingHorizontally = velocityX !== 0;
    
    // Check if the requested direction is valid
    let isValidDirection = false;
    if (isMovingHorizontally) {
        isValidDirection = (e.key === "ArrowUp" || e.key === "ArrowDown");
    } else if (isMovingVertically) {
        isValidDirection = (e.key === "ArrowLeft" || e.key === "ArrowRight");
    }

    // If direction is not valid or can't change direction, queue only valid moves
    if (!canChangeDirection || !isValidDirection) {
        if (isValidDirection) {
            inputQueue = [e.key];
        }
        return;
    }

    // Apply the new direction
    switch(e.key) {
        case "ArrowUp":
            velocityX = 0;
            velocityY = -currentSpeed;
            break;
        case "ArrowDown":
            velocityX = 0;
            velocityY = currentSpeed;
            break;
        case "ArrowLeft":
            velocityX = -currentSpeed;
            velocityY = 0;
            break;
        case "ArrowRight":
            velocityX = currentSpeed;
            velocityY = 0;
            break;
        default:
            return;
    }

    canChangeDirection = false;
    lastMoveTimestamp = currentTime;
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
    const wasSlowSpeed = moveDelay === 2;
    
    // Reset speed to normal
    velocityX = velocityX === 2 ? 1 : velocityX === -2 ? -1 : velocityX;
    velocityY = velocityY === 2 ? 1 : velocityY === -2 ? -1 : velocityY;
    moveDelay = 1;
    
    // If we were at max speed and now we're not, update food positions
    if (wasMaxSpeed || wasSlowSpeed) {
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
        if (moveDelay === 2) {
            // If we are at half tick rate, reset to normal rate
            moveDelay = 1;
            updateFoodPosition();
        } else {
            // Otherwise, double the speed
            velocityX *= 2;
            velocityY *= 2;
            updateFoodPosition();
        }
        resetSpeedTimer();
        return true;
    } else if(x === foodSlowX && y === foodSlowY) {
        if (Math.abs(velocityX) === 2 || Math.abs(velocityY) === 2) {
            // If we are at double speed, reset to normal speed
            velocityX /= 2;
            velocityY /= 2;
            updateFoodPosition();
        } else {
            // Otherwise, set the half tick rate
            moveDelay = 2;
            updateFoodPosition();
        }
        return true;
    } else if(x === foodTripleX && y === foodTripleY) {
        // Add three segments to snake body at the end
        const lastSegment = snakeBody[snakeBody.length - 1] || [foodTripleY, foodTripleX];
        
        // Add the three segments at the last position
        snakeBody.push([...lastSegment]);
        snakeBody.push([...lastSegment]);
        snakeBody.push([...lastSegment]);
        score += 3;
        resetSpeed();
        updateScore();
        
        // Clear the timeout since we ate the food
        if (tripleFoodTimeoutId) {
            clearTimeout(tripleFoodTimeoutId);
            tripleFoodTimeoutId = null;
        }
        
        // Update all food positions after eating triple food
        updateFoodPosition();
        return true;
    }

    return false;
}

const initGame = () => {
    if(gameOver) return handleGameOver();

    // Process queued input only when snake actually moves
    if (inputQueue.length > 0 && moveCounter >= moveDelay) {
        const currentTime = Date.now();
        if (currentTime - lastMoveTimestamp >= INPUT_DELAY) {
            changeDirection({ key: inputQueue.shift() });
        }
    }

    // Increment of moveCounter to manage speed
    moveCounter++;

    // Update position of snake only if moveCounter reach moveDelay
    let shouldMove = moveCounter >= moveDelay;

    // Generate base HTML for foods
    let html = `
        <div class="food" style="grid-area: ${foodY} / ${foodX}"></div>
        <div class="food-double" style="grid-area: ${foodDoubleY} / ${foodDoubleX}"></div>
        <div class="food-penalty" style="grid-area: ${foodPenaltyY} / ${foodPenaltyX}"></div>
    `;

    // Add speed food only if snake is not at max speed
    if (Math.abs(velocityX) < 2 && Math.abs(velocityY) < 2 && foodSpeedX > 0) {
        html += `<div class="food-speed" style="grid-area: ${foodSpeedY} / ${foodSpeedX}"></div>`;
    }

    // Add slow food only if snake is not at min speed
    if (moveDelay !== 2 && foodSlowX > 0) {
        html += `<div class="food-slow" style="grid-area: ${foodSlowY} / ${foodSlowX}"></div>`;
    }

    // Add triple food if it exists
    if (foodTripleX > 0 && foodTripleY > 0) {
        html += `<div class="food-triple-temp" style="grid-area: ${foodTripleY} / ${foodTripleX}"></div>`;
    }

    // Handle intermediate position check for high speed movement
    if (shouldMove && (Math.abs(velocityX) === 2 || Math.abs(velocityY) === 2)) {
        const intermediateX = snakeX + Math.sign(velocityX);
        const intermediateY = snakeY + Math.sign(velocityY);
        checkFoodCollision(intermediateX, intermediateY);
    }

    // Update position only when shouldMove is true
    if (shouldMove) {
        canChangeDirection = true;  // Allow new direction changes after movement
        snakeX += velocityX;
        snakeY += velocityY;
        moveCounter = 0; // Reset counter after moving

        // Check for food collisions at final position
        checkFoodCollision(snakeX, snakeY);

        // Update snake body
        for (let i = snakeBody.length - 1; i > 0; i--) {
            snakeBody[i] = snakeBody[i - 1];
        }
        snakeBody[0] = [snakeX, snakeY];
    }

    // Checking if the snake's head is out of wall, if so setting gameOver to true
    if(snakeX <= 0 || snakeX > 30 || snakeY <= 0 || snakeY > 30) {
        return gameOver = true;
    }

    // Generate snake body HTML and check self-collision
    for (let i = 0; i < snakeBody.length; i++) {
        html += `<div class="head" style="grid-area: ${snakeBody[i][1]} / ${snakeBody[i][0]}"></div>`;
        
        // Check self-collision only with actual body segments
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
            
            html += `<div class="head" style="grid-area: ${intermediateY} / ${intermediateX}"></div>`;
        }
    }

    playBoard.innerHTML = html;
}

updateFoodPosition();
setIntervalId = setInterval(initGame, 100);
document.addEventListener("keydown", changeDirection);