const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /reports/daily-sales
router.get('/daily-sales', authenticate, authorize('reports.view'), async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const orders = await prisma.order.findMany({
            where: {
                createdAt: { gte: today, lt: tomorrow },
                status: { in: ['completed', 'partially_returned'] }
            },
            include: {
                items: { include: { product: { select: { name: true, category: { select: { name: true } } } } } },
                payment: true
            }
        });

        const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
        const totalOrders = orders.length;
        const totalItems = orders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0);

        // Payment method breakdown
        const paymentBreakdown = {};
        orders.forEach(o => {
            if (o.payment) {
                paymentBreakdown[o.payment.method] = (paymentBreakdown[o.payment.method] || 0) + o.payment.amountPaid;
            }
        });

        // Category breakdown
        const categoryBreakdown = {};
        orders.forEach(o => {
            o.items.forEach(item => {
                const cat = item.product?.category?.name || 'Uncategorized';
                if (!categoryBreakdown[cat]) categoryBreakdown[cat] = { count: 0, revenue: 0 };
                categoryBreakdown[cat].count += item.quantity;
                categoryBreakdown[cat].revenue += item.lineTotal;
            });
        });

        res.json({
            date: today.toISOString().split('T')[0],
            totalRevenue,
            totalOrders,
            totalItems,
            averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
            paymentBreakdown,
            categoryBreakdown,
            orders
        });
    } catch (err) {
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
    }
});

// GET /reports/sales?from=&to=
router.get('/sales', authenticate, authorize('reports.view'), async (req, res) => {
    try {
        const { from, to } = req.query;
        const where = { status: { in: ['completed', 'partially_returned'] } };
        if (from || to) {
            where.createdAt = {};
            if (from) where.createdAt.gte = new Date(from);
            if (to) {
                const toDate = new Date(to);
                toDate.setDate(toDate.getDate() + 1);
                where.createdAt.lt = toDate;
            }
        }

        const orders = await prisma.order.findMany({
            where,
            include: { payment: { select: { method: true } } },
            orderBy: { createdAt: 'desc' }
        });

        const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
        const totalDiscount = orders.reduce((sum, o) => sum + o.discountAmount, 0);
        const totalTax = orders.reduce((sum, o) => sum + o.taxAmount, 0);

        // Group by date
        const dailySales = {};
        orders.forEach(o => {
            const day = o.createdAt.toISOString().split('T')[0];
            if (!dailySales[day]) dailySales[day] = { date: day, revenue: 0, orders: 0 };
            dailySales[day].revenue += o.totalAmount;
            dailySales[day].orders += 1;
        });

        res.json({
            totalRevenue,
            totalDiscount,
            totalTax,
            totalOrders: orders.length,
            dailySales: Object.values(dailySales).sort((a, b) => a.date.localeCompare(b.date))
        });
    } catch (err) {
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
    }
});

// GET /reports/sales-by-category
router.get('/sales-by-category', authenticate, authorize('reports.view'), async (req, res) => {
    try {
        const { from, to } = req.query;
        const where = { status: { in: ['completed', 'partially_returned'] } };
        if (from || to) {
            where.createdAt = {};
            if (from) where.createdAt.gte = new Date(from);
            if (to) where.createdAt.lt = new Date(to);
        }

        const orders = await prisma.order.findMany({
            where,
            include: {
                items: {
                    include: {
                        product: { select: { category: { select: { id: true, name: true } } } }
                    }
                }
            }
        });

        const categoryData = {};
        orders.forEach(o => {
            o.items.forEach(item => {
                const cat = item.product?.category?.name || 'Uncategorized';
                const catId = item.product?.category?.id || 'uncategorized';
                if (!categoryData[catId]) categoryData[catId] = { id: catId, name: cat, totalSold: 0, totalRevenue: 0 };
                categoryData[catId].totalSold += item.quantity;
                categoryData[catId].totalRevenue += item.lineTotal;
            });
        });

        res.json({ categories: Object.values(categoryData).sort((a, b) => b.totalRevenue - a.totalRevenue) });
    } catch (err) {
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
    }
});

// GET /reports/inventory — full snapshot
router.get('/inventory', authenticate, authorize('reports.view'), async (req, res) => {
    try {
        const products = await prisma.product.findMany({
            where: { isActive: true },
            include: {
                category: { select: { name: true } },
                barcode: { select: { barcodeValue: true } }
            },
            orderBy: { name: 'asc' }
        });

        const totalProducts = products.length;
        const totalQuantity = products.reduce((sum, p) => sum + p.quantity, 0);
        const totalCostValue = products.reduce((sum, p) => sum + (p.costPrice * p.quantity), 0);
        const totalRetailValue = products.reduce((sum, p) => sum + (p.sellingPrice * p.quantity), 0);
        const lowStockCount = products.filter(p => p.quantity <= p.lowStockThreshold).length;

        res.json({
            totalProducts,
            totalQuantity,
            totalCostValue,
            totalRetailValue,
            potentialProfit: totalRetailValue - totalCostValue,
            lowStockCount,
            products
        });
    } catch (err) {
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
    }
});

// GET /reports/profit
router.get('/profit', authenticate, authorize('reports.profit'), async (req, res) => {
    try {
        const { from, to } = req.query;
        const where = { status: { in: ['completed', 'partially_returned'] } };
        if (from || to) {
            where.createdAt = {};
            if (from) where.createdAt.gte = new Date(from);
            if (to) where.createdAt.lt = new Date(to);
        }

        const orders = await prisma.order.findMany({
            where,
            include: {
                items: {
                    include: {
                        product: { select: { costPrice: true, name: true } }
                    }
                }
            }
        });

        let totalRevenue = 0;
        let totalCost = 0;
        orders.forEach(o => {
            o.items.forEach(item => {
                totalRevenue += item.lineTotal;
                totalCost += (item.product?.costPrice || 0) * item.quantity;
            });
        });

        const grossProfit = totalRevenue - totalCost;
        const margin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

        res.json({
            totalRevenue,
            totalCost,
            grossProfit,
            marginPercentage: Math.round(margin * 100) / 100,
            totalOrders: orders.length
        });
    } catch (err) {
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
    }
});

module.exports = router;
