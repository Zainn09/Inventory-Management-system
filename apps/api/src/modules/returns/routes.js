const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// POST /returns — process a return
router.post('/', authenticate, authorize('returns.create'), async (req, res) => {
    try {
        const { orderId, items, reason, notes, refundMethod } = req.body;

        if (!orderId || !items || !items.length) {
            return res.status(400).json({ error: { code: 'VALIDATION', message: 'Order ID and items required' } });
        }

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { items: { include: { product: true } } }
        });
        if (!order) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Order not found' } });

        // Generate return invoice
        const now = new Date();
        const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
        const rand = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
        const returnInvoice = `RET-${date}-${rand}`;

        let totalRefund = 0;
        const returnItems = [];

        for (const ri of items) {
            const orderItem = order.items.find(oi => oi.id === ri.orderItemId);
            if (!orderItem) {
                return res.status(400).json({ error: { code: 'VALIDATION', message: `Order item ${ri.orderItemId} not found` } });
            }

            const qtyToReturn = ri.quantity || orderItem.quantity;
            const refundLineTotal = (orderItem.lineTotal / orderItem.quantity) * qtyToReturn;
            totalRefund += refundLineTotal;

            returnItems.push({
                orderItemId: orderItem.id,
                productId: orderItem.productId,
                quantityReturned: qtyToReturn,
                refundLineTotal
            });
        }

        // Create return record
        const returnRecord = await prisma.return.create({
            data: {
                orderId,
                processedById: req.user.id,
                returnInvoice,
                reason: reason || 'customer_request',
                notes,
                refundAmount: totalRefund,
                refundMethod: refundMethod || 'cash',
                items: {
                    create: returnItems
                }
            },
            include: {
                items: { include: { product: { select: { name: true, sku: true } } } },
                order: { select: { invoiceNumber: true } },
                processedBy: { select: { fullName: true } }
            }
        });

        // Restore inventory for each returned item
        for (const ri of returnItems) {
            const product = await prisma.product.findUnique({ where: { id: ri.productId } });
            const newQty = product.quantity + ri.quantityReturned;
            await prisma.product.update({
                where: { id: ri.productId },
                data: { quantity: newQty }
            });
            await prisma.inventoryLog.create({
                data: {
                    productId: ri.productId,
                    userId: req.user.id,
                    action: 'returned',
                    quantityChange: ri.quantityReturned,
                    quantityBefore: product.quantity,
                    quantityAfter: newQty,
                    reason: `Return ${returnInvoice}`
                }
            });
        }

        // Update order status
        const allItemsReturned = order.items.every(oi =>
            returnItems.some(ri => ri.orderItemId === oi.id && ri.quantityReturned >= oi.quantity)
        );
        await prisma.order.update({
            where: { id: orderId },
            data: { status: allItemsReturned ? 'returned' : 'partially_returned' }
        });

        res.status(201).json({ return: returnRecord });
    } catch (err) {
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
    }
});

// GET /returns
router.get('/', authenticate, authorize('returns.view'), async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const [returns, total] = await Promise.all([
            prisma.return.findMany({
                include: {
                    order: { select: { invoiceNumber: true } },
                    processedBy: { select: { fullName: true } },
                    _count: { select: { items: true } }
                },
                skip: (parseInt(page) - 1) * parseInt(limit),
                take: parseInt(limit),
                orderBy: { createdAt: 'desc' }
            }),
            prisma.return.count()
        ]);
        res.json({ returns, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) } });
    } catch (err) {
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
    }
});

// GET /returns/:id
router.get('/:id', authenticate, async (req, res) => {
    try {
        const r = await prisma.return.findUnique({
            where: { id: req.params.id },
            include: {
                items: { include: { product: { select: { name: true, sku: true } }, orderItem: true } },
                order: { select: { invoiceNumber: true, totalAmount: true, createdAt: true } },
                processedBy: { select: { fullName: true } }
            }
        });
        if (!r) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Return not found' } });
        res.json({ return: r });
    } catch (err) {
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
    }
});

module.exports = router;
