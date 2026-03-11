const express = require('express');
const bcrypt = require('bcrypt');
const prisma = require('../lib/prisma');
const { generateToken, authenticate } = require('../middleware/auth');

const router = express.Router();

// POST /auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: { code: 'VALIDATION', message: 'Email and password required' } });
        }
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.isActive) {
            return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' } });
        }
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
            return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' } });
        }
        const token = generateToken(user);
        res.json({
            token,
            user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role }
        });
    } catch (err) {
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
    }
});

// GET /auth/me
router.get('/me', authenticate, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { id: true, email: true, fullName: true, role: true, isActive: true, createdAt: true }
        });
        res.json({ user });
    } catch (err) {
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
    }
});

module.exports = router;
