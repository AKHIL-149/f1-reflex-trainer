# 🏎️ F1 Reaction Training Drill

A web-based training application designed to improve reaction speed, directional response, hand-eye coordination, and focus - just like F1 driver reflex training.

## Features

### Two Training Games

#### Game 1: Left/Right Buzzer Callout
- System randomly calls out "Left" or "Right"
- React by pressing/clicking the correct buzzer
- Unpredictable timing keeps you alert
- Tracks accuracy and reaction times

#### Game 2: Ball Drop Catch on Callout
- Hold a ball and wait for the callout
- When you hear "Drop" (or variations), drop and catch the ball
- Report whether you caught or missed it
- Trains reflexes and anticipation control

### Key Features
- **Voice Callouts**: Clear audio speech synthesis
- **Audio Cues**: Beep sounds for different events
- **Random Delays**: Unpredictable timing between 1-5 seconds based on difficulty
- **Three Difficulty Levels**:
  - Easy: 3-5 second delays
  - Medium: 2-4 second delays
  - Hard: 1-3 second delays
- **Comprehensive Stats Tracking**:
  - Attempts/Rounds
  - Correct/Wrong/Missed counts
  - Reaction times (average and last)
  - Success rates

## How to Use

### Setup
1. Open `index.html` in a modern web browser (Chrome, Firefox, Safari, Edge)
2. Make sure your browser has audio permissions enabled
3. For best experience, use in a quiet environment with good speakers/headphones

### Playing Game 1: Left/Right Buzzer
1. Select your desired difficulty level at the top
2. Click "Start Game 1"
3. Wait for the voice callout
4. When you hear "Left" or "Right", quickly press the corresponding buzzer
5. You can use:
   - Mouse clicks on the buzzers
   - Keyboard: Left Arrow or 'A' for left, Right Arrow or 'D' for right
6. Try to respond as quickly and accurately as possible
7. Click "Stop" when you want to end the session

### Playing Game 2: Ball Drop Catch
1. Select your desired difficulty level at the top
2. Get a ball (tennis ball, stress ball, or similar)
3. Click "Start Game 2"
4. Hold the ball and wait for the callout
5. When you hear "Drop", "Drop and Catch", "Release", etc.:
   - Drop the ball
   - Try to catch it as fast as possible
6. Report the result:
   - Click "✓ Caught" if you caught it
   - Click "✗ Missed" if you dropped it
7. You can use keyboard shortcuts:
   - 'C' or Space for Caught
   - 'M' or 'X' for Missed
8. Click "Stop" when you want to end the session

## Training Tips

### For Best Results
1. **Warm Up**: Start with Easy difficulty for a few rounds
2. **Stay Alert**: Don't try to predict the timing - react to the callout
3. **Focus**: Minimize distractions in your environment
4. **Regular Practice**: Short, focused sessions daily are better than long sporadic ones
5. **Track Progress**: Monitor your average reaction times and accuracy over time
6. **Challenge Yourself**: Gradually increase difficulty as you improve

### Game 1 Strategies
- Keep both hands ready over the buzzers
- Don't pre-commit to either direction
- Focus on the audio callout, not visual cues
- Try to beat your average reaction time

### Game 2 Strategies
- Hold the ball loosely but securely
- Stay relaxed but alert
- Focus on the catch, not just the drop
- Practice catching at different heights

## Browser Compatibility

Works best in:
- Chrome/Edge (latest versions)
- Firefox (latest versions)
- Safari (latest versions)

### Requirements
- JavaScript enabled
- Web Audio API support
- Web Speech API support (for voice callouts)

## Technical Details

### Files
- `index.html` - Main application structure
- `styles.css` - F1-themed styling and animations
- `script.js` - Game logic, audio, and speech synthesis

### Features Implementation
- **Random Delays**: Uses `Math.random()` with difficulty-based ranges
- **Voice Synthesis**: Web Speech API (`speechSynthesis`)
- **Audio Cues**: Web Audio API with oscillators for beep sounds
- **Response Timeout**: 3-second window for Game 1, 5-second window for Game 2
- **Statistics**: Real-time calculation of averages and percentages

## Customization

You can modify the difficulty settings in `script.js`:

```javascript
const DIFFICULTY_SETTINGS = {
    easy: { min: 3000, max: 5000 },    // milliseconds
    medium: { min: 2000, max: 4000 },
    hard: { min: 1000, max: 3000 }
};
```

## Troubleshooting

### No Voice Callouts
- Check browser audio permissions
- Ensure volume is turned up
- Some browsers may block speech synthesis on first load - click anywhere on the page to activate

### Audio Not Working
- Click on the page to initialize audio context (required by browsers)
- Check system volume and browser audio settings

### Keyboard Shortcuts Not Working
- Make sure the page has focus (click on it)
- Check that no other extensions are intercepting key presses

## Training Like F1 Drivers

F1 drivers train their reflexes constantly. This drill simulates:
- **Unpredictable Situations**: Like sudden track changes or incidents
- **Split-Second Decisions**: Left or right direction choices
- **Hand-Eye Coordination**: Physical response to audio cues
- **Sustained Focus**: Maintaining alertness over multiple rounds
- **Reaction Time Optimization**: Every millisecond counts

## License

Free to use and modify for personal training purposes.

---

**Stay focused. React fast. Train like a champion. 🏎️💨**
