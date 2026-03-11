const express = require('express');
const { v4: uuidv4 } = require('uuid');
const prisma = require('../lib/prisma');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Helper: generate invoice number
function generateInvoiceNumber() {
    const now = new Date();
    const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const rand = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    return `INV-${date}-${rand}`;
}

// POST /orders — create new order (billing)
router.post('/', authenticate, authorize('orders.create'), async (req, res) => {
    try {
        const { items, customerId, orderType, discountAmount, taxRate, payment, notes } = req.body;

        if (!items || !items.length) {
            return res.status(400).json({ error: { code: 'VALIDATION', message: 'At least one item required' } });
        }

        // Validate items and calculate totals
        let subtotal = 0;
        const resolvedItems = [];

        for (const item of items) {
            const product = await prisma.product.findUnique({
                where: { id: item.productId },
                include: { barcode: true }
            });

            if (!product || !product.isActive) {
                return res.status(400).json({ error: { code: 'VALIDATION', message: `Product ${item.productId} not found or inactive` } });
            }
            if (product.quantity < (item.quantity || 1)) {
                return res.status(400).json({ error: { code: 'INSUFFICIENT_STOCK', message: `Insufficient stock for ${product.name}. Available: ${product.quantity}` } });
            }

            const qty = item.quantity || 1;
            const unitPrice = item.unitPrice || product.sellingPrice;
            const itemDiscount = item.discount || 0;
            const itemTaxRate = taxRate || 0;
            const lineSubtotal = (unitPrice * qty) - itemDiscount;
            const itemTax = lineSubtotal * (itemTaxRate / 100);
            const lineTotal = lineSubtotal + itemTax;

            subtotal += unitPrice * qty;
            resolvedItems.push({
                productId: product.id,
                scannedBarcode: product.barcode?.barcodeValue || null,
                quantity: qty,
                unitPrice,
                discount: itemDiscount,
                taxRate: itemTaxRate,
                taxAmount: itemTax,
                lineTotal
            });
        }

        const discAmt = discountAmount || 0;
        const taxAmt = resolvedItems.reduce((sum, i) => sum + i.taxAmount, 0);
        const totalAmount = subtotal - discAmt + taxAmt;

        // Create order with items and payment in a transaction
        const invoiceNumber = generateInvoiceNumber();

        const order = await prisma.order.create({
            data: {
                invoiceNumber,
                customerId: customerId || null,
                cashierId: req.user.id,
                orderType: orderType || 'pos_sale',
                status: 'completed',
                subtotal,
                discountAmount: discAmt,
                taxAmount: taxAmt,
                totalAmount,
                notes,
                items: {
                    create: resolvedItems
                },
                payment: payment ? {
                    create: {
                        method: payment.method || 'cash',
                        amountPaid: payment.amountPaid || totalAmount,
                        changeGiven: payment.changeGiven || 0,
                        transactionRef: payment.transactionRef
                    }
                } : {
                    create: {
                        method: 'cash',
                        amountPaid: totalAmount,
                        changeGiven: 0
                    }
                }
            },
            include: {
                items: { include: { product: { select: { name: true, sku: true } } } },
                payment: true,
                customer: true,
                cashier: { select: { fullName: true } }
            }
        });

        // Reduce inventory for each item
        for (const item of resolvedItems) {
            const product = await prisma.product.findUnique({ where: { id: item.productId } });
            const newQty = product.quantity - item.quantity;
            await prisma.product.update({
                where: { id: item.productId },
                data: { quantity: newQty }
            });
            await prisma.inventoryLog.create({
                data: {
                    productId: item.productId,
                    userId: req.user.id,
                    action: 'sold',
                    quantityChange: -item.quantity,
                    quantityBefore: product.quantity,
                    quantityAfter: newQty,
                    reason: `Sold in order ${invoiceNumber}`
                }
            });
        }

        // Award loyalty points if customer
        if (customerId) {
            const points = Math.floor(totalAmount / 100); // 1 point per 100
            if (points > 0) {
                const lastLoyalty = await prisma.loyaltyPoint.findFirst({
                    where: { customerId },
                    orderBy: { createdAt: 'desc' }
                });
                const currentBalance = lastLoyalty ? lastLoyalty.balance : 0;
                await prisma.loyaltyPoint.create({
                    data: {
                        customerId,
                        orderId: order.id,
                        pointsEarned: points,
                        pointsRedeemed: 0,
                        balance: currentBalance + points
                    }
                });
            }
        }

        res.status(201).json({ order });
    } catch (err) {
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
    }
});

// GET /orders
router.get('/', authenticate, async (req, res) => {
    try {
        const { page = 1, limit = 20, orderType, status, from, to } = req.query;
        const where = {};
        if (orderType) where.orderType = orderType;
        if (status) where.status = status;
        if (from || to) {
            where.createdAt = {};
            if (from) where.createdAt.gte = new Date(from);
            if (to) where.createdAt.lte = new Date(to);
        }

        // Cashiers can only see their own orders
        if (req.user.role === 'cashier') {
            where.cashierId = req.user.id;
        }

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                include: {
                    customer: { select: { fullName: true, phone: true } },
                    cashier: { select: { fullName: true } },
                    payment: { select: { method: true } },
                    _count: { select: { items: true } }
                },
                skip: (parseInt(page) - 1) * parseInt(limit),
                take: parseInt(limit),
                orderBy: { createdAt: 'desc' }
            }),
            prisma.order.count({ where })
        ]);

        res.json({
            orders,
            pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
        });
    } catch (err) {
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
    }
});

// GET /orders/:id
router.get('/:id', authenticate, async (req, res) => {
    try {
        const order = await prisma.order.findUnique({
            where: { id: req.params.id },
            include: {
                items: {
                    include: {
                        product: { select: { name: true, sku: true, metalType: true, weightGrams: true, imageUrl: true } }
                    }
                },
                payment: true,
                customer: true,
                cashier: { select: { fullName: true } },
                returns: { include: { items: true } }
            }
        });
        if (!order) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Order not found' } });
        res.json({ order });
    } catch (err) {
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
    }
});

module.exports = router;
