const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get(['/', '/api'], (req, res) => {
    res.json({ 
        message: '🚀 Disaster MIS Backend is running!',
        status: 'OK',
        timestamp: new Date()
    });
});

// ── Routes ──────────────────────────────────────────
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/reports',   require('./routes/reports'));
app.use('/api/teams',     require('./routes/teams'));
app.use('/api/resources', require('./routes/resources'));
app.use('/api/hospitals', require('./routes/hospitals'));
app.use('/api/financial', require('./routes/financial'));
app.use('/api/approvals', require('./routes/approvals'));
app.use('/api/mis',       require('./routes/mis'));

// Global error handler
app.use((err, req, res, next) => {
    const status = err.number && err.number >= 50000 ? 400 : err.status || 500;
    console.error('Error:', err.message);
    res.status(status).json({ error: err.message || 'Something went wrong.' });
});

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
}

module.exports = app;
