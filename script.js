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

let highScores = { easy: 0, medium: 0, hard: 0 };

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
    checkSession();
    setupEventListeners();
});

function setupEventListeners() {
    // Enter key for login
    document.getElementById('loginUsername')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') document.getElementById('loginPassword').focus();
    });
    document.getElementById('loginPassword')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') login();
    });
    
    // Enter key for register
    document.getElementById('registerPassword')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') document.getElementById('registerConfirm').focus();
    });
    document.getElementById('registerConfirm')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') register();
    });
    
    // Enter key for answer
    document.getElementById('answerInput')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') submitAnswer();
    });
    
    // Close profile dropdown when clicking outside
    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('profileDropdown');
        const profileBtn = document.querySelector('.profile-btn');
        if (dropdown && !dropdown.contains(e.target) && !profileBtn.contains(e.target)) {
            dropdown.classList.remove('active');
        }
    });
}

/* ========================================== */
/* PASSWORD TOGGLE */
/* ========================================== */
function togglePassword(inputId, button) {
    const input = document.getElementById(inputId);
    const eyeIcon = button.querySelector('.eye-icon');
    const eyeOffIcon = button.querySelector('.eye-off-icon');
    
    if (input.type === 'password') {
        // Show password
        input.type = 'text';
        eyeIcon.style.display = 'none';
        eyeOffIcon.style.display = 'block';
    } else {
        // Hide password
        input.type = 'password';
        eyeIcon.style.display = 'block';
        eyeOffIcon.style.display = 'none';
    }
}

/* ========================================== */
/* AUTHENTICATION */
/* ========================================== */
function showLogin() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('loginError').textContent = '';
    document.getElementById('registerError').textContent = '';
}

function showRegister() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
    document.getElementById('loginError').textContent = '';
    document.getElementById('registerError').textContent = '';
}

function checkSession() {
    fetch('auth.php?action=checkSession')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                currentUser = data.username;
                showMainPage();
            }
        })
        .catch(error => console.error('Session check error:', error));
}

function login() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!username || !password) {
        document.getElementById('loginError').textContent = 'Please fill in all fields';
        return;
    }
    
    const formData = new FormData();
    formData.append('action', 'login');
    formData.append('username', username);
    formData.append('password', password);
    
    fetch('auth.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            currentUser = data.username;
            showMainPage();
        } else {
            document.getElementById('loginError').textContent = data.error;
        }
    })
    .catch(error => {
        document.getElementById('loginError').textContent = 'Connection error';
        console.error('Login error:', error);
    });
}

function register() {
    const username = document.getElementById('registerUsername').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirm = document.getElementById('registerConfirm').value;
    
    if (!username || !password || !confirm) {
        document.getElementById('registerError').textContent = 'Please fill in all fields';
        return;
    }
    
    if (password !== confirm) {
        document.getElementById('registerError').textContent = 'Passwords do not match';
        return;
    }
    
    if (password.length < 6) {
        document.getElementById('registerError').textContent = 'Password must be at least 6 characters';
        return;
    }
    
    const formData = new FormData();
    formData.append('action', 'register');
    formData.append('username', username);
    formData.append('password', password);
    formData.append('confirm', confirm);
    
    fetch('auth.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Account created successfully! Please login.');
            showLogin();
            document.getElementById('registerUsername').value = '';
            document.getElementById('registerPassword').value = '';
            document.getElementById('registerConfirm').value = '';
        } else {
            document.getElementById('registerError').textContent = data.error;
        }
    })
    .catch(error => {
        document.getElementById('registerError').textContent = 'Connection error';
        console.error('Register error:', error);
    });
}

function logout() {
    fetch('auth.php?action=logout')
        .then(() => {
            currentUser = '';
            showScreen('loginScreen');
            document.getElementById('profileDropdown').classList.remove('active');
        })
        .catch(error => console.error('Logout error:', error));
}

/* ========================================== */
/* MAIN PAGE */
/* ========================================== */
function showMainPage() {
    document.getElementById('mainUsername').textContent = currentUser;
    document.getElementById('profileUsername').textContent = currentUser;
    showScreen('mainScreen');
    loadUserStats();
}

function toggleProfile() {
    const dropdown = document.getElementById('profileDropdown');
    dropdown.classList.toggle('active');
    if (dropdown.classList.contains('active')) {
        loadUserStats();
    }
}

function loadUserStats() {
    fetch('auth.php?action=getUserStats')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Update high scores
                highScores = data.highScores;
                document.getElementById('profileEasy').textContent = data.highScores.easy;
                document.getElementById('profileMedium').textContent = data.highScores.medium;
                document.getElementById('profileHard').textContent = data.highScores.hard;
                
                // Update history
                const historyDiv = document.getElementById('gameHistory');
                if (data.history.length === 0) {
                    historyDiv.innerHTML = '<p class="no-history">No games played yet</p>';
                } else {
                    historyDiv.innerHTML = data.history.map(game => `
                        <div class="history-item">
                            <strong>${game.difficulty.charAt(0).toUpperCase() + game.difficulty.slice(1)}</strong> - 
                            Score: ${game.score} | 
                            ${game.correct_answers}/${game.total_questions} (${game.accuracy}%)
                            <br><small>${new Date(game.played_at).toLocaleString()}</small>
                        </div>
                    `).join('');
                }
            }
        })
        .catch(error => console.error('Load stats error:', error));
}

/* ========================================== */
/* HELP MODAL */
/* ========================================== */
function showHelp() {
    document.getElementById('helpModal').classList.add('active');
}

function closeHelp() {
    document.getElementById('helpModal').classList.remove('active');
}

/* ========================================== */
/* SCREEN MANAGEMENT */
/* ========================================== */
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

function showGameState(stateId) {
    document.querySelectorAll('.game-state').forEach(s => s.classList.remove('active'));
    document.getElementById(stateId).classList.add('active');
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
    
    document.getElementById('gameUsername').textContent = currentUser;
    updateGameHeader();
    showScreen('gameScreen');
    showGameState('dashboardState');
    
    // Timer will start on first question
}

function updateGameHeader() {
    document.getElementById('gameDifficulty').textContent = difficulties[difficulty].name;
    document.getElementById('gameScore').textContent = score;
    document.getElementById('timeDisplay').textContent = timeLeft;
    document.getElementById('correctDisplay').textContent = correctCount;
    document.getElementById('wrongDisplay').textContent = wrongCount;
    document.getElementById('accuracyDisplay').textContent = calculateAccuracy();
    
    const badge = document.getElementById('gameDiffBadge');
    if (difficulty === 'easy') {
        badge.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
    } else if (difficulty === 'medium') {
        badge.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
    } else if (difficulty === 'hard') {
        badge.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
    }
}

/* ========================================== */
/* TIMER */
/* ========================================== */
function startTimer() {
    // Clear any existing timer first
    if (timerInterval) {
        clearInterval(timerInterval);
        console.log('🔄 Cleared previous timer');
    }
    
    console.log(`⏱️ Timer STARTED at ${timeLeft} seconds`);
    
    timerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById('timeDisplay').textContent = timeLeft;
        
        const timerBadge = document.getElementById('timerBadge');
        if (timeLeft <= 10) {
            timerBadge.classList.add('warning');
        } else {
            timerBadge.classList.remove('warning');
        }
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            console.log('⏰ TIME UP! Ending game...');
            endGame();
        }
    }, 1000);
}

/* ========================================== */
/* DICE ROLLING */
/* ========================================== */
function rollDice() {
    if (isRolling) return;
    
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
            startCountdown();
        }
    }, 100);
}

function startCountdown() {
    console.log('🎬 Starting countdown animation');
    showGameState('countdownState');
    
    const countdownDice = document.getElementById('countdownDice');
    countdownDice.className = `flip-dice ${selectedColor.color}`;
    
    let count = 3;
    const countdownNumber = document.getElementById('countdownNumber');
    countdownNumber.textContent = count;
    
    console.log('Countdown started: 3, 2, 1...');
    
    const countInterval = setInterval(() => {
        count--;
        console.log('Countdown:', count);
        
        if (count > 0) {
            countdownNumber.textContent = count;
        } else {
            clearInterval(countInterval);
            console.log('⏰ Countdown complete! Starting question...');
            setTimeout(() => {
                startQuestion();
            }, 300);
        }
    }, 1000);
}

/* ========================================== */
/* QUESTION */
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
    console.log('📝 === STARTING QUESTION ===');
    console.log('Selected color:', selectedColor);
    
    currentQuestion = generateQuestion();
    console.log('Generated question:', currentQuestion);
    
    questionStartTime = Date.now();
    totalQuestions++;
    
    // Update question display
    const questionNumber = document.getElementById('questionNumber');
    const questionText = document.getElementById('questionText');
    const questionOperation = document.getElementById('questionOperation');
    const questionCard = document.getElementById('questionCard');
    
    console.log('Question elements found:', {
        questionNumber: !!questionNumber,
        questionText: !!questionText,
        questionOperation: !!questionOperation,
        questionCard: !!questionCard
    });
    
    questionNumber.textContent = totalQuestions;
    questionText.textContent = `${currentQuestion.num1} ${selectedColor.label} ${currentQuestion.num2} = ?`;
    questionOperation.textContent = selectedColor.name;
    
    console.log('Question text set to:', questionText.textContent);
    
    // Apply color
    questionCard.className = `question-card ${selectedColor.color}`;
    console.log('Question card class:', questionCard.className);
    
    // Clear previous input
    const answerInput = document.getElementById('answerInput');
    answerInput.value = '';
    
    const feedbackBox = document.getElementById('feedbackBox');
    feedbackBox.classList.remove('show');
    
    // Show playing state
    console.log('Showing playing state...');
    showGameState('playingState');
    
    // ⏱️ START TIMER NOW - Question is visible!
    console.log('▶️ Starting/Restarting timer NOW!');
    startTimer();
    
    // Focus on input
    setTimeout(() => {
        answerInput.focus();
        console.log('✅ Question setup complete!');
    }, 100);
}

/* ========================================== */
/* ANSWER CHECKING */
/* ========================================== */
function calculateTimeBonus(responseTime) {
    const diffSettings = difficulties[difficulty];
    const thresholds = diffSettings.thresholds;
    const bonuses = diffSettings.bonuses;
    
    if (responseTime <= thresholds[0]) return bonuses[0];
    if (responseTime <= thresholds[1]) return bonuses[1];
    if (responseTime <= thresholds[2]) return bonuses[2];
    return bonuses[3];
}

function submitAnswer() {
    const userAnswer = document.getElementById('answerInput').value.trim();
    if (!userAnswer) return;
    
    // STOP TIMER IMMEDIATELY when answer submitted
    if (timerInterval) {
        clearInterval(timerInterval);
        console.log('⏸️ Timer STOPPED for answer feedback');
    }
    
    const responseTime = Math.floor((Date.now() - questionStartTime) / 1000);
    const timeBonus = calculateTimeBonus(responseTime);
    const isCorrect = parseInt(userAnswer) === currentQuestion.answer;
    
    const feedbackBox = document.getElementById('feedbackBox');
    
    if (isCorrect) {
        const points = 100 + (timeBonus * 10);
        score += points;
        correctCount++;
        
        const oldTime = timeLeft;
        timeLeft = Math.min(timeLeft + timeBonus, difficulties[difficulty].maxTime);
        const actualBonus = timeLeft - oldTime;
        
        feedbackBox.className = 'feedback-box correct show';
        feedbackBox.innerHTML = `
            <div class="feedback-message">+${points} points!</div>
            <div class="feedback-details">
                Answered in ${responseTime}s | Time Added: +${actualBonus}s
                ${actualBonus < timeBonus ? `(capped at ${difficulties[difficulty].maxTime}s)` : ''}
            </div>
        `;
    } else {
        wrongCount++;
        timeLeft = Math.max(timeLeft - timeBonus, 0);
        
        feedbackBox.className = 'feedback-box wrong show';
        feedbackBox.innerHTML = `
            <div class="feedback-message">Wrong! Answer: ${currentQuestion.answer}</div>
            <div class="feedback-details">Time Penalty: -${timeBonus}s</div>
        `;
    }
    
    updateGameHeader();
    
    const answerSection = document.getElementById('answerSection');
    answerSection.style.display = 'none';
    
    setTimeout(() => {
        answerSection.style.display = 'flex';
        
        // Check if game is over before going to next question
        if (timeLeft <= 0) {
            console.log('⏰ Time ran out! Game Over!');
            endGame();
        } else {
            resetForNextQuestion();
        }
    }, 2000);
}

function calculateAccuracy() {
    if (totalQuestions === 0) return 0;
    return Math.round((correctCount / totalQuestions) * 100);
}

/* ========================================== */
/* GAME FLOW */
/* ========================================== */
function resetForNextQuestion() {
    selectedColor = null;
    currentQuestion = null;
    showGameState('dashboardState');
    
    const dice = document.getElementById('dice');
    const diceContent = document.getElementById('diceContent');
    dice.className = 'dice';
    dice.style.background = 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)';
    diceContent.textContent = '🎲';
}

function quitGame() {
    if (confirm('Are you sure you want to quit? Your progress will be saved.')) {
        if (timerInterval) clearInterval(timerInterval);
        if (totalQuestions > 0) {
            saveGameData();
        }
        backToMain();
    }
}

function endGame() {
    if (timerInterval) clearInterval(timerInterval);
    
    saveGameData();
    
    const isNewHighScore = score > highScores[difficulty];
    if (isNewHighScore) {
        highScores[difficulty] = score;
    }
    
    document.getElementById('gameOverTitle').textContent = 
        isNewHighScore ? 'New High Score!' : 'Game Over!';
    document.getElementById('gameOverSubtext').textContent = `Great job, ${currentUser}!`;
    document.getElementById('gameOverDifficulty').textContent = difficulties[difficulty].name;
    
    document.getElementById('finalScore').textContent = score;
    document.getElementById('finalHighScore').textContent = highScores[difficulty];
    document.getElementById('finalAccuracy').textContent = `${calculateAccuracy()}%`;
    document.getElementById('finalQuestions').textContent = totalQuestions;
    document.getElementById('finalCorrect').textContent = correctCount;
    document.getElementById('finalWrong').textContent = wrongCount;
    
    const newHighScoreBadge = document.getElementById('newHighScoreBadge');
    if (isNewHighScore) {
        newHighScoreBadge.classList.add('show');
    } else {
        newHighScoreBadge.classList.remove('show');
    }
    
    updateGameOverColors();
    showScreen('gameOverScreen');
}

function updateGameOverColors() {
    const diffBadge = document.getElementById('gameOverDiffBadge');
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

function saveGameData() {
    const gameData = {
        difficulty: difficulty,
        score: score,
        correct: correctCount,
        wrong: wrongCount,
        total: totalQuestions,
        accuracy: calculateAccuracy()
    };
    
    fetch('auth.php?action=saveGame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gameData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('Game data saved successfully');
        }
    })
    .catch(error => console.error('Save error:', error));
}

function playAgain() {
    startGame(difficulty);
}

function backToMain() {
    showMainPage();
}