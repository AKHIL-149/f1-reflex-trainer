const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname)));

// Route for main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server with error handling
const server = app.listen(PORT, () => {
    console.log(`🏎️  F1 Reaction Training Drill running on port ${PORT}`);
    console.log(`   Open http://localhost:${PORT} in your browser`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use.`);
        console.log(`\nOptions:`);
        console.log(`1. Stop the process using port ${PORT}`);
        console.log(`2. Use a different port: PORT=3001 npm start`);
        console.log(`3. Or just open index.html directly in your browser (no server needed)\n`);
        process.exit(1);
    } else {
        throw err;
    }
});
