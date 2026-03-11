const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./modules/auth/routes');
const userRoutes = require('./modules/users/routes');
const categoryRoutes = require('./modules/categories/routes');
const productRoutes = require('./modules/products/routes');
const barcodeRoutes = require('./modules/barcodes/routes');
const orderRoutes = require('./modules/orders/routes');
const returnRoutes = require('./modules/returns/routes');
const customerRoutes = require('./modules/customers/routes');
const reportRoutes = require('./modules/reports/routes');
const settingRoutes = require('./modules/settings/routes');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        if (req.path !== '/api/v1/health') {
            console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
        }
    });
    next();
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/barcodes', barcodeRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/returns', returnRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/settings', settingRoutes);

// Health check
app.get('/api/v1/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
});

app.listen(PORT, () => {
    console.log(`\n  🏪 Jewellery POS API running at http://localhost:${PORT}`);
    console.log(`  📡 Health check: http://localhost:${PORT}/api/v1/health\n`);
});

module.exports = app;
