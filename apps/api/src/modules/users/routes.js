const express = require('express');
const bcrypt = require('bcrypt');
const prisma = require('../lib/prisma');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /users
router.get('/', authenticate, authorize('users.manage'), async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, email: true, fullName: true, role: true, isActive: true, createdAt: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ users });
    } catch (err) {
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
    }
});

// POST /users
router.post('/', authenticate, authorize('users.manage'), async (req, res) => {
    try {
        const { email, password, fullName, role } = req.body;
        if (!email || !password || !fullName) {
            return res.status(400).json({ error: { code: 'VALIDATION', message: 'Email, password, and name required' } });
        }
        const hash = await bcrypt.hash(password, 12);
        const user = await prisma.user.create({
            data: { email, passwordHash: hash, fullName, role: role || 'cashier' },
            select: { id: true, email: true, fullName: true, role: true, isActive: true, createdAt: true }
        });
        res.status(201).json({ user });
    } catch (err) {
        if (err.code === 'P2002') {
            return res.status(409).json({ error: { code: 'DUPLICATE', message: 'Email already exists' } });
        }
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
    }
});

// PATCH /users/:id
router.patch('/:id', authenticate, authorize('users.manage'), async (req, res) => {
    try {
        const { fullName, role, isActive } = req.body;
        const data = {};
        if (fullName !== undefined) data.fullName = fullName;
        if (role !== undefined) data.role = role;
        if (isActive !== undefined) data.isActive = isActive;
        const user = await prisma.user.update({
            where: { id: req.params.id },
            data,
            select: { id: true, email: true, fullName: true, role: true, isActive: true }
        });
        res.json({ user });
    } catch (err) {
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
    }
});

module.exports = router;
