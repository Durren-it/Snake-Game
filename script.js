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
    
    // Update available cells removing used position
    availableCells = availableCells.filter(
        ([x, y]) => x !== foodX || y !== foodY
    );

    // Generate double food position
    const doubleFood = getRandomCell(availableCells);
    [foodDoubleX, foodDoubleY] = doubleFood;
    
    // Update available cells for future food types
    availableCells = availableCells.filter(
        ([x, y]) => x !== foodDoubleX || y !== foodDoubleY
    );

    // TODO: Futuri cibi
    // Priority 3: Penalty food
    // Priority 4: Speed food
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
    // Changing velocity value based on key press
    if(e.key === "ArrowUp" && velocityY != 1) {
        velocityX = 0;
        velocityY = -1;
    } else if(e.key === "ArrowDown" && velocityY != -1) {
        velocityX = 0;
        velocityY = 1;
    } else if(e.key === "ArrowLeft" && velocityX != 1) {
        velocityX = -1;
        velocityY = 0;
    } else if(e.key === "ArrowRight" && velocityX != -1) {
        velocityX = 1;
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

const initGame = () => {
    if(gameOver) return handleGameOver();
    let html = `
        <div class="food" style="grid-area: ${foodY} / ${foodX}"></div>
        <div class="food-double" style="grid-area: ${foodDoubleY} / ${foodDoubleX}"></div>
    `;

    // Checking if the snake hit the base food
    if(snakeX === foodX && snakeY === foodY) {
        updateFoodPosition();
        snakeBody.push([foodY, foodX]); // Pushing food position to snake body array
        score++; // increment score by 1
        updateScore();
    } else if(snakeX === foodDoubleX && snakeY === foodDoubleY) {
        updateFoodPosition();
        // Pushing food position to snake body array twice
        snakeBody.push([foodDoubleY, foodDoubleX]);
        snakeBody.push([foodDoubleY, foodDoubleX]);
        score += 2; // increment score by 2
        updateScore();
    }

    // TODO: Futuri cibi
    // Priority 3: Penalty food collision
    // Priority 4: Speed food collision
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