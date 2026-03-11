const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /settings
router.get('/', authenticate, authorize('settings.manage'), async (req, res) => {
    try {
        const { group } = req.query;
        const where = group ? { group } : {};
        const settings = await prisma.setting.findMany({ where, orderBy: { key: 'asc' } });
        const settingsMap = {};
        settings.forEach(s => {
            try { settingsMap[s.key] = JSON.parse(s.value); } catch { settingsMap[s.key] = s.value; }
        });
        res.json({ settings: settingsMap, raw: settings });
    } catch (err) {
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
    }
});

// PATCH /settings/:key
router.patch('/:key', authenticate, authorize('settings.manage'), async (req, res) => {
    try {
        const { value, group } = req.body;
        const data = { value: typeof value === 'string' ? value : JSON.stringify(value) };
        if (group) data.group = group;
        const setting = await prisma.setting.upsert({
            where: { key: req.params.key },
            update: data,
            create: { key: req.params.key, ...data, group: group || 'general' }
        });
        res.json({ setting });
    } catch (err) {
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
    }
});

// GET /gold-rates/latest
router.get('/gold-rates', authenticate, async (req, res) => {
    try {
        const rates = await prisma.goldRate.findMany({ orderBy: { fetchedAt: 'desc' } });
        // Deduplicate — keep latest per metalType
        const latest = {};
        rates.forEach(r => { if (!latest[r.metalType]) latest[r.metalType] = r; });
        res.json({ rates: Object.values(latest) });
    } catch (err) {
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
    }
});

module.exports = router;
