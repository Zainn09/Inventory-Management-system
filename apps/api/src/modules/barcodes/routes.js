const express = require('express');
const bwipjs = require('bwip-js');
const prisma = require('../lib/prisma');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /barcodes/scan/:value — THE CRITICAL BILLING SCAN ENDPOINT
router.get('/scan/:value', authenticate, async (req, res) => {
    try {
        const barcode = await prisma.barcode.findUnique({
            where: { barcodeValue: req.params.value },
            include: {
                product: {
                    include: {
                        category: { select: { id: true, name: true } }
                    }
                }
            }
        });

        if (!barcode || !barcode.product.isActive) {
            return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Barcode not found or product inactive' } });
        }

        res.json({
            product: {
                id: barcode.product.id,
                sku: barcode.product.sku,
                name: barcode.product.name,
                metalType: barcode.product.metalType,
                purity: barcode.product.purity,
                weightGrams: barcode.product.weightGrams,
                sellingPrice: barcode.product.sellingPrice,
                quantity: barcode.product.quantity,
                category: barcode.product.category,
                imageUrl: barcode.product.imageUrl,
                barcode: barcode.barcodeValue
            }
        });
    } catch (err) {
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
    }
});

// POST /barcodes/generate/:productId — regenerate barcode
router.post('/generate/:productId', authenticate, authorize('barcodes.print'), async (req, res) => {
    try {
        const product = await prisma.product.findUnique({
            where: { id: req.params.productId },
            include: { barcode: true }
        });
        if (!product) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Product not found' } });

        // Generate new barcode value
        const last = await prisma.barcode.findFirst({ orderBy: { generatedAt: 'desc' } });
        let nextNum = 1;
        if (last) {
            const match = last.barcodeValue.match(/JWL-(\d+)/);
            if (match) nextNum = parseInt(match[1], 10) + 1;
        }
        const barcodeValue = `JWL-${String(nextNum).padStart(8, '0')}`;

        const png = await bwipjs.toBuffer({
            bcid: 'code128',
            text: barcodeValue,
            scale: 3,
            height: 10,
            includetext: true,
            textxalign: 'center'
        });
        const barcodeImageUrl = `data:image/png;base64,${png.toString('base64')}`;

        let barcode;
        if (product.barcode) {
            barcode = await prisma.barcode.update({
                where: { id: product.barcode.id },
                data: { barcodeValue, barcodeImageUrl, generatedAt: new Date() }
            });
        } else {
            barcode = await prisma.barcode.create({
                data: { productId: product.id, barcodeValue, barcodeImageUrl, barcodeType: 'CODE128' }
            });
        }

        res.json({ barcode });
    } catch (err) {
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
    }
});

// GET /barcodes/label/:productId — get printable label data
router.get('/label/:productId', authenticate, async (req, res) => {
    try {
        const product = await prisma.product.findUnique({
            where: { id: req.params.productId },
            include: { barcode: true, category: true }
        });
        if (!product || !product.barcode) {
            return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Product or barcode not found' } });
        }

        res.json({
            label: {
                productName: product.name,
                sku: product.sku,
                barcode: product.barcode.barcodeValue,
                barcodeImage: product.barcode.barcodeImageUrl,
                metalType: product.metalType,
                weight: product.weightGrams,
                price: product.sellingPrice,
                category: product.category?.name
            }
        });
    } catch (err) {
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
    }
});

module.exports = router;
