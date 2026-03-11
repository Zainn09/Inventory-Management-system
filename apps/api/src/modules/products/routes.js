const express = require('express');
const bwipjs = require('bwip-js');
const prisma = require('../lib/prisma');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Helper: generate unique barcode value
async function generateBarcodeValue() {
    const last = await prisma.barcode.findFirst({ orderBy: { generatedAt: 'desc' } });
    let nextNum = 1;
    if (last) {
        const match = last.barcodeValue.match(/JWL-(\d+)/);
        if (match) nextNum = parseInt(match[1], 10) + 1;
    }
    return `JWL-${String(nextNum).padStart(8, '0')}`;
}

// Helper: generate barcode image as data URI
async function generateBarcodeImage(barcodeValue) {
    const png = await bwipjs.toBuffer({
        bcid: 'code128',
        text: barcodeValue,
        scale: 3,
        height: 10,
        includetext: true,
        textxalign: 'center'
    });
    return `data:image/png;base64,${png.toString('base64')}`;
}

// Helper: generate SKU
async function generateSKU(categoryName) {
    const prefix = (categoryName || 'GEN').substring(0, 3).toUpperCase();
    const count = await prisma.product.count();
    return `${prefix}-${String(count + 1).padStart(4, '0')}`;
}

// GET /products
router.get('/', authenticate, async (req, res) => {
    try {
        const { page = 1, limit = 20, category, metalType, search, lowStock } = req.query;
        const where = { isActive: true };
        if (category) where.categoryId = category;
        if (metalType) where.metalType = metalType;
        if (search) {
            where.OR = [
                { name: { contains: search } },
                { sku: { contains: search } },
                { description: { contains: search } }
            ];
        }
        if (lowStock === 'true') {
            // SQLite doesn't support column comparison in where, so we filter in JS
        }

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                include: {
                    category: { select: { id: true, name: true } },
                    barcode: { select: { barcodeValue: true, barcodeImageUrl: true } }
                },
                skip: (parseInt(page) - 1) * parseInt(limit),
                take: parseInt(limit),
                orderBy: { createdAt: 'desc' }
            }),
            prisma.product.count({ where })
        ]);

        let result = products;
        if (lowStock === 'true') {
            result = products.filter(p => p.quantity <= p.lowStockThreshold);
        }

        res.json({
            products: result,
            pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
        });
    } catch (err) {
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
    }
});

// GET /products/low-stock
router.get('/low-stock', authenticate, authorize('products.view'), async (req, res) => {
    try {
        const products = await prisma.product.findMany({
            where: { isActive: true },
            include: {
                category: { select: { id: true, name: true } },
                barcode: { select: { barcodeValue: true } }
            }
        });
        const lowStock = products.filter(p => p.quantity <= p.lowStockThreshold);
        res.json({ products: lowStock, count: lowStock.length });
    } catch (err) {
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
    }
});

// GET /products/:id
router.get('/:id', authenticate, async (req, res) => {
    try {
        const product = await prisma.product.findUnique({
            where: { id: req.params.id },
            include: {
                category: true,
                barcode: true
            }
        });
        if (!product) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Product not found' } });
        res.json({ product });
    } catch (err) {
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
    }
});

// POST /products
router.post('/', authenticate, authorize('products.create'), async (req, res) => {
    try {
        const { name, description, categoryId, metalType, purity, weightGrams, makingCharges, costPrice, sellingPrice, quantity, lowStockThreshold, imageUrl } = req.body;

        if (!name || sellingPrice === undefined) {
            return res.status(400).json({ error: { code: 'VALIDATION', message: 'Name and selling price required' } });
        }

        // Get category name for SKU
        let catName = 'GEN';
        if (categoryId) {
            const cat = await prisma.category.findUnique({ where: { id: categoryId } });
            if (cat) catName = cat.name;
        }

        const sku = await generateSKU(catName);
        const barcodeValue = await generateBarcodeValue();
        const barcodeImageUrl = await generateBarcodeImage(barcodeValue);

        const product = await prisma.product.create({
            data: {
                sku,
                name,
                description,
                categoryId,
                metalType: metalType || 'gold',
                purity,
                weightGrams: weightGrams || 0,
                makingCharges: makingCharges || 0,
                costPrice: costPrice || 0,
                sellingPrice,
                quantity: quantity || 0,
                lowStockThreshold: lowStockThreshold || 5,
                imageUrl,
                barcode: {
                    create: {
                        barcodeValue,
                        barcodeType: 'CODE128',
                        barcodeImageUrl
                    }
                }
            },
            include: { barcode: true, category: true }
        });

        // Log inventory
        if (quantity && quantity > 0) {
            await prisma.inventoryLog.create({
                data: {
                    productId: product.id,
                    userId: req.user.id,
                    action: 'added',
                    quantityChange: quantity,
                    quantityBefore: 0,
                    quantityAfter: quantity,
                    reason: 'Initial stock'
                }
            });
        }

        res.status(201).json({ product });
    } catch (err) {
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
    }
});

// PATCH /products/:id
router.patch('/:id', authenticate, authorize('products.update'), async (req, res) => {
    try {
        const { name, description, categoryId, metalType, purity, weightGrams, makingCharges, costPrice, sellingPrice, quantity, lowStockThreshold, imageUrl, isActive } = req.body;
        const data = {};
        if (name !== undefined) data.name = name;
        if (description !== undefined) data.description = description;
        if (categoryId !== undefined) data.categoryId = categoryId;
        if (metalType !== undefined) data.metalType = metalType;
        if (purity !== undefined) data.purity = purity;
        if (weightGrams !== undefined) data.weightGrams = weightGrams;
        if (makingCharges !== undefined) data.makingCharges = makingCharges;
        if (costPrice !== undefined) data.costPrice = costPrice;
        if (sellingPrice !== undefined) data.sellingPrice = sellingPrice;
        if (lowStockThreshold !== undefined) data.lowStockThreshold = lowStockThreshold;
        if (imageUrl !== undefined) data.imageUrl = imageUrl;
        if (isActive !== undefined) data.isActive = isActive;

        // Handle quantity change with logging
        if (quantity !== undefined) {
            const current = await prisma.product.findUnique({ where: { id: req.params.id } });
            if (current && current.quantity !== quantity) {
                data.quantity = quantity;
                await prisma.inventoryLog.create({
                    data: {
                        productId: req.params.id,
                        userId: req.user.id,
                        action: 'adjusted',
                        quantityChange: quantity - current.quantity,
                        quantityBefore: current.quantity,
                        quantityAfter: quantity,
                        reason: req.body.reason || 'Manual adjustment'
                    }
                });
            }
        }

        const product = await prisma.product.update({
            where: { id: req.params.id },
            data,
            include: { barcode: true, category: true }
        });
        res.json({ product });
    } catch (err) {
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
    }
});

// DELETE /products/:id (soft delete)
router.delete('/:id', authenticate, authorize('products.delete'), async (req, res) => {
    try {
        await prisma.product.update({ where: { id: req.params.id }, data: { isActive: false } });
        res.json({ message: 'Product deactivated' });
    } catch (err) {
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
    }
});

// GET /products/:id/history
router.get('/:id/history', authenticate, authorize('products.view'), async (req, res) => {
    try {
        const logs = await prisma.inventoryLog.findMany({
            where: { productId: req.params.id },
            include: { user: { select: { fullName: true } } },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ logs });
    } catch (err) {
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
    }
});

// POST /products/:id/adjust
router.post('/:id/adjust', authenticate, authorize('products.adjust_stock'), async (req, res) => {
    try {
        const { quantity, reason, action } = req.body;
        const product = await prisma.product.findUnique({ where: { id: req.params.id } });
        if (!product) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Product not found' } });

        const newQty = product.quantity + quantity;
        if (newQty < 0) return res.status(400).json({ error: { code: 'VALIDATION', message: 'Quantity cannot go negative' } });

        await prisma.product.update({ where: { id: req.params.id }, data: { quantity: newQty } });
        await prisma.inventoryLog.create({
            data: {
                productId: req.params.id,
                userId: req.user.id,
                action: action || 'adjusted',
                quantityChange: quantity,
                quantityBefore: product.quantity,
                quantityAfter: newQty,
                reason: reason || 'Stock adjustment'
            }
        });

        res.json({ product: { ...product, quantity: newQty } });
    } catch (err) {
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
    }
});

module.exports = router;
