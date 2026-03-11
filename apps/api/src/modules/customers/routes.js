const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /customers
router.get('/', authenticate, async (req, res) => {
    try {
        const { page = 1, limit = 20, search } = req.query;
        const where = {};
        if (search) {
            where.OR = [
                { fullName: { contains: search } },
                { phone: { contains: search } },
                { email: { contains: search } }
            ];
        }
        const [customers, total] = await Promise.all([
            prisma.customer.findMany({
                where,
                include: { _count: { select: { orders: true } } },
                skip: (parseInt(page) - 1) * parseInt(limit),
                take: parseInt(limit),
                orderBy: { createdAt: 'desc' }
            }),
            prisma.customer.count({ where })
        ]);
        res.json({ customers, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) } });
    } catch (err) {
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
    }
});

// POST /customers
router.post('/', authenticate, async (req, res) => {
    try {
        const { fullName, phone, email, address, dateOfBirth } = req.body;
        if (!fullName || !phone) {
            return res.status(400).json({ error: { code: 'VALIDATION', message: 'Name and phone required' } });
        }
        const customer = await prisma.customer.create({
            data: { fullName, phone, email, address, dateOfBirth }
        });
        res.status(201).json({ customer });
    } catch (err) {
        if (err.code === 'P2002') {
            return res.status(409).json({ error: { code: 'DUPLICATE', message: 'Phone number already exists' } });
        }
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
    }
});

// PATCH /customers/:id
router.patch('/:id', authenticate, async (req, res) => {
    try {
        const { fullName, phone, email, address, dateOfBirth } = req.body;
        const data = {};
        if (fullName !== undefined) data.fullName = fullName;
        if (phone !== undefined) data.phone = phone;
        if (email !== undefined) data.email = email;
        if (address !== undefined) data.address = address;
        if (dateOfBirth !== undefined) data.dateOfBirth = dateOfBirth;
        const customer = await prisma.customer.update({ where: { id: req.params.id }, data });
        res.json({ customer });
    } catch (err) {
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
    }
});

// GET /customers/:id
router.get('/:id', authenticate, async (req, res) => {
    try {
        const customer = await prisma.customer.findUnique({
            where: { id: req.params.id },
            include: {
                orders: {
                    include: { payment: { select: { method: true } } },
                    orderBy: { createdAt: 'desc' },
                    take: 10
                },
                loyaltyPoints: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });
        if (!customer) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Customer not found' } });

        const loyaltyBalance = customer.loyaltyPoints.length > 0 ? customer.loyaltyPoints[0].balance : 0;
        res.json({ customer: { ...customer, loyaltyBalance } });
    } catch (err) {
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
    }
});

// GET /customers/:id/orders
router.get('/:id/orders', authenticate, async (req, res) => {
    try {
        const orders = await prisma.order.findMany({
            where: { customerId: req.params.id },
            include: {
                payment: { select: { method: true } },
                _count: { select: { items: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ orders });
    } catch (err) {
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
    }
});

module.exports = router;
