// F1 Reaction Training Drill - Main Script

// Difficulty settings
const DIFFICULTY_SETTINGS = {
    easy: { min: 3000, max: 5000, catchWindow: 3000, dropDelay: 15000 },
    medium: { min: 2000, max: 4000, catchWindow: 2500, dropDelay: 11000 },
    hard: { min: 1000, max: 3000, catchWindow: 2000, dropDelay: 7000 }
};

let currentDifficulty = 'medium';

// Get custom drop delay from user settings
function getDropDelay() {
    const difficultyMap = {
        'easy': 'easy-time',
        'medium': 'medium-time',
        'hard': 'hard-time'
    };

    const inputId = difficultyMap[currentDifficulty];
    const inputElement = document.getElementById(inputId);

    if (inputElement) {
        const seconds = parseInt(inputElement.value) || DIFFICULTY_SETTINGS[currentDifficulty].dropDelay / 1000;
        return seconds * 1000; // Convert to milliseconds
    }

    return DIFFICULTY_SETTINGS[currentDifficulty].dropDelay;
}

// Audio Context for beep sounds
let audioContext;
let isSpeechEnabled = true;

// Initialize Audio Context
function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
}

// Play beep sound
function playBeep(frequency = 440, duration = 200) {
    initAudio();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration / 1000);
}

// Text-to-Speech function
function speak(text) {
    if (!isSpeechEnabled || !('speechSynthesis' in window)) {
        console.log('Speech:', text);
        return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.2;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    window.speechSynthesis.speak(utterance);
}

// Get random delay based on difficulty
function getRandomDelay() {
    const settings = DIFFICULTY_SETTINGS[currentDifficulty];
    return Math.random() * (settings.max - settings.min) + settings.min;
}

// ===========================
// GAME 1: LEFT/RIGHT BUZZER
// ===========================

const game1 = {
    isActive: false,
    currentDirection: null,
    startTime: null,
    timeoutId: null,
    stats: {
        attempts: 0,
        correct: 0,
        wrong: 0,
        missed: 0,
        reactionTimes: []
    }
};

function startGame1() {
    if (game1.isActive) return;

    // Reset stats
    game1.stats = {
        attempts: 0,
        correct: 0,
        wrong: 0,
        missed: 0,
        reactionTimes: []
    };
    updateGame1Stats();

    game1.isActive = true;
    document.getElementById('game1-start').disabled = true;
    document.getElementById('game1-stop').disabled = false;
    document.getElementById('callout-display').textContent = '';

    // Enable buzzers
    document.getElementById('left-buzzer').disabled = false;
    document.getElementById('right-buzzer').disabled = false;

    speak('Game 1 starting');
    updateGame1Status('Get ready...');

    // Start first callout after initial delay
    setTimeout(() => {
        if (game1.isActive) {
            nextGame1Round();
        }
    }, 2000);
}

function stopGame1() {
    game1.isActive = false;
    if (game1.timeoutId) {
        clearTimeout(game1.timeoutId);
    }

    document.getElementById('game1-start').disabled = false;
    document.getElementById('game1-stop').disabled = true;
    document.getElementById('left-buzzer').disabled = true;
    document.getElementById('right-buzzer').disabled = true;
    document.getElementById('callout-display').textContent = '';

    speak('Game 1 stopped');
    updateGame1Status('Game stopped. Click Start to play again.');
}

function nextGame1Round() {
    if (!game1.isActive) return;

    updateGame1Status('Wait for it...');
    document.getElementById('callout-display').textContent = '';

    // Random delay before callout
    const delay = getRandomDelay();

    game1.timeoutId = setTimeout(() => {
        if (!game1.isActive) return;

        // Random direction
        game1.currentDirection = Math.random() < 0.5 ? 'left' : 'right';
        game1.startTime = Date.now();
        game1.stats.attempts++;

        // Display and speak
        const displayText = game1.currentDirection.toUpperCase();
        document.getElementById('callout-display').textContent = displayText;
        speak(game1.currentDirection);
        playBeep(game1.currentDirection === 'left' ? 400 : 600, 300);

        updateGame1Status(`Press ${displayText}!`);

        // Set timeout for missed response (3 seconds)
        game1.timeoutId = setTimeout(() => {
            if (game1.isActive && game1.currentDirection !== null) {
                handleGame1Missed();
            }
        }, 3000);
    }, delay);
}

function handleGame1Response(pressedDirection) {
    if (!game1.isActive || game1.currentDirection === null) return;

    clearTimeout(game1.timeoutId);

    const reactionTime = Date.now() - game1.startTime;
    game1.stats.reactionTimes.push(reactionTime);

    const isCorrect = pressedDirection === game1.currentDirection;

    if (isCorrect) {
        game1.stats.correct++;
        playBeep(800, 200);
        speak('Correct');
        updateGame1Status(`Correct! ${reactionTime}ms`);
        flashCard('game1', 'correct');
    } else {
        game1.stats.wrong++;
        playBeep(200, 400);
        speak('Wrong');
        updateGame1Status(`Wrong! You pressed ${pressedDirection}`);
        flashCard('game1', 'wrong');
    }

    game1.currentDirection = null;
    updateGame1Stats();

    // Next round after short delay
    setTimeout(() => {
        if (game1.isActive) {
            nextGame1Round();
        }
    }, 1500);
}

function handleGame1Missed() {
    if (!game1.isActive) return;

    game1.stats.missed++;
    playBeep(150, 600);
    speak('Missed');
    updateGame1Status('Too slow! You missed it.');
    flashCard('game1', 'missed');

    game1.currentDirection = null;
    updateGame1Stats();

    // Next round after short delay
    setTimeout(() => {
        if (game1.isActive) {
            nextGame1Round();
        }
    }, 1500);
}

function updateGame1Status(message) {
    document.querySelector('#game1-status .status-message').textContent = message;
}

function updateGame1Stats() {
    document.getElementById('game1-attempts').textContent = game1.stats.attempts;
    document.getElementById('game1-correct').textContent = game1.stats.correct;
    document.getElementById('game1-wrong').textContent = game1.stats.wrong;
    document.getElementById('game1-missed').textContent = game1.stats.missed;

    if (game1.stats.reactionTimes.length > 0) {
        const avgTime = Math.round(
            game1.stats.reactionTimes.reduce((a, b) => a + b, 0) / game1.stats.reactionTimes.length
        );
        const lastTime = game1.stats.reactionTimes[game1.stats.reactionTimes.length - 1];

        document.getElementById('game1-avg-time').textContent = `${avgTime}ms`;
        document.getElementById('game1-last-time').textContent = `${lastTime}ms`;
    }
}

// ===========================
// GAME 2: BALL DROP CATCH
// ===========================

const game2 = {
    isActive: false,
    isDropCallout: false,
    startTime: null,
    timeoutId: null,
    stats: {
        rounds: 0
    }
};

function startGame2() {
    if (game2.isActive) return;

    // Reset stats
    game2.stats = {
        rounds: 0
    };
    updateGame2Stats();

    game2.isActive = true;
    document.getElementById('game2-start').disabled = true;
    document.getElementById('game2-stop').disabled = false;
    document.getElementById('game2-callout-display').textContent = '';

    speak('Game 2 starting. Hold the ball');
    updateGame2Status('Get ready to drop and catch...');

    // Start first callout after initial delay
    setTimeout(() => {
        if (game2.isActive) {
            nextGame2Round();
        }
    }, 2000);
}

function stopGame2() {
    game2.isActive = false;
    if (game2.timeoutId) {
        clearTimeout(game2.timeoutId);
    }

    document.getElementById('game2-start').disabled = false;
    document.getElementById('game2-stop').disabled = true;
    const catchZone = document.getElementById('catch-zone');
    const timerBar = document.getElementById('timer-bar');
    catchZone.disabled = true;
    timerBar.classList.remove('active');
    document.getElementById('game2-callout-display').textContent = '';

    speak('Game 2 stopped');
    updateGame2Status('Game stopped. Click Start to play again.');
}

function nextGame2Round() {
    if (!game2.isActive) return;

    updateGame2Status('Hold the ball... wait for callout');
    document.getElementById('game2-callout-display').textContent = '';
    const catchZone = document.getElementById('catch-zone');
    const timerBar = document.getElementById('timer-bar');
    catchZone.disabled = true;
    timerBar.classList.remove('active');

    // Random delay before callout
    const delay = getRandomDelay();

    game2.timeoutId = setTimeout(() => {
        if (!game2.isActive) return;

        // Determine hand selection based on difficulty
        let handSelection;
        const random = Math.random();

        if (currentDifficulty === 'easy') {
            // Easy: Only left or right, no both hands
            handSelection = random < 0.5 ? 'left' : 'right';
        } else if (currentDifficulty === 'medium') {
            // Medium: 10% both hands, 45% left, 45% right
            if (random < 0.1) {
                handSelection = 'both';
            } else if (random < 0.55) {
                handSelection = 'left';
            } else {
                handSelection = 'right';
            }
        } else if (currentDifficulty === 'hard') {
            // Hard: 30% both hands, 35% left, 35% right
            if (random < 0.3) {
                handSelection = 'both';
            } else if (random < 0.65) {
                handSelection = 'left';
            } else {
                handSelection = 'right';
            }
        }

        // Generate callout based on hand selection
        let callout;
        if (handSelection === 'both') {
            callout = 'Both Hands Drop and Catch';
        } else if (handSelection === 'left') {
            const leftCallouts = ['Left Hand Drop', 'Left Hand Catch', 'Drop with Left', 'Left Hand'];
            callout = leftCallouts[Math.floor(Math.random() * leftCallouts.length)];
        } else {
            const rightCallouts = ['Right Hand Drop', 'Right Hand Catch', 'Drop with Right', 'Right Hand'];
            callout = rightCallouts[Math.floor(Math.random() * rightCallouts.length)];
        }

        game2.isDropCallout = true;
        game2.startTime = Date.now();

        // Display and speak
        document.getElementById('game2-callout-display').textContent = callout.toUpperCase();
        speak(callout);

        // Different beep frequencies for different hands
        if (handSelection === 'both') {
            playBeep(500, 300);
        } else if (handSelection === 'left') {
            playBeep(400, 300);
        } else {
            playBeep(600, 300);
        }

        updateGame2Status('Drop and catch with the called hand!');

        // Enable catch zone
        catchZone.disabled = false;

        // Start timer animation
        const catchWindow = DIFFICULTY_SETTINGS[currentDifficulty].catchWindow;
        timerBar.style.animationDuration = `${catchWindow}ms`;
        timerBar.classList.add('active');

        // Auto-advance after catch window expires
        game2.timeoutId = setTimeout(() => {
            if (game2.isActive && game2.isDropCallout) {
                handleGame2Response();
            }
        }, catchWindow);
    }, delay);
}

function handleGame2Response() {
    if (!game2.isActive || !game2.isDropCallout) return;

    clearTimeout(game2.timeoutId);

    const catchZone = document.getElementById('catch-zone');
    const timerBar = document.getElementById('timer-bar');

    // Disable catch zone and stop timer
    catchZone.disabled = true;
    timerBar.classList.remove('active');

    // Increment rounds and update stats
    game2.stats.rounds++;
    updateGame2Stats();

    // Simple acknowledgment
    playBeep(800, 200);
    updateGame2Status('Round complete!');

    game2.isDropCallout = false;

    // Next round after drop delay (gives time for physical drop-catch)
    const dropDelay = getDropDelay();
    const nextRoundTime = Math.floor(dropDelay / 1000);

    // Show countdown
    let countdown = nextRoundTime;
    updateGame2Status(`Get ready... next round in ${countdown}s`);

    const countdownInterval = setInterval(() => {
        countdown--;
        if (countdown > 0 && game2.isActive) {
            updateGame2Status(`Get ready... next round in ${countdown}s`);
        } else {
            clearInterval(countdownInterval);
        }
    }, 1000);

    setTimeout(() => {
        clearInterval(countdownInterval);
        if (game2.isActive) {
            nextGame2Round();
        }
    }, dropDelay);
}

function updateGame2Status(message) {
    document.querySelector('#game2-status .status-message').textContent = message;
}

function updateGame2Stats() {
    document.getElementById('game2-rounds').textContent = game2.stats.rounds;
}

// ===========================
// UTILITY FUNCTIONS
// ===========================

function flashCard(gameId, type) {
    const card = document.getElementById(gameId);
    card.classList.add(`flash-${type}`);
    setTimeout(() => {
        card.classList.remove(`flash-${type}`);
    }, 500);
}

// ===========================
// EVENT LISTENERS
// ===========================

document.addEventListener('DOMContentLoaded', () => {
    // Game selection menu
    document.querySelectorAll('.game-menu-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // Stop any active games before switching
            if (game1.isActive) {
                stopGame1();
            }
            if (game2.isActive) {
                stopGame2();
            }

            // Update active button
            document.querySelectorAll('.game-menu-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Show selected game
            const selectedGame = btn.dataset.game;
            document.querySelectorAll('.game-card').forEach(card => {
                card.classList.remove('active');
            });
            document.getElementById(selectedGame).classList.add('active');

            // Announce game selection
            const gameName = btn.querySelector('.game-title').textContent;
            speak(`${gameName} selected`);
            playBeep(600, 150);
        });
    });

    // Difficulty selection (dropdown)
    document.getElementById('difficulty-select').addEventListener('change', (e) => {
        currentDifficulty = e.target.value;
        speak(`Difficulty set to ${currentDifficulty}`);
        playBeep(600, 150);
    });

    // Game 1 controls
    document.getElementById('game1-start').addEventListener('click', startGame1);
    document.getElementById('game1-stop').addEventListener('click', stopGame1);

    // Buzzer interactions (support both click and touch)
    const leftBuzzer = document.getElementById('left-buzzer');
    const rightBuzzer = document.getElementById('right-buzzer');

    leftBuzzer.addEventListener('click', () => {
        handleGame1Response('left');
    });

    rightBuzzer.addEventListener('click', () => {
        handleGame1Response('right');
    });

    // Touch support for mobile
    leftBuzzer.addEventListener('touchstart', (e) => {
        if (!leftBuzzer.disabled) {
            e.preventDefault();
            handleGame1Response('left');
        }
    }, { passive: false });

    rightBuzzer.addEventListener('touchstart', (e) => {
        if (!rightBuzzer.disabled) {
            e.preventDefault();
            handleGame1Response('right');
        }
    }, { passive: false });

    // Keyboard support for Game 1
    document.addEventListener('keydown', (e) => {
        if (!game1.isActive || game1.currentDirection === null) return;

        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
            handleGame1Response('left');
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            handleGame1Response('right');
        }
    });

    // Game 2 controls
    document.getElementById('game2-start').addEventListener('click', startGame2);
    document.getElementById('game2-stop').addEventListener('click', stopGame2);

    // Catch zone interactions (support both click and touch)
    const catchZone = document.getElementById('catch-zone');

    catchZone.addEventListener('click', () => {
        if (!catchZone.disabled) {
            handleGame2Response();
        }
    });

    // Touch support for mobile
    catchZone.addEventListener('touchstart', (e) => {
        if (!catchZone.disabled) {
            e.preventDefault();
            handleGame2Response();
        }
    }, { passive: false });

    // Keyboard support for Game 2 (spacebar to continue)
    document.addEventListener('keydown', (e) => {
        if (!game2.isActive || !game2.isDropCallout) return;

        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            handleGame2Response();
        }
    });

    // Initialize audio on first user interaction
    document.body.addEventListener('click', initAudio, { once: true });

    // Welcome message
    speak('F1 Reaction Training Drill loaded. Select a game to begin.');
});
