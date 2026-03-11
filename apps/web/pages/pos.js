import { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import { api, formatCurrency, CATEGORY_EMOJIS, METAL_EMOJIS } from '../lib/api';
import { printReceipt } from '../lib/print';
import { ReceiptTemplate } from '../components/PrintLayout';

export default function POSPage() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [activeCategory, setActiveCategory] = useState('all');
    const [cart, setCart] = useState([]);
    const [scanInput, setScanInput] = useState('');
    const [orderType, setOrderType] = useState('pos_sale');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [discount, setDiscount] = useState(0);
    const [taxRate, setTaxRate] = useState(3);
    const [customerId, setCustomerId] = useState('');
    const [customers, setCustomers] = useState([]);
    const [showSuccess, setShowSuccess] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [settings, setSettings] = useState({});
    const scanRef = useRef(null);

    useEffect(() => {
        loadData();
        loadSettings();
        if (scanRef.current) scanRef.current.focus();

        // Auto-refocus scanner
        const handleClick = () => {
            if (scanRef.current && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'SELECT' && document.activeElement?.tagName !== 'TEXTAREA') {
                scanRef.current.focus();
            }
        };
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    async function loadSettings() {
        try {
            const data = await api('/settings');
            setSettings(data.settings || {});
        } catch (err) { console.error(err); }
    }

    async function loadData() {
        try {
            const [prodData, catData, custData] = await Promise.all([
                api('/products?limit=100'),
                api('/categories'),
                api('/customers?limit=50')
            ]);
            setProducts(prodData.products || []);
            setCategories(catData.categories || []);
            setCustomers(custData.customers || []);
        } catch (err) {
            console.error('Load error:', err);
        }
    }

    // Barcode scan handler
    const handleScan = useCallback(async (e) => {
        if (e.key === 'Enter' && scanInput.trim()) {
            try {
                const data = await api(`/barcodes/scan/${scanInput.trim()}`);
                if (data.product) {
                    addToCart(data.product);
                }
            } catch (err) {
                // Try product name search
                const found = products.find(p =>
                    p.name.toLowerCase().includes(scanInput.toLowerCase()) ||
                    p.sku.toLowerCase() === scanInput.toLowerCase()
                );
                if (found) {
                    addToCart({
                        id: found.id, name: found.name, sku: found.sku,
                        sellingPrice: found.sellingPrice, quantity: found.quantity,
                        metalType: found.metalType, weightGrams: found.weightGrams,
                        category: found.category, barcode: found.barcode?.barcodeValue
                    });
                } else {
                    alert('Product not found: ' + scanInput);
                }
            }
            setScanInput('');
            if (scanRef.current) scanRef.current.focus();
        }
    }, [scanInput, products]);

    function addToCart(product) {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                if (existing.qty >= product.quantity) {
                    alert(`Only ${product.quantity} units available for ${product.name}`);
                    return prev;
                }
                return prev.map(item =>
                    item.id === product.id ? { ...item, qty: item.qty + 1 } : item
                );
            }
            if (product.quantity < 1) {
                alert(`${product.name} is out of stock`);
                return prev;
            }
            return [...prev, {
                id: product.id,
                name: product.name,
                sku: product.sku,
                price: product.sellingPrice,
                maxQty: product.quantity,
                qty: 1,
                metalType: product.metalType,
                weight: product.weightGrams,
                barcode: product.barcode
            }];
        });
    }

    function updateCartQty(id, delta) {
        setCart(prev => prev.map(item => {
            if (item.id !== id) return item;
            const newQty = item.qty + delta;
            if (newQty > item.maxQty) { alert(`Only ${item.maxQty} available`); return item; }
            if (newQty < 1) return item;
            return { ...item, qty: newQty };
        }));
    }

    function removeFromCart(id) {
        setCart(prev => prev.filter(item => item.id !== id));
    }

    // Totals
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const discountAmt = (subtotal * discount) / 100;
    const taxableAmount = subtotal - discountAmt;
    const taxAmt = (taxableAmount * taxRate) / 100;
    const total = taxableAmount + taxAmt;

    // Complete sale
    async function completeSale() {
        if (cart.length === 0) return;
        setProcessing(true);
        try {
            const order = await api('/orders', {
                method: 'POST',
                body: JSON.stringify({
                    items: cart.map(item => ({
                        productId: item.id,
                        quantity: item.qty,
                        unitPrice: item.price
                    })),
                    customerId: customerId || undefined,
                    orderType,
                    discountAmount: discountAmt,
                    taxRate,
                    payment: {
                        method: paymentMethod,
                        amountPaid: total
                    }
                })
            });

            setShowSuccess(order.order);
            setCart([]);
            setDiscount(0);
            setCustomerId('');
            loadData(); // Refresh products for updated quantities

            setTimeout(() => setShowSuccess(null), 5000);
        } catch (err) {
            alert('Error: ' + err.message);
        } finally {
            setProcessing(false);
        }
    }

    // Filter products
    const filteredProducts = activeCategory === 'all'
        ? products
        : products.filter(p => p.category?.id === activeCategory);

    return (
        <>
            <Head><title>POS — Jewellery POS</title></Head>
            <Layout title="Point of Sale" subtitle="Scan & Bill">
                {/* Success toast */}
                {showSuccess && (
                    <div className="toast-container">
                        <div className="toast toast--success">
                            <span>✅</span>
                            <div className="toast-content" style={{ flex: 1 }}>
                                <strong>Sale Complete!</strong>
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                                    Invoice: {showSuccess.invoiceNumber} — {formatCurrency(showSuccess.totalAmount)}
                                </div>
                            </div>
                            <button
                                className="btn btn--secondary btn--sm"
                                onClick={() => printReceipt(showSuccess)}
                                style={{ marginLeft: 'var(--space-md)' }}
                            >
                                🖨️ Print Receipt
                            </button>
                        </div>
                        {/* Hidden receipt for DOM printing */}
                        <div style={{ display: 'none' }}>
                            <ReceiptTemplate order={showSuccess} storeSettings={settings} />
                        </div>
                    </div>
                )}

                <div className="pos-layout">
                    {/* Left — Products */}
                    <div className="pos-products">
                        {/* Scan bar */}
                        <div className="scan-bar">
                            <input
                                ref={scanRef}
                                className="input input--lg"
                                placeholder="🔍 Scan barcode or search product..."
                                value={scanInput}
                                onChange={e => setScanInput(e.target.value)}
                                onKeyDown={handleScan}
                                autoFocus
                            />
                        </div>

                        {/* Category tabs */}
                        <div className="category-tabs">
                            <button
                                className={`category-tab ${activeCategory === 'all' ? 'category-tab--active' : ''}`}
                                onClick={() => setActiveCategory('all')}
                            >All</button>
                            {categories.map(cat => (
                                <button
                                    key={cat.id}
                                    className={`category-tab ${activeCategory === cat.id ? 'category-tab--active' : ''}`}
                                    onClick={() => setActiveCategory(cat.id)}
                                >
                                    {CATEGORY_EMOJIS[cat.slug] || '💎'} {cat.name}
                                </button>
                            ))}
                        </div>

                        {/* Product grid */}
                        <div className="product-grid">
                            {filteredProducts.map(product => (
                                <div
                                    key={product.id}
                                    className="product-tile"
                                    onClick={() => addToCart({
                                        id: product.id, name: product.name, sku: product.sku,
                                        sellingPrice: product.sellingPrice, quantity: product.quantity,
                                        metalType: product.metalType, weightGrams: product.weightGrams,
                                        barcode: product.barcode?.barcodeValue
                                    })}
                                >
                                    <div className="product-tile__icon">{METAL_EMOJIS[product.metalType] || '💎'}</div>
                                    <div className="product-tile__name">{product.name}</div>
                                    <div className="product-tile__price">{formatCurrency(product.sellingPrice)}</div>
                                    <div className="product-tile__qty">
                                        {product.weightGrams}g • Qty: {product.quantity}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right — Cart */}
                    <div className="pos-cart">
                        <div className="pos-cart__header">
                            <div className="flex-between">
                                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>🛒 Cart ({cart.length} items)</h3>
                                {cart.length > 0 && (
                                    <button className="btn btn--ghost btn--sm" onClick={() => setCart([])}>Clear</button>
                                )}
                            </div>
                            {/* Customer selector */}
                            <select
                                className="input"
                                style={{ marginTop: 'var(--space-sm)', fontSize: '0.82rem' }}
                                value={customerId}
                                onChange={e => setCustomerId(e.target.value)}
                            >
                                <option value="">👤 Walk-in Customer</option>
                                {customers.map(c => (
                                    <option key={c.id} value={c.id}>{c.fullName} — {c.phone}</option>
                                ))}
                            </select>
                        </div>

                        <div className="pos-cart__items">
                            {cart.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-state__icon">🛒</div>
                                    <div className="empty-state__text">Scan a barcode to start</div>
                                </div>
                            ) : (
                                cart.map(item => (
                                    <div key={item.id} className="pos-cart__item">
                                        <div className="pos-cart__item-info">
                                            <div className="pos-cart__item-name">{item.name}</div>
                                            <div className="pos-cart__item-meta">{item.sku} • {item.weight}g</div>
                                        </div>
                                        <div className="pos-cart__item-qty">
                                            <button onClick={() => updateCartQty(item.id, -1)}>−</button>
                                            <span>{item.qty}</span>
                                            <button onClick={() => updateCartQty(item.id, 1)}>+</button>
                                        </div>
                                        <div className="pos-cart__item-price">{formatCurrency(item.price * item.qty)}</div>
                                        <button
                                            className="btn btn--ghost btn--sm"
                                            style={{ color: 'var(--color-danger)', padding: '4px' }}
                                            onClick={() => removeFromCart(item.id)}
                                        >✕</button>
                                    </div>
                                ))
                            )}
                        </div>

                        {cart.length > 0 && (
                            <>
                                <div className="pos-cart__summary">
                                    <div className="pos-cart__summary-row">
                                        <span>Subtotal</span>
                                        <span>{formatCurrency(subtotal)}</span>
                                    </div>
                                    <div className="pos-cart__summary-row">
                                        <span>
                                            Discount
                                            <input
                                                type="number"
                                                min="0" max="100" step="0.5"
                                                value={discount}
                                                onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
                                                style={{ width: 50, marginLeft: 8, padding: '2px 6px', border: '1px solid var(--color-border)', borderRadius: 4, fontSize: '0.82rem', textAlign: 'right', background: 'var(--color-bg-card)', color: 'var(--color-text-primary)' }}
                                            />%
                                        </span>
                                        <span style={{ color: 'var(--color-danger)' }}>- {formatCurrency(discountAmt)}</span>
                                    </div>
                                    <div className="pos-cart__summary-row">
                                        <span>Tax ({taxRate}%)</span>
                                        <span>+ {formatCurrency(taxAmt)}</span>
                                    </div>
                                    <div className="pos-cart__summary-row pos-cart__summary-row--total">
                                        <span>Total</span>
                                        <span style={{ color: 'var(--color-accent)' }}>{formatCurrency(total)}</span>
                                    </div>
                                </div>

                                <div className="pos-cart__actions">
                                    {/* Order type */}
                                    <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
                                        <button
                                            className={`btn btn--sm ${orderType === 'pos_sale' ? 'btn--primary' : 'btn--secondary'}`}
                                            style={{ flex: 1 }}
                                            onClick={() => setOrderType('pos_sale')}
                                        >🏪 POS Sale</button>
                                        <button
                                            className={`btn btn--sm ${orderType === 'online_order' ? 'btn--primary' : 'btn--secondary'}`}
                                            style={{ flex: 1 }}
                                            onClick={() => setOrderType('online_order')}
                                        >🌐 Online Order</button>
                                    </div>

                                    {/* Payment methods */}
                                    <div className="pos-payment-btns">
                                        {[
                                            { key: 'cash', icon: '💵', label: 'Cash' },
                                            { key: 'card', icon: '💳', label: 'Card' },
                                            { key: 'upi', icon: '📱', label: 'UPI' }
                                        ].map(pm => (
                                            <button
                                                key={pm.key}
                                                className={`pos-payment-btn ${paymentMethod === pm.key ? 'pos-payment-btn--active' : ''}`}
                                                onClick={() => setPaymentMethod(pm.key)}
                                            >
                                                <span className="pos-payment-btn__icon">{pm.icon}</span>
                                                <span className="pos-payment-btn__label">{pm.label}</span>
                                            </button>
                                        ))}
                                    </div>

                                    <button
                                        className="btn btn--success btn--lg btn--full"
                                        onClick={completeSale}
                                        disabled={processing}
                                    >
                                        {processing ? '⏳ Processing...' : `✓ Complete Sale — ${formatCurrency(total)}`}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </Layout>
        </>
    );
}
