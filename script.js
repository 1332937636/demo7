// 游戏配置
const config = {
    gridSize: 20,
    initialSpeed: 200,
    speedIncrease: 0.9,
    scorePerFood: 10,
    levelUpScore: 50
};

// 游戏状态
let gameState = {
    score: 0,
    highScore: 0,
    level: 1,
    direction: 'right',
    nextDirection: 'right',
    snake: [
        { x: 5, y: 5 },
        { x: 4, y: 5 },
        { x: 3, y: 5 }
    ],
    food: { x: 10, y: 10 },
    isPlaying: false,
    isPaused: false,
    gameLoopId: null,
    speed: config.initialSpeed
};

// 获取DOM元素
const gameBoard = document.getElementById('game-board');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const levelElement = document.getElementById('level');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');

// 创建音效元素
const foodSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-arcade-game-jump-coin-216.mp3');
const gameOverSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-arcade-retro-game-over-213.mp3');
const moveSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-arcade-game-jump-223.mp3');

// 初始化游戏
function initGame() {
    // 设置事件监听器
    startBtn.addEventListener('click', startGame);
    pauseBtn.addEventListener('click', togglePause);
    resetBtn.addEventListener('click', resetGame);
    document.addEventListener('keydown', handleKeyPress);
    
    // 加载高分
    loadHighScore();
    
    // 渲染初始游戏状态
    renderGame();
}

// 开始游戏
function startGame() {
    if (!gameState.isPlaying) {
        gameState.isPlaying = true;
        gameState.isPaused = false;
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        resetBtn.disabled = false;
        
        // 开始游戏循环
        gameLoopId = setInterval(() => {
            if (!gameState.isPaused) {
                updateGame();
                renderGame();
            }
        }, gameState.speed);
    }
}

// 暂停/继续游戏
function togglePause() {
    if (gameState.isPlaying) {
        gameState.isPaused = !gameState.isPaused;
        pauseBtn.textContent = gameState.isPaused ? '继续' : '暂停';
    }
}

// 重置游戏
function resetGame() {
    clearInterval(gameLoopId);
    
    // 保存高分
    if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
        saveHighScore();
    }
    
    // 重置游戏状态
    gameState = {
        score: 0,
        highScore: gameState.highScore,
        level: 1,
        direction: 'right',
        nextDirection: 'right',
        snake: [
            { x: 5, y: 5 },
            { x: 4, y: 5 },
            { x: 3, y: 5 }
        ],
        food: generateFood(),
        isPlaying: false,
        isPaused: false,
        gameLoopId: null,
        speed: config.initialSpeed
    };
    
    // 更新UI
    updateScoreAndLevel();
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    pauseBtn.textContent = '暂停';
    
    // 清除游戏板并重新渲染
    renderGame();
}

// 处理键盘输入
function handleKeyPress(e) {
    if (!gameState.isPlaying || gameState.isPaused) return;
    
    // 阻止页面滚动
    if ([37, 38, 39, 40].includes(e.keyCode)) {
        e.preventDefault();
    }
    
    // 根据按键设置下一个方向
    switch (e.keyCode) {
        case 37: // 左
            if (gameState.direction !== 'right') {
                gameState.nextDirection = 'left';
            }
            break;
        case 38: // 上
            if (gameState.direction !== 'down') {
                gameState.nextDirection = 'up';
            }
            break;
        case 39: // 右
            if (gameState.direction !== 'left') {
                gameState.nextDirection = 'right';
            }
            break;
        case 40: // 下
            if (gameState.direction !== 'up') {
                gameState.nextDirection = 'down';
            }
            break;
    }
}

// 更新游戏状态
function updateGame() {
    // 更新方向
    gameState.direction = gameState.nextDirection;
    
    // 创建新的蛇头
    const head = {...gameState.snake[0]};
    
    // 根据方向移动蛇头
    switch (gameState.direction) {
        case 'left':
            head.x--;
            break;
        case 'up':
            head.y--;
            break;
        case 'right':
            head.x++;
            break;
        case 'down':
            head.y++;
            break;
    }
    
    // 检查碰撞
    if (checkCollision(head)) {
        gameOver();
        return;
    }
    
    // 检查是否吃到食物
    if (head.x === gameState.food.x && head.y === gameState.food.y) {
        // 播放食物音效
        foodSound.currentTime = 0;
        foodSound.play();
        
        // 增加分数
        gameState.score += config.scorePerFood;
        
        // 检查是否升级
        if (gameState.score % config.levelUpScore === 0) {
            gameState.level++;
            // 提高速度
            gameState.speed = Math.floor(gameState.speed * config.speedIncrease);
            // 更新游戏循环速度
            clearInterval(gameLoopId);
            gameLoopId = setInterval(() => {
                if (!gameState.isPaused) {
                    updateGame();
                    renderGame();
                }
            }, gameState.speed);
        }
        
        // 更新分数和等级显示
        updateScoreAndLevel();
        
        // 生成新的食物
        gameState.food = generateFood();
        
        // 蛇的长度增加（不删除尾巴）
    } else {
        // 播放移动音效
        moveSound.currentTime = 0;
        moveSound.play();
        
        // 蛇移动，删除尾巴
        gameState.snake.pop();
    }
    
    // 添加新的蛇头
    gameState.snake.unshift(head);
}

// 检查碰撞
function checkCollision(head) {
    // 检查墙碰撞
    if (head.x < 0 || head.x >= gameBoard.width / config.gridSize ||
        head.y < 0 || head.y >= gameBoard.height / config.gridSize) {
        return true;
    }
    
    // 检查自身碰撞
    for (let i = 1; i < gameState.snake.length; i++) {
        if (head.x === gameState.snake[i].x && head.y === gameState.snake[i].y) {
            return true;
        }
    }
    
    return false;
}

// 游戏结束
function gameOver() {
    // 播放游戏结束音效
    gameOverSound.currentTime = 0;
    gameOverSound.play();
    
    // 停止游戏循环
    clearInterval(gameLoopId);
    
    // 更新游戏状态
    gameState.isPlaying = false;
    
    // 保存高分
    if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
        saveHighScore();
    }
    
    // 更新UI
    updateScoreAndLevel();
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    
    // 显示游戏结束动画
    gameBoard.classList.add('game-over');
    setTimeout(() => {
        gameBoard.classList.remove('game-over');
    }, 500);
    
    alert('游戏结束！你的得分是：' + gameState.score);
}

// 生成随机食物位置
function generateFood() {
    let food;
    
    // 确保食物不在蛇身上
    do {
        food = {
            x: Math.floor(Math.random() * (gameBoard.width / config.gridSize)),
            y: Math.floor(Math.random() * (gameBoard.height / config.gridSize))
        };
    } while (isOnSnake(food));
    
    return food;
}

// 检查位置是否在蛇身上
function isOnSnake(position) {
    return gameState.snake.some(segment => segment.x === position.x && segment.y === position.y);
}

// 更新分数和等级显示
function updateScoreAndLevel() {
    scoreElement.textContent = gameState.score;
    highScoreElement.textContent = gameState.highScore;
    levelElement.textContent = gameState.level;
}

// 保存高分到localStorage
function saveHighScore() {
    localStorage.setItem('snakeHighScore', gameState.highScore);
}

// 从localStorage加载高分
function loadHighScore() {
    const savedScore = localStorage.getItem('snakeHighScore');
    if (savedScore) {
        gameState.highScore = parseInt(savedScore);
        highScoreElement.textContent = gameState.highScore;
    }
}

// 渲染游戏
function renderGame() {
    // 清空游戏板
    gameBoard.innerHTML = '';
    
    // 渲染蛇
    gameState.snake.forEach((segment, index) => {
        const snakeSegment = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        snakeSegment.setAttribute('x', segment.x * config.gridSize);
        snakeSegment.setAttribute('y', segment.y * config.gridSize);
        snakeSegment.setAttribute('width', config.gridSize - 1);
        snakeSegment.setAttribute('height', config.gridSize - 1);
        
        if (index === 0) {
            // 蛇头
            snakeSegment.setAttribute('fill', '#4ecdc4');
            snakeSegment.classList.add('snake-head');
            
            // 为蛇头添加眼睛
            const eye1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            const eye2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            
            // 根据方向设置眼睛位置
            let eyeOffsetX = 0;
            let eyeOffsetY = 0;
            
            switch (gameState.direction) {
                case 'left':
                    eyeOffsetX = -2;
                    eyeOffsetY = -2;
                    break;
                case 'up':
                    eyeOffsetX = -2;
                    eyeOffsetY = -2;
                    break;
                case 'right':
                    eyeOffsetX = 2;
                    eyeOffsetY = -2;
                    break;
                case 'down':
                    eyeOffsetX = -2;
                    eyeOffsetY = 2;
                    break;
            }
            
            eye1.setAttribute('cx', (segment.x + 0.3) * config.gridSize + eyeOffsetX);
            eye1.setAttribute('cy', (segment.y + 0.3) * config.gridSize + eyeOffsetY);
            eye1.setAttribute('r', 2);
            eye1.setAttribute('fill', 'white');
            
            eye2.setAttribute('cx', (segment.x + 0.7) * config.gridSize + eyeOffsetX);
            eye2.setAttribute('cy', (segment.y + 0.3) * config.gridSize + eyeOffsetY);
            eye2.setAttribute('r', 2);
            eye2.setAttribute('fill', 'white');
            
            // 添加黑色瞳孔
            const pupil1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            const pupil2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            
            pupil1.setAttribute('cx', (segment.x + 0.3) * config.gridSize + eyeOffsetX);
            pupil1.setAttribute('cy', (segment.y + 0.3) * config.gridSize + eyeOffsetY);
            pupil1.setAttribute('r', 1);
            pupil1.setAttribute('fill', 'black');
            
            pupil2.setAttribute('cx', (segment.x + 0.7) * config.gridSize + eyeOffsetX);
            pupil2.setAttribute('cy', (segment.y + 0.3) * config.gridSize + eyeOffsetY);
            pupil2.setAttribute('r', 1);
            pupil2.setAttribute('fill', 'black');
            
            gameBoard.appendChild(eye1);
            gameBoard.appendChild(eye2);
            gameBoard.appendChild(pupil1);
            gameBoard.appendChild(pupil2);
        } else {
            // 蛇身
            const colorIndex = index % 5;
            const colors = ['#264653', '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51'];
            snakeSegment.setAttribute('fill', colors[colorIndex]);
        }
        
        gameBoard.appendChild(snakeSegment);
    });
    
    // 渲染食物
    const food = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    food.setAttribute('cx', (gameState.food.x + 0.5) * config.gridSize);
    food.setAttribute('cy', (gameState.food.y + 0.5) * config.gridSize);
    food.setAttribute('r', config.gridSize / 2 - 1);
    food.setAttribute('fill', '#ff6b6b');
    food.classList.add('food');
    gameBoard.appendChild(food);
}

// 启动游戏
initGame();