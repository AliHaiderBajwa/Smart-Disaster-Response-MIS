const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ 
            error: 'Access denied. No token provided.' 
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Now every route can access req.user
        next();
    } catch (err) {
        return res.status(401).json({ 
            error: 'Invalid or expired token. Please login again.' 
        });
    }
}

module.exports = verifyToken;