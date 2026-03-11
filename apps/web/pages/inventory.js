import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import { api, formatCurrency, METAL_EMOJIS } from '../lib/api';
import { printLabel } from '../lib/print';
import { BarcodeLabel } from '../components/PrintLayout';

export default function InventoryPage() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 0 });
    const [search, setSearch] = useState('');
    const [filterMetal, setFilterMetal] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editProduct, setEditProduct] = useState(null);
    const [form, setForm] = useState({});
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({});

    useEffect(() => {
        loadCategories();
        loadSettings();
    }, []);

    async function loadSettings() {
        try {
            const data = await api('/settings');
            setSettings(data.settings || {});
        } catch (err) { console.error(err); }
    }

    useEffect(() => {
        loadProducts();
    }, [search, filterMetal, filterCategory, pagination.page]);

    async function loadCategories() {
        try {
            const data = await api('/categories');
            setCategories(data.categories || []);
        } catch (err) { console.error(err); }
    }

    async function loadProducts() {
        try {
            let url = `/products?page=${pagination.page}&limit=15`;
            if (search) url += `&search=${search}`;
            if (filterMetal) url += `&metalType=${filterMetal}`;
            if (filterCategory) url += `&category=${filterCategory}`;
            const data = await api(url);
            setProducts(data.products || []);
            setPagination(data.pagination);
        } catch (err) { console.error(err); }
    }

    function openCreate() {
        setEditProduct(null);
        setForm({ name: '', description: '', categoryId: '', metalType: 'gold', purity: 91.6, weightGrams: 0, makingCharges: 0, costPrice: 0, sellingPrice: 0, quantity: 0, lowStockThreshold: 5 });
        setShowModal(true);
    }

    function openEdit(product) {
        setEditProduct(product);
        setForm({
            name: product.name, description: product.description || '', categoryId: product.categoryId || '',
            metalType: product.metalType, purity: product.purity || 0, weightGrams: product.weightGrams,
            makingCharges: product.makingCharges, costPrice: product.costPrice, sellingPrice: product.sellingPrice,
            quantity: product.quantity, lowStockThreshold: product.lowStockThreshold
        });
        setShowModal(true);
    }

    async function saveProduct(e) {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = { ...form, purity: parseFloat(form.purity), weightGrams: parseFloat(form.weightGrams), makingCharges: parseFloat(form.makingCharges), costPrice: parseFloat(form.costPrice), sellingPrice: parseFloat(form.sellingPrice), quantity: parseInt(form.quantity), lowStockThreshold: parseInt(form.lowStockThreshold) };
            if (editProduct) {
                await api(`/products/${editProduct.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
            } else {
                await api('/products', { method: 'POST', body: JSON.stringify(payload) });
            }
            setShowModal(false);
            loadProducts();
        } catch (err) {
            alert('Error: ' + err.message);
        } finally {
            setSaving(false);
        }
    }

    async function deleteProduct(id) {
        if (!confirm('Deactivate this product?')) return;
        try {
            await api(`/products/${id}`, { method: 'DELETE' });
            loadProducts();
        } catch (err) { alert('Error: ' + err.message); }
    }

    return (
        <>
            <Head><title>Inventory — Jewellery POS</title></Head>
            <Layout title="Inventory" subtitle="Manage your jewellery stock">
                <div className="page">
                    <div className="page__header">
                        <div>
                            <h1 className="page__title">Products</h1>
                            <p className="page__subtitle">{pagination.total} items in inventory</p>
                        </div>
                        <button className="btn btn--primary" onClick={openCreate}>+ Add Product</button>
                    </div>

                    {/* Filters */}
                    <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)', flexWrap: 'wrap' }}>
                        <input
                            className="input input--search"
                            style={{ maxWidth: 300 }}
                            placeholder="Search by name or SKU..."
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
                        />
                        <select className="input" style={{ maxWidth: 160 }} value={filterMetal} onChange={e => { setFilterMetal(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}>
                            <option value="">All Metals</option>
                            <option value="gold">Gold</option>
                            <option value="silver">Silver</option>
                            <option value="platinum">Platinum</option>
                            <option value="diamond">Diamond</option>
                            <option value="other">Other</option>
                        </select>
                        <select className="input" style={{ maxWidth: 180 }} value={filterCategory} onChange={e => { setFilterCategory(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}>
                            <option value="">All Categories</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    {/* Table */}
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>SKU</th>
                                    <th>Barcode</th>
                                    <th>Metal</th>
                                    <th>Weight</th>
                                    <th>Cost</th>
                                    <th>Price</th>
                                    <th>Qty</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map(p => (
                                    <tr key={p.id}>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{p.name}</div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{p.category?.name || ''}</div>
                                        </td>
                                        <td><span style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{p.sku}</span></td>
                                        <td><span style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{p.barcode?.barcodeValue || '—'}</span></td>
                                        <td>
                                            <span className={`badge badge--${p.metalType === 'gold' ? 'gold' : p.metalType === 'silver' ? 'info' : p.metalType === 'diamond' ? 'purple' : 'warning'}`}>
                                                {METAL_EMOJIS[p.metalType]} {p.metalType}
                                            </span>
                                        </td>
                                        <td>{p.weightGrams}g</td>
                                        <td>{formatCurrency(p.costPrice)}</td>
                                        <td style={{ fontWeight: 600 }}>{formatCurrency(p.sellingPrice)}</td>
                                        <td>
                                            <span className={`badge ${p.quantity <= p.lowStockThreshold ? 'badge--danger' : 'badge--success'}`}>
                                                {p.quantity}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 4 }}>
                                                <button className="btn btn--ghost btn--sm" title="Print Tag" onClick={() => printLabel(p)}>🏷️</button>
                                                <button className="btn btn--ghost btn--sm" title="Edit" onClick={() => openEdit(p)}>✏️</button>
                                                <button className="btn btn--ghost btn--sm" title="Delete" onClick={() => deleteProduct(p.id)}>🗑️</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination.pages > 1 && (
                        <div className="pagination">
                            <button className="pagination__btn" disabled={pagination.page <= 1} onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}>← Prev</button>
                            <span className="pagination__info">Page {pagination.page} of {pagination.pages}</span>
                            <button className="pagination__btn" disabled={pagination.page >= pagination.pages} onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}>Next →</button>
                        </div>
                    )}
                </div>

                {/* Add/Edit Modal */}
                {showModal && (
                    <div className="modal-overlay" onClick={() => setShowModal(false)}>
                        <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 700 }}>
                            <div className="modal__header">
                                <h3 className="modal__title">{editProduct ? 'Edit Product' : 'Add New Product'}</h3>
                                <button className="btn btn--ghost btn--sm" onClick={() => setShowModal(false)}>✕</button>
                            </div>
                            <form onSubmit={saveProduct}>
                                <div className="modal__body">
                                    <div className="grid-2">
                                        <div className="input-group">
                                            <label>Product Name *</label>
                                            <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                                        </div>
                                        <div className="input-group">
                                            <label>Category</label>
                                            <select className="input" value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })}>
                                                <option value="">Select Category</option>
                                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="input-group">
                                            <label>Metal Type</label>
                                            <select className="input" value={form.metalType} onChange={e => setForm({ ...form, metalType: e.target.value })}>
                                                <option value="gold">Gold</option>
                                                <option value="silver">Silver</option>
                                                <option value="platinum">Platinum</option>
                                                <option value="diamond">Diamond</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>
                                        <div className="input-group">
                                            <label>Purity (%)</label>
                                            <input className="input" type="number" step="0.1" value={form.purity} onChange={e => setForm({ ...form, purity: e.target.value })} />
                                        </div>
                                        <div className="input-group">
                                            <label>Weight (grams)</label>
                                            <input className="input" type="number" step="0.01" value={form.weightGrams} onChange={e => setForm({ ...form, weightGrams: e.target.value })} />
                                        </div>
                                        <div className="input-group">
                                            <label>Making Charges</label>
                                            <input className="input" type="number" value={form.makingCharges} onChange={e => setForm({ ...form, makingCharges: e.target.value })} />
                                        </div>
                                        <div className="input-group">
                                            <label>Cost Price</label>
                                            <input className="input" type="number" value={form.costPrice} onChange={e => setForm({ ...form, costPrice: e.target.value })} />
                                        </div>
                                        <div className="input-group">
                                            <label>Selling Price *</label>
                                            <input className="input" type="number" value={form.sellingPrice} onChange={e => setForm({ ...form, sellingPrice: e.target.value })} required />
                                        </div>
                                        <div className="input-group">
                                            <label>Quantity</label>
                                            <input className="input" type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
                                        </div>
                                        <div className="input-group">
                                            <label>Low Stock Threshold</label>
                                            <input className="input" type="number" value={form.lowStockThreshold} onChange={e => setForm({ ...form, lowStockThreshold: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="input-group">
                                        <label>Description</label>
                                        <textarea className="input" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                                    </div>
                                </div>
                                <div className="modal__footer">
                                    <div style={{ flex: 1 }}>
                                        {editProduct && (
                                            <button type="button" className="btn btn--secondary" onClick={() => printLabel(editProduct)}>🖨️ Print Label</button>
                                        )}
                                    </div>
                                    <button type="button" className="btn btn--secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                    <button type="submit" className="btn btn--primary" disabled={saving}>
                                        {saving ? '⏳ Saving...' : editProduct ? '💾 Update' : '+ Create Product'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </Layout>
        </>
    );
}
