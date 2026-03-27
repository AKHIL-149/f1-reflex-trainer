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

    // Initialize audio on first user interaction
    document.body.addEventListener('click', initAudio, { once: true });

    // Welcome message
    speak('F1 Reaction Training Drill loaded. Select a game to begin.');
});
