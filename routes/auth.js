const express = require('express');
const router = express.Router();
const { getPool, sql } = require('../config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { asyncHandler } = require('../utils/routeHelpers');

// POST /api/auth/login
router.post('/login', asyncHandler(async (req, res) => {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ 
                error: 'Email and password are required.' 
            });
        }

        const pool = await getPool();

        // Find user by email
        const result = await pool.request()
            .input('Email', sql.NVarChar(150), email)
            .query('SELECT u.*, r.RoleName FROM Users u JOIN Roles r ON u.RoleID = r.RoleID WHERE u.Email = @Email AND u.IsActive = 1');

        const user = result.recordset[0];

        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        // Check password
        const storedPassword = user.PasswordHash || '';
        const isBcryptHash = storedPassword.startsWith('$2a$') || storedPassword.startsWith('$2b$') || storedPassword.startsWith('$2y$');
        const passwordMatches = isBcryptHash
            ? await bcrypt.compare(password, storedPassword)
            : storedPassword === password;

        if (!passwordMatches) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        // Create JWT token
        const token = jwt.sign(
            {
                userID:   user.UserID,
                roleID:   user.RoleID,
                roleName: user.RoleName,
                email:    user.Email,
                fullName: user.FullName
            },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({
            message: 'Login successful!',
            token,
            user: {
                userID:   user.UserID,
                fullName: user.FullName,
                email:    user.Email,
                role:     user.RoleName,
                roleID:   user.RoleID
            }
        });
}));

module.exports = router;
