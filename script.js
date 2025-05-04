const playBoard = document.querySelector(".play-board");
const scoreElement = document.querySelector(".score");
const highScoreElement = document.querySelector(".high-score");
const controls = document.querySelectorAll(".controls i");

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

    // Generate speed food position
    const speedFood = getRandomCell(availableCells);
    [foodSpeedX, foodSpeedY] = speedFood;
    availableCells = updateAvailableCells(availableCells, speedFood);

    // TODO: Futuri cibi
    // Priority 5: Slow food
    // Priority 6: Triple temporary food
};

const handleGameOver = () => {
    // Clear the interval and reloading the page on game over
    clearInterval(setIntervalId);
    
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
    velocityX = velocityX === 2 ? 1 : velocityX === -2 ? -1 : velocityX;
    velocityY = velocityY === 2 ? 1 : velocityY === -2 ? -1 : velocityY;
};

const initGame = () => {
    if(gameOver) return handleGameOver();
    let html = `
        <div class="food" style="grid-area: ${foodY} / ${foodX}"></div>
        <div class="food-double" style="grid-area: ${foodDoubleY} / ${foodDoubleX}"></div>
        <div class="food-penalty" style="grid-area: ${foodPenaltyY} / ${foodPenaltyX}"></div>
        <div class="food-speed" style="grid-area: ${foodSpeedY} / ${foodSpeedX}"></div>
    `;

    // Checking if the snake hit the base food
    if(snakeX === foodX && snakeY === foodY) {
        updateFoodPosition();
        snakeBody.push([foodY, foodX]); // Pushing food position to snake body array
        score++; // increment score by 1
        resetSpeed(); // Reset speed to normal
        updateScore();
    } else if(snakeX === foodDoubleX && snakeY === foodDoubleY) {
        updateFoodPosition();
        // Pushing food position to snake body array twice
        snakeBody.push([foodDoubleY, foodDoubleX]);
        snakeBody.push([foodDoubleY, foodDoubleX]);
        score += 2; // increment score by 2
        resetSpeed();
        updateScore();
    } else if(snakeX === foodPenaltyX && snakeY === foodPenaltyY) {
        // Check if removing a segment would result in snake length 0
        if (snakeBody.length === 1) {
            gameOver = true;
            return;
        }
        updateFoodPosition();
        // Remove last segment of snake
        snakeBody.pop();
        // Decrease score if greater than 0
        if (score > 0) {
            score--;
            resetSpeed();
            updateScore();
        }
    } else if(snakeX === foodSpeedX && snakeY === foodSpeedY) {
        updateFoodPosition();
        // Double current velocity
        velocityX *= 2;
        velocityY *= 2;
    }

    // TODO: Futuri cibi
    // Priority 5: Slow food collision
    // Priority 6: Triple temporary food collision

    // TODO: Sistemare input di movimento troppo rapidi (Ti uccidi da solo)
    // TODO: Legenda per i cibi (base, doppio, penalty, speed, slow, triple)

    // Updating the snake's head position based on the current velocity
    snakeX += velocityX;
    snakeY += velocityY;
    
    // Shifting forward the values of the elements in the snake body by one
    for (let i = snakeBody.length - 1; i > 0; i--) {
        snakeBody[i] = snakeBody[i - 1];
    }
    snakeBody[0] = [snakeX, snakeY]; // Setting first element of snake body to current snake position

    // Checking if the snake's head is out of wall, if so setting gameOver to true
    if(snakeX <= 0 || snakeX > 30 || snakeY <= 0 || snakeY > 30) {
        return gameOver = true;
    }

    for (let i = 0; i < snakeBody.length; i++) {
        // Adding a div for each part of the snake's body
        html += `<div class="head" style="grid-area: ${snakeBody[i][1]} / ${snakeBody[i][0]}"></div>`;
        // Checking if the snake head hit the body, if so set gameOver to true
        if (i !== 0 && snakeBody[0][1] === snakeBody[i][1] && snakeBody[0][0] === snakeBody[i][0]) {
            gameOver = true;
        }
    }
    playBoard.innerHTML = html;
}

updateFoodPosition();
setIntervalId = setInterval(initGame, 100);
document.addEventListener("keyup", changeDirection);