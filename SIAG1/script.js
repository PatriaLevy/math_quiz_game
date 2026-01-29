/* ========================================== */
/* GLOBAL VARIABLES */
/* ========================================== */
let currentUser = '';
let difficulty = null;
let selectedColor = null;
let isRolling = false;
let currentQuestion = null;
let questionStartTime = null;

let score = 0;
let correctCount = 0;
let wrongCount = 0;
let totalQuestions = 0;
let timeLeft = 60;
let timerInterval = null;

let highScores = {
    easy: 0,
    medium: 0,
    hard: 0
};


/* ========================================== */
/* CONFIGURATION */
/* ========================================== */
const difficulties = {
    easy: {
        time: 60,
        maxTime: 60,
        name: 'Easy',
        bonuses: [15, 10, 5, 2],
        thresholds: [4, 8, 12],
        multiplier: 1
    },
    medium: {
        time: 45,
        maxTime: 45,
        name: 'Medium',
        bonuses: [12, 8, 4, 1],
        thresholds: [3, 6, 9],
        multiplier: 1.5
    },
    hard: {
        time: 30,
        maxTime: 30,
        name: 'Hard',
        bonuses: [10, 6, 3, 1],
        thresholds: [2, 4, 6],
        multiplier: 2
    }
};

const colors = [
    { name: 'Addition', color: 'red', operation: '+', label: '+' },
    { name: 'Subtraction', color: 'blue', operation: '-', label: '−' },
    { name: 'Multiplication', color: 'green', operation: '*', label: '×' },
    { name: 'Division', color: 'yellow', operation: '/', label: '÷' }
];


/* ========================================== */
/* INITIALIZATION */
/* ========================================== */
document.addEventListener('DOMContentLoaded', function() {
    loadHighScores();
    setupEventListeners();
});

function setupEventListeners() {
    // Enter key for username input
    document.getElementById('usernameInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            login();
        }
    });
    
    // Enter key for answer input
    document.getElementById('answerInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            submitAnswer();
        }
    });
}


/* ========================================== */
/* SCREEN MANAGEMENT */
/* ========================================== */
function showScreen(screenId) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

function showGameState(stateId) {
    const states = document.querySelectorAll('.game-state');
    states.forEach(state => {
        state.classList.remove('active');
    });
    document.getElementById(stateId).classList.add('active');
}


/* ========================================== */
/* LOGIN FUNCTIONS */
/* ========================================== */
function login() {
    const username = document.getElementById('usernameInput').value.trim();
    
    if (!username) {
        return;
    }
    
    currentUser = username;
    document.getElementById('welcomeText').textContent = `Welcome, ${currentUser}!`;
    
    loadHighScores();
    showScreen('difficultyScreen');
}


/* ========================================== */
/* HIGH SCORE MANAGEMENT */
/* ========================================== */
function loadHighScores() {
    const apiUrl = `api.php?action=getHighScores&username=${encodeURIComponent(currentUser)}`;
    
    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                highScores = data.scores;
                updateHighScoreDisplay();
            }
        })
        .catch(error => {
            console.error('Error loading high scores:', error);
            loadHighScoresFromLocalStorage();
        });
}

function loadHighScoresFromLocalStorage() {
    const storageKey = `mathQuizHighScores_${currentUser}`;
    const saved = localStorage.getItem(storageKey);
    
    if (saved) {
        highScores = JSON.parse(saved);
        updateHighScoreDisplay();
    }
}

function saveHighScore() {
    if (score <= highScores[difficulty]) {
        return false;
    }
    
    highScores[difficulty] = score;
    
    // Save to database via API
    fetch('api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'saveHighScore',
            username: currentUser,
            difficulty: difficulty,
            score: score
        })
    })
    .then(response => response.json())
    .catch(error => {
        console.error('Error saving high score:', error);
        saveHighScoreToLocalStorage();
    });
    
    return true;
}

function saveHighScoreToLocalStorage() {
    const storageKey = `mathQuizHighScores_${currentUser}`;
    localStorage.setItem(storageKey, JSON.stringify(highScores));
}

function updateHighScoreDisplay() {
    document.getElementById('easyHighScore').textContent = `🎯 Highest: ${highScores.easy}`;
    document.getElementById('mediumHighScore').textContent = `🎯 Highest: ${highScores.medium}`;
    document.getElementById('hardHighScore').textContent = `🎯 Highest: ${highScores.hard}`;
}


/* ========================================== */
/* GAME START */
/* ========================================== */
function startGame(selectedDifficulty) {
    difficulty = selectedDifficulty;
    
    // Reset game variables
    score = 0;
    correctCount = 0;
    wrongCount = 0;
    totalQuestions = 0;
    timeLeft = difficulties[difficulty].time;
    
    updateGameHeader();
    showScreen('gameScreen');
    showGameState('dashboardState');
    startTimer();
}

function updateGameHeader() {
    document.getElementById('currentUsername').textContent = currentUser;
    document.getElementById('currentDifficulty').textContent = difficulties[difficulty].name;
    document.getElementById('currentScore').textContent = score;
    document.getElementById('timeDisplay').textContent = timeLeft;
    document.getElementById('correctDisplay').textContent = correctCount;
    document.getElementById('wrongDisplay').textContent = wrongCount;
    document.getElementById('accuracyDisplay').textContent = calculateAccuracy();
    
    updateDifficultyBadgeColor();
}

function updateDifficultyBadgeColor() {
    const badge = document.querySelector('.difficulty-badge');
    badge.className = 'stat-badge difficulty-badge';
    
    if (difficulty === 'easy') {
        badge.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
    } else if (difficulty === 'medium') {
        badge.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
    } else if (difficulty === 'hard') {
        badge.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
    }
}


/* ========================================== */
/* TIMER MANAGEMENT */
/* ========================================== */
function startTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    
    timerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById('timeDisplay').textContent = timeLeft;
        
        updateTimerWarning();
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            endGame();
        }
    }, 1000);
}

function updateTimerWarning() {
    const timerBadge = document.getElementById('timerBadge');
    
    if (timeLeft <= 10) {
        timerBadge.classList.add('warning');
    } else {
        timerBadge.classList.remove('warning');
    }
}


/* ========================================== */
/* DICE ROLLING */
/* ========================================== */
function rollDice() {
    if (isRolling) {
        return;
    }
    
    console.log('🎲 Rolling dice...');
    isRolling = true;
    const dice = document.getElementById('dice');
    const diceContent = document.getElementById('diceContent');
    
    dice.classList.add('rolling');
    
    let rollCount = 0;
    const rollInterval = setInterval(() => {
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        selectedColor = randomColor;
        
        dice.className = `dice rolling ${randomColor.color}`;
        diceContent.textContent = randomColor.label;
        
        rollCount++;
        
        if (rollCount >= 20) {
            clearInterval(rollInterval);
            dice.classList.remove('rolling');
            isRolling = false;
            console.log('✅ Rolled:', selectedColor.name);
            startFlipCountdown();
        }
    }, 100);
}

function startFlipCountdown() {
    console.log('⏱️ Starting countdown...');
    showGameState('flipCountdownState');
    
    const flipDice = document.getElementById('flipCountdownDice');
    flipDice.className = `flip-dice ${selectedColor.color}`;
    
    let count = 3;
    document.getElementById('flipCountdownNumber').textContent = count;
    
    const countInterval = setInterval(() => {
        count--;
        console.log('Countdown:', count);
        
        if (count > 0) {
            document.getElementById('flipCountdownNumber').textContent = count;
        } else {
            clearInterval(countInterval);
            console.log('📝 Starting question...');
            startQuestion();
        }
    }, 1000);
}


/* ========================================== */
/* QUESTION GENERATION */
/* ========================================== */
function generateQuestion() {
    const operation = selectedColor.operation;
    const multiplier = difficulties[difficulty].multiplier;
    let num1, num2, answer;
    
    switch(operation) {
        case '+':
            num1 = Math.floor(Math.random() * (50 * multiplier)) + 1;
            num2 = Math.floor(Math.random() * (50 * multiplier)) + 1;
            answer = num1 + num2;
            break;
            
        case '-':
            num1 = Math.floor(Math.random() * (50 * multiplier)) + 20;
            num2 = Math.floor(Math.random() * num1);
            answer = num1 - num2;
            break;
            
        case '*':
            num1 = Math.floor(Math.random() * (12 * multiplier)) + 1;
            num2 = Math.floor(Math.random() * (12 * multiplier)) + 1;
            answer = num1 * num2;
            break;
            
        case '/':
            num2 = Math.floor(Math.random() * (10 * multiplier)) + 2;
            answer = Math.floor(Math.random() * (12 * multiplier)) + 1;
            num1 = num2 * answer;
            break;
    }
    
    return { num1, num2, answer, operation };
}

function startQuestion() {
    console.log('🎯 Generating question for:', selectedColor.name);
    currentQuestion = generateQuestion();
    questionStartTime = Date.now();
    totalQuestions++;
    
    console.log('Question:', currentQuestion);
    
    updateQuestionDisplay();
    resetAnswerInput();
    showGameState('playingState');
    
    setTimeout(() => {
        document.getElementById('answerInput').focus();
    }, 100);
}

function updateQuestionDisplay() {
    const questionNum = document.getElementById('questionNumber');
    const questionText = document.getElementById('questionText');
    const questionOp = document.getElementById('questionOperation');
    const questionCard = document.getElementById('questionCard');
    
    // Update content
    questionNum.textContent = totalQuestions;
    questionText.textContent = `${currentQuestion.num1} ${selectedColor.label} ${currentQuestion.num2} = ?`;
    questionOp.textContent = selectedColor.name;
    
    // Apply color class
    questionCard.className = `question-card ${selectedColor.color}`;
    
    console.log('✅ Question displayed:', questionText.textContent);
    console.log('Card color:', selectedColor.color);
}

function resetAnswerInput() {
    document.getElementById('answerInput').value = '';
    document.getElementById('feedbackBox').classList.remove('show');
}


/* ========================================== */
/* ANSWER CHECKING */
/* ========================================== */
function calculateTimeBonus(responseTime) {
    const diffSettings = difficulties[difficulty];
    const thresholds = diffSettings.thresholds;
    const bonuses = diffSettings.bonuses;
    
    if (responseTime <= thresholds[0]) {
        return bonuses[0];
    } else if (responseTime <= thresholds[1]) {
        return bonuses[1];
    } else if (responseTime <= thresholds[2]) {
        return bonuses[2];
    } else {
        return bonuses[3];
    }
}

function submitAnswer() {
    const userAnswer = document.getElementById('answerInput').value.trim();
    
    if (!userAnswer) {
        return;
    }
    
    const responseTime = Math.floor((Date.now() - questionStartTime) / 1000);
    const timeBonus = calculateTimeBonus(responseTime);
    const isCorrect = parseInt(userAnswer) === currentQuestion.answer;
    
    if (isCorrect) {
        handleCorrectAnswer(responseTime, timeBonus);
    } else {
        handleWrongAnswer(timeBonus);
    }
    
    updateGameHeader();
    hideAnswerSectionTemporarily();
}

function handleCorrectAnswer(responseTime, timeBonus) {
    const points = 100 + (timeBonus * 10);
    score += points;
    correctCount++;
    
    const oldTime = timeLeft;
    timeLeft = Math.min(timeLeft + timeBonus, difficulties[difficulty].maxTime);
    const actualBonus = timeLeft - oldTime;
    
    showFeedback('correct', points, responseTime, actualBonus, timeBonus);
}

function handleWrongAnswer(timeBonus) {
    wrongCount++;
    timeLeft = Math.max(timeLeft - timeBonus, 0);
    
    showFeedback('wrong', 0, 0, 0, timeBonus);
}

function showFeedback(type, points, responseTime, actualBonus, timeBonus) {
    const feedbackBox = document.getElementById('feedbackBox');
    feedbackBox.className = `feedback-box ${type} show`;
    
    if (type === 'correct') {
        feedbackBox.innerHTML = `
            <div class="feedback-message">+${points} points!</div>
            <div class="feedback-details">
                Answered in ${responseTime}s | Time Added: +${actualBonus}s
                ${actualBonus < timeBonus ? `(capped at ${difficulties[difficulty].maxTime}s)` : ''}
            </div>
        `;
    } else {
        feedbackBox.innerHTML = `
            <div class="feedback-message">Wrong! Answer: ${currentQuestion.answer}</div>
            <div class="feedback-details">Time Penalty: -${timeBonus}s</div>
        `;
    }
}

function hideAnswerSectionTemporarily() {
    const answerSection = document.getElementById('answerSection');
    answerSection.style.display = 'none';
    
    setTimeout(() => {
        answerSection.style.display = 'flex';
        resetForNextQuestion();
    }, 2000);
}

function calculateAccuracy() {
    if (totalQuestions === 0) {
        return 0;
    }
    return Math.round((correctCount / totalQuestions) * 100);
}


/* ========================================== */
/* GAME FLOW */
/* ========================================== */
function resetForNextQuestion() {
    selectedColor = null;
    currentQuestion = null;
    showGameState('dashboardState');
    resetDice();
}

function resetDice() {
    const dice = document.getElementById('dice');
    const diceContent = document.getElementById('diceContent');
    
    dice.className = 'dice';
    dice.style.background = 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)';
    diceContent.textContent = '🎲';
}

function endGame() {
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    
    const isNewHighScore = saveHighScore();
    updateGameOverScreen(isNewHighScore);
    showScreen('gameOverScreen');
}

function updateGameOverScreen(isNewHighScore) {
    // Update title
    document.getElementById('gameOverTitle').textContent = 
        isNewHighScore ? 'New High Score!' : 'Game Over!';
    document.getElementById('gameOverSubtext').textContent = `Great job, ${currentUser}!`;
    document.getElementById('gameOverDifficulty').textContent = difficulties[difficulty].name;
    
    // Update statistics
    document.getElementById('finalScore').textContent = score;
    document.getElementById('finalHighScore').textContent = highScores[difficulty];
    document.getElementById('finalAccuracy').textContent = `${calculateAccuracy()}%`;
    document.getElementById('finalQuestions').textContent = totalQuestions;
    document.getElementById('finalCorrect').textContent = correctCount;
    document.getElementById('finalWrong').textContent = wrongCount;
    
    // Show/hide new high score badge
    const newHighScoreBadge = document.getElementById('newHighScoreBadge');
    if (isNewHighScore) {
        newHighScoreBadge.classList.add('show');
    } else {
        newHighScoreBadge.classList.remove('show');
    }
    
    updateGameOverColors();
}

function updateGameOverColors() {
    const diffBadge = document.getElementById('gameOverDifficultyBadge');
    const playAgainBtn = document.getElementById('playAgainBtn');
    
    let gradientColor = '';
    
    if (difficulty === 'easy') {
        gradientColor = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
    } else if (difficulty === 'medium') {
        gradientColor = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
    } else if (difficulty === 'hard') {
        gradientColor = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
    }
    
    diffBadge.style.background = gradientColor;
    playAgainBtn.style.background = gradientColor;
}

function playAgain() {
    startGame(difficulty);
}

function changeDifficulty() {
    showScreen('difficultyScreen');
    updateHighScoreDisplay();
}