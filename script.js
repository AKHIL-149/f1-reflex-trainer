// F1 Reaction Training Drill - Main Script

// Difficulty settings
const DIFFICULTY_SETTINGS = {
    easy: { min: 3000, max: 5000 },
    medium: { min: 2000, max: 4000 },
    hard: { min: 1000, max: 3000 }
};

let currentDifficulty = 'medium';

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
        rounds: 0,
        caught: 0,
        missed: 0,
        reactionTimes: []
    }
};

function startGame2() {
    if (game2.isActive) return;

    // Reset stats
    game2.stats = {
        rounds: 0,
        caught: 0,
        missed: 0,
        reactionTimes: []
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
    document.getElementById('caught-btn').disabled = true;
    document.getElementById('missed-btn').disabled = true;
    document.getElementById('game2-callout-display').textContent = '';

    speak('Game 2 stopped');
    updateGame2Status('Game stopped. Click Start to play again.');
}

function nextGame2Round() {
    if (!game2.isActive) return;

    updateGame2Status('Hold the ball... wait for callout');
    document.getElementById('game2-callout-display').textContent = '';
    document.getElementById('caught-btn').disabled = true;
    document.getElementById('missed-btn').disabled = true;

    // Random delay before callout
    const delay = getRandomDelay();

    game2.timeoutId = setTimeout(() => {
        if (!game2.isActive) return;

        // Random callout - mix of "Drop", "Drop and Catch", "Release", "Let go"
        const callouts = ['Drop', 'Drop and Catch', 'Release', 'Let go', 'Drop it'];
        const callout = callouts[Math.floor(Math.random() * callouts.length)];

        game2.isDropCallout = true;
        game2.startTime = Date.now();
        game2.stats.rounds++;

        // Display and speak
        document.getElementById('game2-callout-display').textContent = callout.toUpperCase();
        speak(callout);
        playBeep(500, 300);

        updateGame2Status('Drop and catch now!');

        // Enable response buttons
        document.getElementById('caught-btn').disabled = false;
        document.getElementById('missed-btn').disabled = false;

        // Auto-advance after 5 seconds if no response
        game2.timeoutId = setTimeout(() => {
            if (game2.isActive && game2.isDropCallout) {
                handleGame2Response(false);
            }
        }, 5000);
    }, delay);
}

function handleGame2Response(caught) {
    if (!game2.isActive || !game2.isDropCallout) return;

    clearTimeout(game2.timeoutId);

    const reactionTime = Date.now() - game2.startTime;
    game2.stats.reactionTimes.push(reactionTime);

    if (caught) {
        game2.stats.caught++;
        playBeep(800, 200);
        speak('Great catch');
        updateGame2Status(`Caught! Reaction: ${reactionTime}ms`);
        flashCard('game2', 'correct');
    } else {
        game2.stats.missed++;
        playBeep(200, 400);
        speak('Missed');
        updateGame2Status('Missed the catch. Try again!');
        flashCard('game2', 'missed');
    }

    game2.isDropCallout = false;
    document.getElementById('caught-btn').disabled = true;
    document.getElementById('missed-btn').disabled = true;
    updateGame2Stats();

    // Next round after short delay
    setTimeout(() => {
        if (game2.isActive) {
            nextGame2Round();
        }
    }, 1500);
}

function updateGame2Status(message) {
    document.querySelector('#game2-status .status-message').textContent = message;
}

function updateGame2Stats() {
    document.getElementById('game2-rounds').textContent = game2.stats.rounds;
    document.getElementById('game2-caught').textContent = game2.stats.caught;
    document.getElementById('game2-missed-count').textContent = game2.stats.missed;

    const successRate = game2.stats.rounds > 0
        ? Math.round((game2.stats.caught / game2.stats.rounds) * 100)
        : 0;
    document.getElementById('game2-success-rate').textContent = `${successRate}%`;

    if (game2.stats.reactionTimes.length > 0) {
        const avgTime = Math.round(
            game2.stats.reactionTimes.reduce((a, b) => a + b, 0) / game2.stats.reactionTimes.length
        );
        const lastTime = game2.stats.reactionTimes[game2.stats.reactionTimes.length - 1];

        document.getElementById('game2-avg-time').textContent = `${avgTime}ms`;
        document.getElementById('game2-last-time').textContent = `${lastTime}ms`;
    }
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
    // Difficulty selection
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentDifficulty = btn.dataset.difficulty;
            speak(`Difficulty set to ${currentDifficulty}`);
            playBeep(600, 150);
        });
    });

    // Game 1 controls
    document.getElementById('game1-start').addEventListener('click', startGame1);
    document.getElementById('game1-stop').addEventListener('click', stopGame1);

    document.getElementById('left-buzzer').addEventListener('click', () => {
        handleGame1Response('left');
    });

    document.getElementById('right-buzzer').addEventListener('click', () => {
        handleGame1Response('right');
    });

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

    document.getElementById('caught-btn').addEventListener('click', () => {
        handleGame2Response(true);
    });

    document.getElementById('missed-btn').addEventListener('click', () => {
        handleGame2Response(false);
    });

    // Keyboard support for Game 2
    document.addEventListener('keydown', (e) => {
        if (!game2.isActive || !game2.isDropCallout) return;

        if (e.key === 'c' || e.key === 'C' || e.key === ' ') {
            handleGame2Response(true);
        } else if (e.key === 'm' || e.key === 'M' || e.key === 'x' || e.key === 'X') {
            handleGame2Response(false);
        }
    });

    // Initialize audio on first user interaction
    document.body.addEventListener('click', initAudio, { once: true });

    // Welcome message
    speak('F1 Reaction Training Drill loaded. Select a game to begin.');
});
