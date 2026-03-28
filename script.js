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
// GAME 3: RANDOM SCREEN TAP
// ===========================

// Color pools for different difficulty levels
const COLOR_POOLS = {
    easy: [
        { name: 'red', value: '#FF0000' },
        { name: 'green', value: '#00FF00' },
        { name: 'blue', value: '#0000FF' },
        { name: 'yellow', value: '#FFFF00' },
        { name: 'purple', value: '#FF00FF' }
    ],
    medium: [
        { name: 'red', value: '#FF0000' },
        { name: 'orange', value: '#FF8800' },
        { name: 'yellow', value: '#FFFF00' },
        { name: 'green', value: '#00FF00' },
        { name: 'cyan', value: '#00FFFF' },
        { name: 'blue', value: '#0000FF' },
        { name: 'purple', value: '#FF00FF' },
        { name: 'pink', value: '#FF66FF' }
    ],
    hard: [
        { name: 'red', value: '#FF0000' },
        { name: 'crimson', value: '#DC143C' },
        { name: 'orange', value: '#FF8800' },
        { name: 'amber', value: '#FFBF00' },
        { name: 'yellow', value: '#FFFF00' },
        { name: 'lime', value: '#00FF00' },
        { name: 'green', value: '#008000' },
        { name: 'cyan', value: '#00FFFF' },
        { name: 'blue', value: '#0000FF' },
        { name: 'navy', value: '#000080' },
        { name: 'purple', value: '#800080' },
        { name: 'magenta', value: '#FF00FF' }
    ]
};

// Game 3 difficulty settings
const GAME3_SETTINGS = {
    easy: {
        minDelay: 2500,
        maxDelay: 5000,
        reactionWindow: 1500,
        totalRounds: 20,
        targetFrequency: 0.4,
        targetFrequencyVariance: 0.1,
        burstProbability: 0.05,
        pointsCorrect: 100,
        pointsWrong: -30,
        pointsMissed: -50,
        streakBonus: 20
    },
    medium: {
        minDelay: 1500,
        maxDelay: 4000,
        reactionWindow: 1200,
        totalRounds: 30,
        targetFrequency: 0.35,
        targetFrequencyVariance: 0.15,
        burstProbability: 0.1,
        pointsCorrect: 150,
        pointsWrong: -50,
        pointsMissed: -75,
        streakBonus: 30
    },
    hard: {
        minDelay: 500,
        maxDelay: 2500,
        reactionWindow: 1000,
        totalRounds: 40,
        targetFrequency: 0.3,
        targetFrequencyVariance: 0.2,
        burstProbability: 0.15,
        pointsCorrect: 200,
        pointsWrong: -75,
        pointsMissed: -100,
        streakBonus: 50
    }
};

const game3 = {
    isActive: false,
    isPaused: false,
    currentColor: null,
    targetColors: [],
    selectedColors: [],
    colorPool: [],
    settings: null,
    timeoutId: null,
    currentRound: 0,
    isTargetShowing: false,
    roundStartTime: null,
    consecutiveFalseTaps: 0,
    consecutiveNonTargets: 0,
    lastTargetColors: [],
    multiTargetMode: false,
    dynamicRotation: true,
    rotationInterval: 5,
    isBurstMode: false,
    stats: {
        targetAppearances: 0,
        correctTaps: 0,
        falseTaps: 0,
        missedTargets: 0,
        reactionTimes: [],
        score: 0,
        currentStreak: 0,
        bestStreak: 0,
        targetChanges: 0
    }
};

function initializeGame3Colors() {
    const colorSelection = document.getElementById('color-selection');
    colorSelection.innerHTML = '';

    const colors = COLOR_POOLS[currentDifficulty];

    colors.forEach(color => {
        const colorBtn = document.createElement('div');
        colorBtn.className = 'color-option';
        colorBtn.style.backgroundColor = color.value;
        colorBtn.dataset.colorName = color.name;
        colorBtn.dataset.colorValue = color.value;

        colorBtn.addEventListener('click', () => {
            handleColorSelection(colorBtn, color);
        });

        colorSelection.appendChild(colorBtn);
    });
}

function handleColorSelection(colorBtn, color) {
    const multiTargetMode = document.getElementById('multi-target-mode').checked;
    // Limit to 2-3 colors in multi-target for better gameplay
    const maxSelection = multiTargetMode ? 3 : 1;

    if (colorBtn.classList.contains('selected')) {
        // Deselect
        colorBtn.classList.remove('selected');
        game3.selectedColors = game3.selectedColors.filter(c => c.name !== color.name);
    } else {
        // Select
        if (game3.selectedColors.length >= maxSelection) {
            // In multi-target mode, show warning and don't allow more
            if (multiTargetMode) {
                updateGame3Status(`Maximum ${maxSelection} colors allowed in Multi-Target Mode!`);
                speak('Maximum colors selected');
                playBeep(300, 200);
                return;
            } else {
                // Remove previous selection in single target mode
                document.querySelectorAll('.color-option.selected').forEach(btn => {
                    btn.classList.remove('selected');
                });
                game3.selectedColors = [];
            }
        }
        colorBtn.classList.add('selected');
        game3.selectedColors.push(color);

        // Update status
        if (multiTargetMode && game3.selectedColors.length >= 2) {
            updateGame3Status(`${game3.selectedColors.length} colors selected. Click Start when ready!`);
        }
    }

    updateTargetDisplay();
}

function updateTargetDisplay() {
    const container = document.getElementById('target-colors-container');
    container.innerHTML = '';

    game3.selectedColors.forEach(color => {
        const box = document.createElement('div');
        box.className = 'target-color-box';
        box.style.backgroundColor = color.value;
        container.appendChild(box);
    });
}

function selectRandomTargets() {
    const multiTargetMode = game3.multiTargetMode;
    const count = multiTargetMode ? (2 + Math.floor(Math.random() * 2)) : 1; // 2-3 targets in multi mode

    // Clear current targets
    game3.targetColors = [];

    // Select random colors from pool
    const availableColors = [...game3.colorPool];
    for (let i = 0; i < count && availableColors.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * availableColors.length);
        game3.targetColors.push(availableColors[randomIndex]);
        availableColors.splice(randomIndex, 1);
    }

    // Update display
    const container = document.getElementById('target-colors-container');
    container.innerHTML = '';
    game3.targetColors.forEach(color => {
        const box = document.createElement('div');
        box.className = 'target-color-box';
        box.style.backgroundColor = color.value;
        container.appendChild(box);
    });

    return game3.targetColors;
}

function showTargetChangeNotification(newTargets) {
    const notification = document.createElement('div');
    notification.className = 'target-change-notification';

    const targetNames = newTargets.map(t => t.name.toUpperCase()).join(', ');
    notification.innerHTML = `NEW TARGET!<br>${targetNames}`;

    document.body.appendChild(notification);

    const colorNames = newTargets.map(t => t.name).join(' and ');
    speak(`New target: ${colorNames}`);
    playBeep(600, 300);

    setTimeout(() => {
        notification.remove();
    }, 2000);
}

function startGame3() {
    if (game3.isActive) return;

    // Check if colors are selected
    if (game3.selectedColors.length === 0) {
        updateGame3Status('Please select at least one target color!');
        speak('Please select a target color');
        return;
    }

    // Get settings
    game3.multiTargetMode = document.getElementById('multi-target-mode').checked;
    game3.dynamicRotation = document.getElementById('dynamic-rotation').checked;

    // Reset state
    game3.stats = {
        targetAppearances: 0,
        correctTaps: 0,
        falseTaps: 0,
        missedTargets: 0,
        reactionTimes: [],
        score: 0,
        currentStreak: 0,
        bestStreak: 0,
        targetChanges: 0
    };
    game3.currentRound = 0;
    game3.consecutiveFalseTaps = 0;
    game3.isTargetShowing = false;

    // Get difficulty settings and adjust for multi-target mode
    game3.settings = { ...GAME3_SETTINGS[currentDifficulty] };
    game3.colorPool = [...COLOR_POOLS[currentDifficulty]];

    // Extend rounds for multi-target mode (more colors = more rounds needed)
    if (game3.multiTargetMode) {
        const targetCount = game3.selectedColors.length;
        const roundMultiplier = 1 + (targetCount - 1) * 0.2; // 20% more rounds per additional color
        game3.settings.totalRounds = Math.ceil(game3.settings.totalRounds * roundMultiplier);
    }

    // Set initial target colors
    if (game3.multiTargetMode || game3.dynamicRotation) {
        selectRandomTargets();
    } else {
        game3.targetColors = [...game3.selectedColors];
        updateTargetDisplay();
    }

    // Reset tracking
    game3.consecutiveNonTargets = 0;
    game3.lastTargetColors = [];
    game3.isBurstMode = false;

    // Update UI
    updateGame3Stats();
    document.getElementById('results-panel').style.display = 'none';
    document.getElementById('game3-options').style.display = 'none';
    document.getElementById('game3-start').disabled = true;
    document.getElementById('game3-stop').disabled = false;

    // Show countdown
    showCountdown(() => {
        game3.isActive = true;
        document.getElementById('tap-zone').setAttribute('data-enabled', 'true');

        const targetInfo = game3.targetColors.length > 1 ?
            'target colors' : 'target color';
        speak(`Game 3 starting. Tap only on the ${targetInfo}`);
        updateGame3Status('Watch carefully...');
        nextGame3Round();
    });
}

function stopGame3() {
    game3.isActive = false;
    if (game3.timeoutId) {
        clearTimeout(game3.timeoutId);
    }

    document.getElementById('game3-start').disabled = false;
    document.getElementById('game3-stop').disabled = true;
    document.getElementById('tap-zone').setAttribute('data-enabled', 'false');
    document.getElementById('tap-zone').style.backgroundColor = '#1a1a1a';
    document.getElementById('game3-options').style.display = 'block';

    speak('Game 3 stopped');
    updateGame3Status('Select your target color(s) above and click Start');
}

function showCountdown(callback) {
    const overlay = document.getElementById('countdown-overlay');
    const counts = ['3', '2', '1', 'GO!'];
    let index = 0;

    function showNext() {
        if (index < counts.length) {
            overlay.textContent = counts[index];
            speak(counts[index] === 'GO!' ? 'Go' : counts[index]);
            playBeep(400 + (index * 100), 200);
            index++;
            setTimeout(showNext, 800);
        } else {
            overlay.textContent = '';
            callback();
        }
    }

    showNext();
}

function nextGame3Round() {
    if (!game3.isActive) return;

    game3.currentRound++;

    // Check if game is complete
    if (game3.currentRound > game3.settings.totalRounds) {
        endGame3();
        return;
    }

    // Dynamic rotation: Change target every 5 rounds
    if (game3.dynamicRotation && game3.currentRound > 1 && (game3.currentRound - 1) % game3.rotationInterval === 0) {
        const newTargets = selectRandomTargets();
        game3.stats.targetChanges++;
        showTargetChangeNotification(newTargets);

        // Delay before continuing to next round
        setTimeout(() => {
            if (game3.isActive) {
                continueToNextRound();
            }
        }, 2500);
        return;
    }

    continueToNextRound();
}

function continueToNextRound() {
    if (!game3.isActive) return;

    updateGame3Stats();
    game3.isTargetShowing = false;

    // Reset tap zone
    document.getElementById('tap-zone').style.backgroundColor = '#1a1a1a';

    // Check for burst mode (occasional rapid-fire targets)
    if (!game3.isBurstMode && Math.random() < game3.settings.burstProbability) {
        game3.isBurstMode = true;
        speak('Burst mode');
        playBeep(700, 100);
    }

    // Calculate dynamic delay (shorter in burst mode, but not too extreme)
    let minDelay = game3.settings.minDelay;
    let maxDelay = game3.settings.maxDelay;

    if (game3.isBurstMode) {
        // Reduce by 30% instead of 60% - more reasonable
        minDelay = Math.max(700, minDelay * 0.7);  // Hard minimum: 700ms
        maxDelay = Math.max(1500, maxDelay * 0.7); // Hard maximum: 1500ms minimum
    }

    const delay = Math.random() * (maxDelay - minDelay) + minDelay;

    game3.timeoutId = setTimeout(() => {
        if (!game3.isActive) return;

        // Calculate dynamic target frequency
        let baseFrequency = game3.settings.targetFrequency;

        // Increase frequency for multi-target mode
        if (game3.multiTargetMode) {
            baseFrequency += 0.2; // Boost from 30% to 50% for example
        }

        // Add variance to prevent predictability
        const variance = game3.settings.targetFrequencyVariance;
        const dynamicFrequency = baseFrequency + (Math.random() * variance * 2 - variance);

        // Anti-pattern logic: Force a target if too many consecutive non-targets
        const maxConsecutiveNonTargets = game3.multiTargetMode ? 3 : 4;
        let showTarget;

        if (game3.consecutiveNonTargets >= maxConsecutiveNonTargets) {
            showTarget = true; // Force target to break pattern
        } else if (game3.isBurstMode) {
            showTarget = Math.random() < 0.7; // Higher chance in burst mode
        } else {
            showTarget = Math.random() < dynamicFrequency;
        }

        if (showTarget) {
            // Select target color - ensure variety in multi-target mode
            let selectedTarget;

            if (game3.multiTargetMode && game3.lastTargetColors.length > 0) {
                // Try to select a different target than last time
                const availableTargets = game3.targetColors.filter(
                    t => !game3.lastTargetColors.includes(t.name)
                );

                if (availableTargets.length > 0) {
                    selectedTarget = availableTargets[Math.floor(Math.random() * availableTargets.length)];
                } else {
                    selectedTarget = game3.targetColors[Math.floor(Math.random() * game3.targetColors.length)];
                }
            } else {
                selectedTarget = game3.targetColors[Math.floor(Math.random() * game3.targetColors.length)];
            }

            game3.currentColor = selectedTarget;
            game3.isTargetShowing = true;
            game3.stats.targetAppearances++;
            game3.consecutiveNonTargets = 0;

            // Track last target color
            game3.lastTargetColors = [selectedTarget.name];
            if (game3.lastTargetColors.length > 2) {
                game3.lastTargetColors.shift();
            }
        } else {
            // Select random non-target color
            const targetNames = game3.targetColors.map(t => t.name);
            const availableColors = game3.colorPool.filter(c => !targetNames.includes(c.name));
            game3.currentColor = availableColors[Math.floor(Math.random() * availableColors.length)];
            game3.isTargetShowing = false;
            game3.consecutiveNonTargets++;
        }

        // End burst mode randomly
        if (game3.isBurstMode && Math.random() < 0.3) {
            game3.isBurstMode = false;
        }

        // Show color
        document.getElementById('tap-zone').style.backgroundColor = game3.currentColor.value;
        game3.roundStartTime = Date.now();

        if (game3.isTargetShowing) {
            updateGame3Status('TARGET! Tap now!');
            playBeep(800, 150);
        } else {
            updateGame3Status('Not the target... wait');
        }

        // Set timeout for missed target or move to next round
        game3.timeoutId = setTimeout(() => {
            if (!game3.isActive) return;

            if (game3.isTargetShowing) {
                // Missed target
                handleGame3Missed();
            } else {
                // Correct non-tap
                nextGame3Round();
            }
        }, game3.settings.reactionWindow);
    }, delay);
}

function handleGame3Tap() {
    if (!game3.isActive) return;

    clearTimeout(game3.timeoutId);

    if (game3.isTargetShowing) {
        // Correct tap on target
        const reactionTime = Date.now() - game3.roundStartTime;
        game3.stats.reactionTimes.push(reactionTime);
        game3.stats.correctTaps++;
        game3.stats.currentStreak++;
        game3.consecutiveFalseTaps = 0;

        if (game3.stats.currentStreak > game3.stats.bestStreak) {
            game3.stats.bestStreak = game3.stats.currentStreak;
        }

        // Calculate points with speed bonus
        let points = game3.settings.pointsCorrect;
        const speedBonus = Math.max(0, Math.floor((game3.settings.reactionWindow - reactionTime) / 10));
        points += speedBonus;

        // Streak bonus
        if (game3.stats.currentStreak >= 3) {
            points += game3.settings.streakBonus * Math.floor(game3.stats.currentStreak / 3);
        }

        game3.stats.score += points;

        playBeep(1000, 200);
        speak('Correct');
        updateGame3Status(`Correct! +${points} points (${reactionTime}ms)`);
        flashCard('game3', 'correct');
    } else {
        // False tap on wrong color
        game3.stats.falseTaps++;
        game3.stats.currentStreak = 0;
        game3.consecutiveFalseTaps++;

        let penalty = game3.settings.pointsWrong;

        // Extra penalty for multiple consecutive false taps
        if (game3.consecutiveFalseTaps > 2) {
            penalty *= 1.5;
        }

        game3.stats.score += penalty;

        playBeep(200, 400);
        speak('Wrong');
        updateGame3Status(`Wrong color! ${penalty} points`);
        flashCard('game3', 'wrong');
    }

    updateGame3Stats();

    // Next round after brief delay
    setTimeout(() => {
        if (game3.isActive) {
            nextGame3Round();
        }
    }, 800);
}

function handleGame3Missed() {
    if (!game3.isActive) return;

    game3.stats.missedTargets++;
    game3.stats.currentStreak = 0;
    game3.stats.score += game3.settings.pointsMissed;

    playBeep(150, 600);
    speak('Missed');
    updateGame3Status(`Missed target! ${game3.settings.pointsMissed} points`);
    flashCard('game3', 'missed');

    updateGame3Stats();

    setTimeout(() => {
        if (game3.isActive) {
            nextGame3Round();
        }
    }, 800);
}

function endGame3() {
    game3.isActive = false;
    document.getElementById('tap-zone').setAttribute('data-enabled', 'false');
    document.getElementById('tap-zone').style.backgroundColor = '#1a1a1a';
    document.getElementById('game3-stop').disabled = true;

    // Show results
    displayGame3Results();
    speak('Session complete');
}

function displayGame3Results() {
    const resultsPanel = document.getElementById('results-panel');
    resultsPanel.style.display = 'block';

    // Populate results
    document.getElementById('result-rounds').textContent = game3.settings.totalRounds;
    document.getElementById('result-targets').textContent = game3.stats.targetAppearances;
    document.getElementById('result-successful').textContent = game3.stats.correctTaps;
    document.getElementById('result-false-taps').textContent = game3.stats.falseTaps;
    document.getElementById('result-missed').textContent = game3.stats.missedTargets;
    document.getElementById('result-final-score').textContent = game3.stats.score;

    if (game3.stats.reactionTimes.length > 0) {
        const avgTime = Math.round(
            game3.stats.reactionTimes.reduce((a, b) => a + b, 0) / game3.stats.reactionTimes.length
        );
        const bestTime = Math.min(...game3.stats.reactionTimes);
        document.getElementById('result-avg-time').textContent = `${avgTime}ms`;
        document.getElementById('result-best-time').textContent = `${bestTime}ms`;
    } else {
        document.getElementById('result-avg-time').textContent = '-';
        document.getElementById('result-best-time').textContent = '-';
    }

    // Calculate accuracy
    const totalAttempts = game3.stats.correctTaps + game3.stats.falseTaps + game3.stats.missedTargets;
    const accuracy = totalAttempts > 0 ? (game3.stats.correctTaps / totalAttempts) * 100 : 0;

    // Determine performance rating
    const ratingElement = document.getElementById('performance-rating');
    let ratingClass, ratingText;

    if (accuracy >= 80 && game3.stats.score > game3.settings.totalRounds * 100) {
        ratingClass = 'excellent';
        ratingText = 'Performance: Excellent';
    } else if (accuracy >= 60 && game3.stats.score > 0) {
        ratingClass = 'good';
        ratingText = 'Performance: Good';
    } else {
        ratingClass = 'needs-improvement';
        ratingText = 'Performance: Needs Improvement';
    }

    // Add dynamic rotation info if enabled
    if (game3.dynamicRotation && game3.stats.targetChanges > 0) {
        ratingText += ` • ${game3.stats.targetChanges} Target Changes`;
    }

    // Add multi-target info if enabled
    if (game3.multiTargetMode) {
        ratingText += ' • Multi-Target Mode';
    }

    ratingElement.textContent = ratingText;
    ratingElement.className = `performance-rating ${ratingClass}`;
}

function updateGame3Status(message) {
    document.querySelector('#game3-status .status-message').textContent = message;
}

function updateGame3Stats() {
    document.getElementById('game3-round').textContent = `${game3.currentRound}/${game3.settings?.totalRounds || 0}`;
    document.getElementById('game3-score').textContent = game3.stats.score;
    document.getElementById('game3-streak').textContent = game3.stats.currentStreak;
    document.getElementById('game3-correct').textContent = game3.stats.correctTaps;
    document.getElementById('game3-false').textContent = game3.stats.falseTaps;
    document.getElementById('game3-missed').textContent = game3.stats.missedTargets;

    const totalAttempts = game3.stats.correctTaps + game3.stats.falseTaps + game3.stats.missedTargets;
    const accuracy = totalAttempts > 0 ? ((game3.stats.correctTaps / totalAttempts) * 100).toFixed(1) : 0;
    document.getElementById('game3-accuracy').textContent = `${accuracy}%`;

    if (game3.stats.reactionTimes.length > 0) {
        const avgTime = Math.round(
            game3.stats.reactionTimes.reduce((a, b) => a + b, 0) / game3.stats.reactionTimes.length
        );
        document.getElementById('game3-avg-time').textContent = `${avgTime}ms`;
    } else {
        document.getElementById('game3-avg-time').textContent = '0ms';
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
// GAME 4: PERIPHERAL NUMBER RECOGNITION
// ===========================

// Game 4 difficulty settings
const GAME4_SETTINGS = {
    easy: {
        minDelay: 2000,
        maxDelay: 5000,
        numberVisibility: 2000,
        responseWindow: 3000,
        totalRounds: 20,
        numberRange: { min: 1, max: 5 },
        peripheralDistance: '25%',
        fontSize: '4em',
        pointsCorrect: 100,
        pointsWrong: -20,
        pointsMissed: -30,
        speedBonusMultiplier: 0.5,
        directions: ['left', 'right'], // Only horizontal
        directionWeights: { left: 0.5, right: 0.5, top: 0, bottom: 0 }
    },
    medium: {
        minDelay: 1500,
        maxDelay: 3500,
        numberVisibility: 1200,
        responseWindow: 2000,
        totalRounds: 30,
        numberRange: { min: 1, max: 9 },
        peripheralDistance: '35%',
        fontSize: '3em',
        pointsCorrect: 150,
        pointsWrong: -40,
        pointsMissed: -50,
        speedBonusMultiplier: 1.0,
        directions: ['left', 'right', 'top', 'bottom'], // All directions
        directionWeights: { left: 0.35, right: 0.35, top: 0.15, bottom: 0.15 } // 70% horizontal, 30% vertical
    },
    hard: {
        minDelay: 500,
        maxDelay: 2500,
        numberVisibility: 700,
        responseWindow: 1500,
        totalRounds: 40,
        numberRange: { min: 0, max: 9 },
        peripheralDistance: '42%',
        fontSize: '2.5em',
        pointsCorrect: 200,
        pointsWrong: -60,
        pointsMissed: -80,
        speedBonusMultiplier: 1.5,
        directions: ['left', 'right', 'top', 'bottom'], // All directions
        directionWeights: { left: 0.25, right: 0.25, top: 0.25, bottom: 0.25 } // Equal distribution
    }
};

const game4 = {
    isActive: false,
    currentRound: 0,
    currentNumber: null,
    currentDirection: null,
    numberShownTime: null,
    settings: null,
    timeoutId: null,
    responseTimeoutId: null,
    stats: {
        correct: 0,
        wrong: 0,
        missed: 0,
        reactionTimes: [],
        score: 0,
        currentStreak: 0,
        bestStreak: 0,
        leftSide: { appearances: 0, correct: 0 },
        rightSide: { appearances: 0, correct: 0 },
        topSide: { appearances: 0, correct: 0 },
        bottomSide: { appearances: 0, correct: 0 }
    }
};

function startGame4() {
    if (game4.isActive) return;

    // Reset state
    game4.stats = {
        correct: 0,
        wrong: 0,
        missed: 0,
        reactionTimes: [],
        score: 0,
        currentStreak: 0,
        bestStreak: 0,
        leftSide: { appearances: 0, correct: 0 },
        rightSide: { appearances: 0, correct: 0 },
        topSide: { appearances: 0, correct: 0 },
        bottomSide: { appearances: 0, correct: 0 }
    };
    game4.currentRound = 0;
    game4.currentNumber = null;
    game4.currentDirection = null;

    // Get difficulty settings
    game4.settings = GAME4_SETTINGS[currentDifficulty];

    // Update peripheral distances and font sizes
    document.querySelector('.peripheral-left').style.left = game4.settings.peripheralDistance;
    document.querySelector('.peripheral-right').style.right = game4.settings.peripheralDistance;
    document.querySelector('.peripheral-top').style.top = game4.settings.peripheralDistance;
    document.querySelector('.peripheral-bottom').style.bottom = game4.settings.peripheralDistance;
    document.querySelectorAll('.peripheral-number').forEach(el => {
        el.style.fontSize = game4.settings.fontSize;
    });

    // Initialize keypad
    initializeGame4Keypad();

    // Update UI
    updateGame4Stats();
    document.getElementById('game4-results-panel').style.display = 'none';
    document.getElementById('game4-instructions').style.display = 'none';
    document.getElementById('game4-start').disabled = true;
    document.getElementById('game4-stop').disabled = false;
    document.getElementById('peripheral-zone').setAttribute('data-active', 'true');

    // Show countdown
    showGame4Countdown(() => {
        game4.isActive = true;
        speak('Game 4 starting. Keep your eyes on the center point');
        updateGame4Status('Focus on the center. Do not move your eyes!');
        nextGame4Round();
    });
}

function stopGame4() {
    game4.isActive = false;
    if (game4.timeoutId) clearTimeout(game4.timeoutId);
    if (game4.responseTimeoutId) clearTimeout(game4.responseTimeoutId);

    // Hide any visible numbers
    hidePeripheralNumbers();

    document.getElementById('game4-start').disabled = false;
    document.getElementById('game4-stop').disabled = true;
    document.getElementById('number-keypad').style.display = 'none';
    document.getElementById('peripheral-zone').setAttribute('data-active', 'false');
    document.getElementById('game4-instructions').style.display = 'block';

    speak('Game 4 stopped');
    updateGame4Status('Ready to start');
}

function initializeGame4Keypad() {
    const keypadButtons = document.getElementById('keypad-buttons');
    keypadButtons.innerHTML = '';

    const { min, max } = game4.settings.numberRange;

    for (let i = min; i <= max; i++) {
        const btn = document.createElement('button');
        btn.className = 'number-btn';
        btn.textContent = i;
        btn.dataset.number = i;
        btn.addEventListener('click', () => handleGame4NumberInput(i));
        keypadButtons.appendChild(btn);
    }
}

function showGame4Countdown(callback) {
    const zone = document.getElementById('peripheral-zone');
    const counts = ['3', '2', '1', 'GO!'];
    let index = 0;

    // Temporarily show countdown in center
    const countdownEl = document.createElement('div');
    countdownEl.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 5em;
        font-weight: bold;
        color: white;
        z-index: 100;
        text-shadow: 0 0 20px rgba(0, 0, 0, 0.8);
    `;
    zone.appendChild(countdownEl);

    function showNext() {
        if (index < counts.length) {
            countdownEl.textContent = counts[index];
            speak(counts[index] === 'GO!' ? 'Go' : counts[index]);
            playBeep(400 + (index * 100), 200);
            index++;
            setTimeout(showNext, 800);
        } else {
            countdownEl.remove();
            callback();
        }
    }

    showNext();
}

function nextGame4Round() {
    if (!game4.isActive) return;

    game4.currentRound++;

    // Check if game is complete
    if (game4.currentRound > game4.settings.totalRounds) {
        endGame4();
        return;
    }

    updateGame4Stats();

    // Ensure clean state before next round
    hidePeripheralNumbers();
    document.getElementById('number-keypad').style.display = 'none';

    // Disable all keypad buttons to prevent accidental clicks
    document.querySelectorAll('.number-btn').forEach(btn => {
        btn.disabled = true;
    });

    // Show "Get Ready" message
    updateGame4Status(`Round ${game4.currentRound}/${game4.settings.totalRounds} - Get ready...`);

    // Brief pause before starting (500ms) to let user reset
    setTimeout(() => {
        if (!game4.isActive) return;

        updateGame4Status(`Focus on center...`);

        // Random delay before showing number
        const delay = Math.random() * (game4.settings.maxDelay - game4.settings.minDelay) + game4.settings.minDelay;

        game4.timeoutId = setTimeout(() => {
            if (!game4.isActive) return;
            showPeripheralNumber();
        }, delay);
    }, 500);
}

function showPeripheralNumber() {
    // Generate random number within range
    const { min, max } = game4.settings.numberRange;
    game4.currentNumber = Math.floor(Math.random() * (max - min + 1)) + min;

    // Weighted random direction selection based on difficulty
    const directions = game4.settings.directions;
    const weights = game4.settings.directionWeights;

    // Create cumulative weight array
    const rand = Math.random();
    let cumulative = 0;
    let selectedDirection = directions[0];

    for (const dir of directions) {
        cumulative += weights[dir];
        if (rand <= cumulative) {
            selectedDirection = dir;
            break;
        }
    }

    game4.currentDirection = selectedDirection;

    // Track appearance by direction
    if (game4.currentDirection === 'left') {
        game4.stats.leftSide.appearances++;
    } else if (game4.currentDirection === 'right') {
        game4.stats.rightSide.appearances++;
    } else if (game4.currentDirection === 'top') {
        game4.stats.topSide.appearances++;
    } else if (game4.currentDirection === 'bottom') {
        game4.stats.bottomSide.appearances++;
    }

    // Display the number
    const elementId = `peripheral-${game4.currentDirection}`;
    const element = document.getElementById(elementId);
    element.textContent = game4.currentNumber;
    element.classList.add('visible');

    game4.numberShownTime = Date.now();

    // Play subtle beep
    playBeep(600, 100);

    // Hide number after visibility duration
    game4.timeoutId = setTimeout(() => {
        if (!game4.isActive) return;
        hidePeripheralNumbers();
        enableNumberInput();
    }, game4.settings.numberVisibility);
}

function hidePeripheralNumbers() {
    document.querySelectorAll('.peripheral-number').forEach(el => {
        el.classList.remove('visible');
        el.textContent = '';
    });
}

function enableNumberInput() {
    const keypad = document.getElementById('number-keypad');
    keypad.style.display = 'block';

    // Enable all buttons
    document.querySelectorAll('.number-btn').forEach(btn => {
        btn.disabled = false;
    });

    updateGame4Status('What number did you see?');

    // Set timeout for response window
    game4.responseTimeoutId = setTimeout(() => {
        if (!game4.isActive || keypad.style.display !== 'block') return;
        handleGame4Missed();
    }, game4.settings.responseWindow);
}

function handleGame4NumberInput(inputNumber) {
    if (!game4.isActive) return;

    clearTimeout(game4.responseTimeoutId);

    // Disable all buttons
    document.querySelectorAll('.number-btn').forEach(btn => {
        btn.disabled = true;
    });

    const reactionTime = Date.now() - game4.numberShownTime;

    if (inputNumber === game4.currentNumber) {
        // Correct answer
        game4.stats.correct++;
        game4.stats.currentStreak++;
        game4.stats.reactionTimes.push(reactionTime);

        // Track direction-specific performance
        if (game4.currentDirection === 'left') {
            game4.stats.leftSide.correct++;
        } else if (game4.currentDirection === 'right') {
            game4.stats.rightSide.correct++;
        } else if (game4.currentDirection === 'top') {
            game4.stats.topSide.correct++;
        } else if (game4.currentDirection === 'bottom') {
            game4.stats.bottomSide.correct++;
        }

        if (game4.stats.currentStreak > game4.stats.bestStreak) {
            game4.stats.bestStreak = game4.stats.currentStreak;
        }

        // Calculate points with speed bonus
        let points = game4.settings.pointsCorrect;
        const speedBonus = Math.floor(
            (game4.settings.responseWindow - reactionTime) / 10 * game4.settings.speedBonusMultiplier
        );
        points += Math.max(0, speedBonus);

        game4.stats.score += points;

        playBeep(1000, 200);
        speak('Correct');
        updateGame4Status(`Correct! +${points} points (${reactionTime}ms) - ${game4.currentDirection}`);
        flashCard('game4', 'correct');
    } else {
        // Wrong answer
        game4.stats.wrong++;
        game4.stats.currentStreak = 0;
        game4.stats.score += game4.settings.pointsWrong;

        playBeep(200, 400);
        speak('Wrong');
        updateGame4Status(`Wrong! ${game4.settings.pointsWrong} points - Correct answer was ${game4.currentNumber}`);
        flashCard('game4', 'wrong');
    }

    updateGame4Stats();

    // Next round after delay
    setTimeout(() => {
        if (game4.isActive) {
            nextGame4Round();
        }
    }, 1500);
}

function handleGame4Missed() {
    if (!game4.isActive) return;

    game4.stats.missed++;
    game4.stats.currentStreak = 0;
    game4.stats.score += game4.settings.pointsMissed;

    playBeep(150, 600);
    speak('Missed');
    updateGame4Status(`Missed! ${game4.settings.pointsMissed} points - Number was ${game4.currentNumber}`);
    flashCard('game4', 'missed');

    updateGame4Stats();

    // Next round after delay
    setTimeout(() => {
        if (game4.isActive) {
            nextGame4Round();
        }
    }, 1500);
}

function endGame4() {
    game4.isActive = false;
    document.getElementById('number-keypad').style.display = 'none';
    document.getElementById('peripheral-zone').setAttribute('data-active', 'false');
    document.getElementById('game4-stop').disabled = true;
    hidePeripheralNumbers();

    // Show results
    displayGame4Results();
    speak('Session complete');
}

function displayGame4Results() {
    const resultsPanel = document.getElementById('game4-results-panel');
    resultsPanel.style.display = 'block';

    // Populate basic results
    document.getElementById('game4-result-rounds').textContent = game4.settings.totalRounds;
    document.getElementById('game4-result-correct').textContent = game4.stats.correct;
    document.getElementById('game4-result-wrong').textContent = game4.stats.wrong;
    document.getElementById('game4-result-missed').textContent = game4.stats.missed;
    document.getElementById('game4-result-score').textContent = game4.stats.score;

    // Calculate accuracy
    const totalAttempts = game4.stats.correct + game4.stats.wrong + game4.stats.missed;
    const accuracy = totalAttempts > 0 ? ((game4.stats.correct / totalAttempts) * 100).toFixed(1) : 0;
    document.getElementById('game4-result-accuracy').textContent = `${accuracy}%`;

    // Reaction times
    if (game4.stats.reactionTimes.length > 0) {
        const avgTime = Math.round(
            game4.stats.reactionTimes.reduce((a, b) => a + b, 0) / game4.stats.reactionTimes.length
        );
        const bestTime = Math.min(...game4.stats.reactionTimes);
        document.getElementById('game4-result-avg-time').textContent = `${avgTime}ms`;
        document.getElementById('game4-result-best-time').textContent = `${bestTime}ms`;
    } else {
        document.getElementById('game4-result-avg-time').textContent = '-';
        document.getElementById('game4-result-best-time').textContent = '-';
    }

    // Directional bias analysis
    const leftAccuracy = game4.stats.leftSide.appearances > 0
        ? ((game4.stats.leftSide.correct / game4.stats.leftSide.appearances) * 100).toFixed(1)
        : 0;
    const rightAccuracy = game4.stats.rightSide.appearances > 0
        ? ((game4.stats.rightSide.correct / game4.stats.rightSide.appearances) * 100).toFixed(1)
        : 0;
    const topAccuracy = game4.stats.topSide.appearances > 0
        ? ((game4.stats.topSide.correct / game4.stats.topSide.appearances) * 100).toFixed(1)
        : 0;
    const bottomAccuracy = game4.stats.bottomSide.appearances > 0
        ? ((game4.stats.bottomSide.correct / game4.stats.bottomSide.appearances) * 100).toFixed(1)
        : 0;

    document.getElementById('left-accuracy').textContent = `${leftAccuracy}%`;
    document.getElementById('left-count').textContent = `(${game4.stats.leftSide.appearances} appearances)`;
    document.getElementById('right-accuracy').textContent = `${rightAccuracy}%`;
    document.getElementById('right-count').textContent = `(${game4.stats.rightSide.appearances} appearances)`;
    document.getElementById('top-accuracy').textContent = `${topAccuracy}%`;
    document.getElementById('top-count').textContent = `(${game4.stats.topSide.appearances} appearances)`;
    document.getElementById('bottom-accuracy').textContent = `${bottomAccuracy}%`;
    document.getElementById('bottom-count').textContent = `(${game4.stats.bottomSide.appearances} appearances)`;

    // Directional recommendation
    const recommendationEl = document.getElementById('side-recommendation');
    const directions = [
        { name: 'left', accuracy: parseFloat(leftAccuracy), appearances: game4.stats.leftSide.appearances },
        { name: 'right', accuracy: parseFloat(rightAccuracy), appearances: game4.stats.rightSide.appearances },
        { name: 'top', accuracy: parseFloat(topAccuracy), appearances: game4.stats.topSide.appearances },
        { name: 'bottom', accuracy: parseFloat(bottomAccuracy), appearances: game4.stats.bottomSide.appearances }
    ];

    // Filter out directions with no appearances
    const activeDirections = directions.filter(d => d.appearances > 0);

    if (activeDirections.length === 0) {
        recommendationEl.textContent = '';
        return;
    }

    // Find best and worst performing directions
    const sortedByAccuracy = [...activeDirections].sort((a, b) => b.accuracy - a.accuracy);
    const best = sortedByAccuracy[0];
    const worst = sortedByAccuracy[sortedByAccuracy.length - 1];
    const accuracyDiff = best.accuracy - worst.accuracy;

    // Calculate horizontal vs vertical performance
    const horizontalAvg = activeDirections
        .filter(d => d.name === 'left' || d.name === 'right')
        .reduce((sum, d) => sum + d.accuracy, 0) / activeDirections.filter(d => d.name === 'left' || d.name === 'right').length;

    const verticalAvg = activeDirections
        .filter(d => d.name === 'top' || d.name === 'bottom')
        .reduce((sum, d) => sum + d.accuracy, 0) / activeDirections.filter(d => d.name === 'top' || d.name === 'bottom').length;

    const hvDiff = Math.abs(horizontalAvg - verticalAvg);

    if (accuracyDiff > 20) {
        recommendationEl.textContent = `⚠️ Your ${worst.name} peripheral vision needs significant practice! (${worst.accuracy}% vs ${best.accuracy}% ${best.name})`;
        recommendationEl.style.color = '#ff9900';
    } else if (accuracyDiff > 10) {
        recommendationEl.textContent = `Your ${worst.name} side is weaker (${worst.accuracy}%). Focus more training on that direction.`;
        recommendationEl.style.color = '#ffcc00';
    } else if (hvDiff > 15 && !isNaN(verticalAvg)) {
        const weaker = horizontalAvg < verticalAvg ? 'horizontal (left/right)' : 'vertical (top/bottom)';
        recommendationEl.textContent = `Your ${weaker} peripheral awareness needs more practice.`;
        recommendationEl.style.color = '#ffcc00';
    } else {
        recommendationEl.textContent = '✓ Excellent! Your peripheral vision is well balanced across all directions.';
        recommendationEl.style.color = '#00cc66';
    }

    // Performance rating
    const ratingElement = document.getElementById('game4-performance-rating');
    let ratingClass, ratingText;

    if (parseFloat(accuracy) >= 80 && game4.stats.score > game4.settings.totalRounds * 100) {
        ratingClass = 'excellent';
        ratingText = 'Performance: Excellent - Elite Peripheral Awareness';
    } else if (parseFloat(accuracy) >= 60 && game4.stats.score > 0) {
        ratingClass = 'good';
        ratingText = 'Performance: Good - Solid Peripheral Recognition';
    } else {
        ratingClass = 'needs-improvement';
        ratingText = 'Performance: Needs Improvement - Keep Training';
    }

    ratingElement.textContent = ratingText;
    ratingElement.className = `performance-rating ${ratingClass}`;
}

function updateGame4Status(message) {
    document.querySelector('#game4-status .status-message').textContent = message;
}

function updateGame4Stats() {
    document.getElementById('game4-round').textContent = `${game4.currentRound}/${game4.settings?.totalRounds || 0}`;
    document.getElementById('game4-score').textContent = game4.stats.score;
    document.getElementById('game4-correct').textContent = game4.stats.correct;
    document.getElementById('game4-wrong').textContent = game4.stats.wrong;
    document.getElementById('game4-missed').textContent = game4.stats.missed;
    document.getElementById('game4-streak').textContent = game4.stats.currentStreak;

    const totalAttempts = game4.stats.correct + game4.stats.wrong + game4.stats.missed;
    const accuracy = totalAttempts > 0 ? ((game4.stats.correct / totalAttempts) * 100).toFixed(1) : 0;
    document.getElementById('game4-accuracy').textContent = `${accuracy}%`;

    if (game4.stats.reactionTimes.length > 0) {
        const avgTime = Math.round(
            game4.stats.reactionTimes.reduce((a, b) => a + b, 0) / game4.stats.reactionTimes.length
        );
        document.getElementById('game4-avg-time').textContent = `${avgTime}ms`;
    } else {
        document.getElementById('game4-avg-time').textContent = '0ms';
    }
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
            if (game3.isActive) {
                stopGame3();
            }
            if (game4.isActive) {
                stopGame4();
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

    // Game 3 controls
    document.getElementById('game3-start').addEventListener('click', startGame3);
    document.getElementById('game3-stop').addEventListener('click', stopGame3);

    // Initialize Game 3 colors
    initializeGame3Colors();

    // Multi-target mode toggle
    document.getElementById('multi-target-mode').addEventListener('change', (e) => {
        const isMulti = e.target.checked;

        // Clear current selections if switching from multi to single with multiple selected
        if (!isMulti && game3.selectedColors.length > 1) {
            game3.selectedColors = [];
            document.querySelectorAll('.color-option.selected').forEach(btn => {
                btn.classList.remove('selected');
            });
            updateTargetDisplay();
        }

        speak(isMulti ? 'Multi target mode enabled' : 'Single target mode');
        playBeep(500, 150);
    });

    // Dynamic rotation toggle
    document.getElementById('dynamic-rotation').addEventListener('change', (e) => {
        speak(e.target.checked ? 'Dynamic rotation enabled' : 'Dynamic rotation disabled');
        playBeep(500, 150);
    });

    // Update colors when difficulty changes
    document.getElementById('difficulty-select').addEventListener('change', () => {
        if (document.getElementById('game3').classList.contains('active')) {
            game3.selectedColors = [];
            initializeGame3Colors();
            updateTargetDisplay();
        }
    });

    // Tap zone interactions
    const tapZone = document.getElementById('tap-zone');

    tapZone.addEventListener('click', () => {
        if (game3.isActive && tapZone.getAttribute('data-enabled') === 'true') {
            handleGame3Tap();
        }
    });

    tapZone.addEventListener('touchstart', (e) => {
        if (game3.isActive && tapZone.getAttribute('data-enabled') === 'true') {
            e.preventDefault();
            handleGame3Tap();
        }
    }, { passive: false });

    // Keyboard support for Game 3 (spacebar to tap)
    document.addEventListener('keydown', (e) => {
        if (!game3.isActive) return;
        if (e.key === ' ' && tapZone.getAttribute('data-enabled') === 'true') {
            e.preventDefault();
            handleGame3Tap();
        }
    });

    // Game 4 controls
    document.getElementById('game4-start').addEventListener('click', startGame4);
    document.getElementById('game4-stop').addEventListener('click', stopGame4);

    // ===========================
    // GAME GUIDE MODAL SYSTEM
    // ===========================

    const guideModal = document.getElementById('guide-modal');
    const guideBody = document.getElementById('guide-body');
    const guideCloseBtn = document.getElementById('guide-close-btn');

    // Guide content for all games
    const guideContent = {
        game1: `
            <h2>🎯 Game 1: Left/Right Buzzer</h2>

            <h3>Game Objective</h3>
            <p>Train your reaction speed and directional awareness by pressing the correct buzzer (left or right) as quickly as possible when called out.</p>

            <h3>How to Play</h3>
            <ol>
                <li><strong>Select Difficulty:</strong> Choose Easy, Medium, or Hard from the dropdown menu</li>
                <li><strong>Start Training:</strong> Click the "Start Training" button</li>
                <li><strong>Listen & React:</strong> You'll hear a voice say "LEFT" or "RIGHT"</li>
                <li><strong>Press the Buzzer:</strong> Quickly press the corresponding buzzer button</li>
                <li><strong>Track Your Stats:</strong> Monitor your correct/wrong/missed responses and reaction times</li>
            </ol>

            <h3>Controls</h3>
            <ul>
                <li><strong>Mouse/Touch:</strong> Click or tap the buzzer buttons</li>
                <li><strong>Keyboard:</strong> Left Arrow or 'A' for left buzzer, Right Arrow or 'D' for right buzzer</li>
            </ul>

            <h3>Difficulty Levels</h3>
            <table class="difficulty-table">
                <tr>
                    <th>Difficulty</th>
                    <th>Delay Range</th>
                    <th>Response Window</th>
                </tr>
                <tr>
                    <td><strong>Easy</strong></td>
                    <td>3-5 seconds</td>
                    <td>More forgiving</td>
                </tr>
                <tr>
                    <td><strong>Medium</strong></td>
                    <td>2-4 seconds</td>
                    <td>Balanced challenge</td>
                </tr>
                <tr>
                    <td><strong>Hard</strong></td>
                    <td>1-3 seconds</td>
                    <td>Requires elite reflexes</td>
                </tr>
            </table>

            <div class="guide-tip">
                <strong>Training Tips:</strong>
                <ul>
                    <li>Stay focused and anticipate the callout</li>
                    <li>Position your hands ready over both buzzers</li>
                    <li>Don't guess - wait for the actual callout</li>
                    <li>Track your average reaction time and try to improve it</li>
                    <li>Start with Easy mode to build consistency</li>
                </ul>
            </div>

            <h3>Scoring</h3>
            <ul>
                <li><strong>Correct:</strong> Press the right buzzer within the time limit</li>
                <li><strong>Wrong:</strong> Press the wrong buzzer</li>
                <li><strong>Missed:</strong> Don't respond in time</li>
            </ul>
        `,

        game2: `
            <h2>⚡ Game 2: Ball Drop Catch</h2>

            <h3>Game Objective</h3>
            <p>Physical reaction training! Drop a real ball and catch it with the hand (or hands) called out. This trains hand-eye coordination and selective hand response.</p>

            <h3>How to Play</h3>
            <ol>
                <li><strong>Customize Timing:</strong> Set your preferred delay time for each difficulty level (5-30 seconds)</li>
                <li><strong>Select Difficulty:</strong> Choose Easy, Medium, or Hard</li>
                <li><strong>Prepare:</strong> Hold a ball in your hands above waist height</li>
                <li><strong>Start Training:</strong> Click "Start Training" and get ready</li>
                <li><strong>Listen for Callout:</strong> You'll hear "LEFT", "RIGHT", or "BOTH HANDS"</li>
                <li><strong>Drop & Catch:</strong> Drop the ball and catch it with the specified hand(s)</li>
                <li><strong>Confirm:</strong> Tap the green zone or press spacebar once you've caught it</li>
            </ol>

            <h3>Controls</h3>
            <ul>
                <li><strong>Mouse/Touch:</strong> Tap the green "Tap Here After Catching" zone</li>
                <li><strong>Keyboard:</strong> Spacebar or Enter key</li>
            </ul>

            <h3>Difficulty Levels</h3>
            <table class="difficulty-table">
                <tr>
                    <th>Difficulty</th>
                    <th>Default Delay</th>
                    <th>Both Hands Frequency</th>
                </tr>
                <tr>
                    <td><strong>Easy</strong></td>
                    <td>15 seconds</td>
                    <td>0% (Left/Right only)</td>
                </tr>
                <tr>
                    <td><strong>Medium</strong></td>
                    <td>11 seconds</td>
                    <td>10% chance</td>
                </tr>
                <tr>
                    <td><strong>Hard</strong></td>
                    <td>7 seconds</td>
                    <td>30% chance</td>
                </tr>
            </table>

            <div class="guide-warning">
                <strong>Important:</strong> This is a physical training exercise! Make sure you're in a safe space with enough room to drop and catch a ball. Use a soft ball to avoid injury or damage.
            </div>

            <div class="guide-tip">
                <strong>Training Tips:</strong>
                <ul>
                    <li>Use a tennis ball or similar soft ball</li>
                    <li>Stand in a clear area with good lighting</li>
                    <li>Keep the ball at chest height before dropping</li>
                    <li>Stay relaxed and react naturally to the callout</li>
                    <li>On "BOTH HANDS", catch with both hands simultaneously</li>
                    <li>Adjust the delay times to match your preferred training pace</li>
                </ul>
            </div>

            <h3>Customization</h3>
            <p>You can customize the delay time for each difficulty level between 5-30 seconds. This allows you to tailor the training to your preference and gradually increase difficulty as you improve.</p>
        `,

        game3: `
            <h2>🎨 Game 3: Random Screen Tap</h2>

            <h3>Game Objective</h3>
            <p>Train selective attention and impulse control! The screen flashes different colors rapidly. You must tap ONLY when your target color(s) appear, and avoid tapping on other colors.</p>

            <h3>How to Play</h3>
            <ol>
                <li><strong>Select Target Color(s):</strong> Choose which color(s) you should tap on (at least one required)</li>
                <li><strong>Choose Game Mode:</strong>
                    <ul>
                        <li><strong>Normal Mode:</strong> Each round shows one color at a time</li>
                        <li><strong>Burst Mode:</strong> Multiple rapid flashes in succession - stay focused!</li>
                    </ul>
                </li>
                <li><strong>Set Rounds:</strong> Choose how many rounds you want to play (10-100)</li>
                <li><strong>Select Difficulty:</strong> Choose Easy, Medium, or Hard</li>
                <li><strong>Start Training:</strong> The screen will begin flashing colors</li>
                <li><strong>React Correctly:</strong>
                    <ul>
                        <li>Tap when you see your target color</li>
                        <li>DO NOT tap on other colors</li>
                        <li>In Burst Mode, react to each flash independently</li>
                    </ul>
                </li>
            </ol>

            <h3>Controls</h3>
            <ul>
                <li><strong>Mouse/Touch:</strong> Click or tap anywhere on the colored screen area</li>
                <li><strong>Keyboard:</strong> Spacebar</li>
            </ul>

            <h3>Difficulty Levels</h3>
            <table class="difficulty-table">
                <tr>
                    <th>Difficulty</th>
                    <th>Flash Duration</th>
                    <th>Between Flashes</th>
                    <th>Challenge</th>
                </tr>
                <tr>
                    <td><strong>Easy</strong></td>
                    <td>1000ms (1s)</td>
                    <td>800ms</td>
                    <td>Comfortable timing</td>
                </tr>
                <tr>
                    <td><strong>Medium</strong></td>
                    <td>700ms</td>
                    <td>500ms</td>
                    <td>Requires focus</td>
                </tr>
                <tr>
                    <td><strong>Hard</strong></td>
                    <td>400ms</td>
                    <td>300ms</td>
                    <td>Extremely fast reactions</td>
                </tr>
            </table>

            <h3>Game Modes</h3>
            <h4>Normal Mode</h4>
            <p>Colors appear one at a time with pauses in between. Good for learning and building accuracy.</p>

            <h4>Burst Mode</h4>
            <p>Multiple colors flash in rapid succession (3-7 flashes per burst). Much more challenging! Tests your ability to react to each individual flash correctly.</p>

            <div class="guide-tip">
                <strong>Training Tips:</strong>
                <ul>
                    <li>Start by selecting just one target color to build confidence</li>
                    <li>Gradually add more target colors to increase difficulty</li>
                    <li>In Burst Mode, stay calm and react to each flash independently</li>
                    <li>Focus on accuracy over speed - wrong taps hurt your score!</li>
                    <li>Track your accuracy percentage and aim for 90%+ on your target colors</li>
                    <li>Use shorter rounds (10-20) for intense training sessions</li>
                </ul>
            </div>

            <h3>Scoring</h3>
            <ul>
                <li><strong>Correct Tap:</strong> Tap when target color appears</li>
                <li><strong>Wrong Tap:</strong> Tap when non-target color appears</li>
                <li><strong>Missed:</strong> Fail to tap when target color appears</li>
                <li><strong>Correct Ignore:</strong> Don't tap when non-target color appears (good!)</li>
            </ul>

            <h3>Available Colors</h3>
            <p><strong>Easy/Medium:</strong> Red, Green, Blue, Yellow</p>
            <p><strong>Hard:</strong> Red, Green, Blue, Yellow, Purple, Orange</p>
        `,

        game4: `
            <h2>👁️ Game 4: Peripheral Number Recognition</h2>

            <h3>Game Objective</h3>
            <p>Train your peripheral vision awareness! Keep your eyes locked on the center focus point while identifying numbers that briefly flash in your peripheral vision (left, right, top, or bottom). This mimics how F1 drivers monitor their surroundings while focusing ahead.</p>

            <div class="guide-warning">
                <strong>Critical Rule:</strong> You MUST keep your eyes on the center red dot at all times! Do NOT move your eyes to look at the numbers. Use only your peripheral vision to detect and identify them.
            </div>

            <h3>How to Play</h3>
            <ol>
                <li><strong>Select Difficulty:</strong> Choose Easy, Medium, or Hard</li>
                <li><strong>Start Training:</strong> Click "Start Training" - you'll see a countdown</li>
                <li><strong>Focus on Center:</strong> Keep your eyes locked on the pulsing red center dot</li>
                <li><strong>Wait for Number:</strong> After a random delay, a number will flash briefly on left, right, top, or bottom (depending on difficulty)</li>
                <li><strong>Identify Number:</strong> Use your peripheral vision to see what number it was</li>
                <li><strong>Enter Response:</strong> After the number disappears, a keypad appears - select the number you saw</li>
                <li><strong>Next Round:</strong> After a brief pause, the next round begins</li>
            </ol>

            <h3>Controls</h3>
            <ul>
                <li><strong>Mouse/Touch:</strong> Tap the number buttons on the keypad</li>
                <li><strong>Keyboard:</strong> Press the number keys (0-9 depending on difficulty)</li>
            </ul>

            <h3>Difficulty Levels</h3>
            <table class="difficulty-table">
                <tr>
                    <th>Level</th>
                    <th>Numbers</th>
                    <th>Visible</th>
                    <th>Response</th>
                    <th>Rounds</th>
                    <th>Directions</th>
                </tr>
                <tr>
                    <td><strong>Easy</strong></td>
                    <td>1-5</td>
                    <td>2 sec</td>
                    <td>3 sec</td>
                    <td>20</td>
                    <td>Left/Right only</td>
                </tr>
                <tr>
                    <td><strong>Medium</strong></td>
                    <td>1-9</td>
                    <td>1.2 sec</td>
                    <td>2 sec</td>
                    <td>30</td>
                    <td>All 4 (70% horizontal, 30% vertical)</td>
                </tr>
                <tr>
                    <td><strong>Hard</strong></td>
                    <td>0-9</td>
                    <td>0.7 sec</td>
                    <td>1.5 sec</td>
                    <td>40</td>
                    <td>All 4 (equal distribution)</td>
                </tr>
            </table>

            <div class="guide-section">
                <h4>Progressive Direction Training</h4>
                <p><strong>Easy Mode:</strong> Master horizontal peripheral vision first with left/right only. Numbers appear closer (25%) and stay visible longer.</p>
                <p><strong>Medium Mode:</strong> Introduces vertical awareness (top/bottom) with 70% horizontal and 30% vertical distribution. Numbers further out (35%).</p>
                <p><strong>Hard Mode:</strong> Full 360° peripheral training with equal distribution across all four directions. Numbers at far edges (42%).</p>
            </div>

            <h3>Scoring System</h3>
            <ul>
                <li><strong>Correct:</strong> Base points + speed bonus for fast responses</li>
                <li><strong>Wrong:</strong> Points penalty - but you still tried!</li>
                <li><strong>Missed:</strong> Larger penalty for not responding in time</li>
                <li><strong>Streak Bonus:</strong> Consecutive correct answers build your streak</li>
            </ul>

            <h3>Directional Performance Analysis</h3>
            <p>After completing a session, you'll see detailed analysis of your peripheral performance across all directions:</p>
            <ul>
                <li><strong>Left Accuracy:</strong> How well you detect numbers on the left</li>
                <li><strong>Right Accuracy:</strong> How well you detect numbers on the right</li>
                <li><strong>Top Accuracy:</strong> How well you detect numbers above (Medium/Hard only)</li>
                <li><strong>Bottom Accuracy:</strong> How well you detect numbers below (Medium/Hard only)</li>
                <li><strong>Smart Recommendations:</strong> Get targeted advice on your weakest direction or horizontal vs vertical imbalance</li>
            </ul>

            <div class="guide-tip">
                <strong>Training Tips:</strong>
                <ul>
                    <li><strong>Maintain Center Focus:</strong> This is the most important rule! Keep your eyes on the red dot</li>
                    <li><strong>Relax Your Vision:</strong> Don't strain. Let your peripheral vision naturally pick up the numbers</li>
                    <li><strong>Start with Easy:</strong> Build confidence with horizontal (left/right) awareness first</li>
                    <li><strong>Progress to Medium:</strong> Once you master horizontal, add vertical (top/bottom) awareness</li>
                    <li><strong>Master Hard Mode:</strong> Full 360° peripheral training with equal difficulty in all directions</li>
                    <li><strong>Practice Consistently:</strong> Peripheral awareness improves significantly with regular training</li>
                    <li><strong>Track Your Progress:</strong> Watch your directional analysis - aim for balanced performance across all directions</li>
                    <li><strong>Don't Rush:</strong> Accuracy is more important than speed</li>
                    <li><strong>Vertical is Harder:</strong> Most people find top/bottom peripheral vision more challenging than left/right</li>
                </ul>
            </div>

            <div class="guide-warning">
                <strong>Common Mistakes to Avoid:</strong>
                <ul>
                    <li>Moving your eyes to look at the numbers (defeats the purpose!)</li>
                    <li>Guessing when you didn't see the number clearly</li>
                    <li>Not taking breaks - peripheral training can be mentally fatiguing</li>
                    <li>Starting on Hard mode before mastering Easy/Medium</li>
                </ul>
            </div>

            <h3>Real-World Application</h3>
            <p>F1 drivers must maintain focus on the track ahead while simultaneously monitoring competitors beside them, pit boards, marshal flags, and track conditions in their peripheral vision. This game trains that exact skill!</p>
        `
    };

    // Open guide modal
    function openGuide(gameName) {
        if (guideContent[gameName]) {
            guideBody.innerHTML = guideContent[gameName];
            guideModal.classList.add('active');
            speak('Opening game guide');
        }
    }

    // Close guide modal
    function closeGuide() {
        guideModal.classList.remove('active');
        speak('Closing guide');
    }

    // Event listeners for guide buttons
    document.querySelectorAll('.guide-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const gameName = btn.getAttribute('data-guide');
            openGuide(gameName);
        });
    });

    // Close button
    guideCloseBtn.addEventListener('click', closeGuide);

    // Close when clicking outside modal content
    guideModal.addEventListener('click', (e) => {
        if (e.target === guideModal) {
            closeGuide();
        }
    });

    // Close with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && guideModal.classList.contains('active')) {
            closeGuide();
        }
    });

    // Initialize audio on first user interaction
    document.body.addEventListener('click', initAudio, { once: true });

    // Welcome message
    speak('F1 Reaction Training Drill loaded. Select a game to begin.');
});
