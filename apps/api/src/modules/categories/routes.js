const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /categories
router.get('/', authenticate, async (req, res) => {
    try {
        const categories = await prisma.category.findMany({
            where: { isActive: true },
            include: { children: true, _count: { select: { products: true } } },
            orderBy: { sortOrder: 'asc' }
        });
        res.json({ categories });
    } catch (err) {
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
    }
});

// POST /categories
router.post('/', authenticate, authorize('settings.manage'), async (req, res) => {
    try {
        const { name, description, parentId, sortOrder } = req.body;
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const category = await prisma.category.create({
            data: { name, slug, description, parentId, sortOrder: sortOrder || 0 }
        });
        res.status(201).json({ category });
    } catch (err) {
        if (err.code === 'P2002') {
            return res.status(409).json({ error: { code: 'DUPLICATE', message: 'Category already exists' } });
        }
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
    }
});

// PATCH /categories/:id
router.patch('/:id', authenticate, authorize('settings.manage'), async (req, res) => {
    try {
        const { name, description, parentId, sortOrder, isActive } = req.body;
        const data = {};
        if (name !== undefined) {
            data.name = name;
            data.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        }
        if (description !== undefined) data.description = description;
        if (parentId !== undefined) data.parentId = parentId;
        if (sortOrder !== undefined) data.sortOrder = sortOrder;
        if (isActive !== undefined) data.isActive = isActive;
        const category = await prisma.category.update({ where: { id: req.params.id }, data });
        res.json({ category });
    } catch (err) {
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
    }
});

// DELETE /categories/:id
router.delete('/:id', authenticate, authorize('settings.manage'), async (req, res) => {
    try {
        await prisma.category.update({ where: { id: req.params.id }, data: { isActive: false } });
        res.json({ message: 'Category deactivated' });
    } catch (err) {
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
    }
});

module.exports = router;
