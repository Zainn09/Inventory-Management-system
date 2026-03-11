import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import { api, formatCurrency, formatDateTime } from '../lib/api';

export default function ReturnsPage() {
    const [returns, setReturns] = useState([]);
    const [showProcessModal, setShowProcessModal] = useState(false);
    const [invoiceSearch, setInvoiceSearch] = useState('');
    const [foundOrder, setFoundOrder] = useState(null);
    const [selectedItems, setSelectedItems] = useState({});
    const [reason, setReason] = useState('customer_request');
    const [processing, setProcessing] = useState(false);

    useEffect(() => { loadReturns(); }, []);

    async function loadReturns() {
        try {
            const data = await api('/returns');
            setReturns(data.returns || []);
        } catch (err) { console.error(err); }
    }

    async function searchOrder() {
        if (!invoiceSearch.trim()) return;
        try {
            // Search by invoice number from the orders list
            const data = await api(`/orders?limit=50`);
            const order = (data.orders || []).find(o =>
                o.invoiceNumber.toLowerCase().includes(invoiceSearch.toLowerCase())
            );
            if (order) {
                // Get full order detail
                const detail = await api(`/orders/${order.id}`);
                setFoundOrder(detail.order);
                setSelectedItems({});
            } else {
                alert('Order not found');
            }
        } catch (err) { alert('Error: ' + err.message); }
    }

    async function processReturn() {
        if (!foundOrder) return;
        const items = Object.entries(selectedItems)
            .filter(([, v]) => v.selected)
            .map(([orderItemId, v]) => ({ orderItemId, quantity: v.qty }));

        if (items.length === 0) { alert('Select at least one item to return'); return; }

        setProcessing(true);
        try {
            await api('/returns', {
                method: 'POST',
                body: JSON.stringify({
                    orderId: foundOrder.id,
                    items,
                    reason,
                    refundMethod: 'cash'
                })
            });
            setShowProcessModal(false);
            setFoundOrder(null);
            setInvoiceSearch('');
            loadReturns();
            alert('Return processed successfully!');
        } catch (err) {
            alert('Error: ' + err.message);
        } finally {
            setProcessing(false);
        }
    }

    return (
        <>
            <Head><title>Returns — Jewellery POS</title></Head>
            <Layout title="Returns & Refunds" subtitle="Process returns and view history">
                <div className="page">
                    <div className="page__header">
                        <div>
                            <h1 className="page__title">Returns</h1>
                            <p className="page__subtitle">{returns.length} returns processed</p>
                        </div>
                        <button className="btn btn--primary" onClick={() => { setShowProcessModal(true); setFoundOrder(null); setInvoiceSearch(''); }}>
                            ↩️ New Return
                        </button>
                    </div>

                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr><th>Return Invoice</th><th>Original Order</th><th>Reason</th><th>Items</th><th>Refund</th><th>Processed By</th><th>Date</th></tr>
                            </thead>
                            <tbody>
                                {returns.map(r => (
                                    <tr key={r.id}>
                                        <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 600 }}>{r.returnInvoice}</td>
                                        <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{r.order?.invoiceNumber}</td>
                                        <td><span className="badge badge--warning">{r.reason}</span></td>
                                        <td>{r._count?.items || 0}</td>
                                        <td style={{ fontWeight: 700, color: 'var(--color-danger)' }}>{formatCurrency(r.refundAmount)}</td>
                                        <td>{r.processedBy?.fullName}</td>
                                        <td style={{ fontSize: '0.82rem' }}>{formatDateTime(r.createdAt)}</td>
                                    </tr>
                                ))}
                                {returns.length === 0 && (
                                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--color-text-muted)' }}>No returns yet</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Process Return Modal */}
                {showProcessModal && (
                    <div className="modal-overlay" onClick={() => setShowProcessModal(false)}>
                        <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 650 }}>
                            <div className="modal__header">
                                <h3 className="modal__title">↩️ Process Return</h3>
                                <button className="btn btn--ghost btn--sm" onClick={() => setShowProcessModal(false)}>✕</button>
                            </div>
                            <div className="modal__body">
                                {/* Search order */}
                                <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
                                    <input
                                        className="input"
                                        placeholder="Search invoice number (e.g. INV-20260310-0001)"
                                        value={invoiceSearch}
                                        onChange={e => setInvoiceSearch(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && searchOrder()}
                                    />
                                    <button className="btn btn--primary" onClick={searchOrder}>🔍 Find</button>
                                </div>

                                {foundOrder && (
                                    <>
                                        <div style={{ padding: 'var(--space-md)', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-md)' }}>
                                            <div className="flex-between">
                                                <span style={{ fontWeight: 600 }}>{foundOrder.invoiceNumber}</span>
                                                <span>{formatCurrency(foundOrder.totalAmount)}</span>
                                            </div>
                                            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                                                {formatDateTime(foundOrder.createdAt)} • {foundOrder.customer?.fullName || 'Walk-in'}
                                            </div>
                                        </div>

                                        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 'var(--space-sm)' }}>Select items to return:</h4>
                                        {(foundOrder.items || []).map(item => (
                                            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', padding: 'var(--space-sm) var(--space-md)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-sm)' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedItems[item.id]?.selected || false}
                                                    onChange={e => setSelectedItems(prev => ({ ...prev, [item.id]: { ...prev[item.id], selected: e.target.checked, qty: prev[item.id]?.qty || item.quantity } }))}
                                                />
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{item.product?.name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Qty: {item.quantity} × {formatCurrency(item.unitPrice)}</div>
                                                </div>
                                                {selectedItems[item.id]?.selected && (
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max={item.quantity}
                                                        value={selectedItems[item.id]?.qty || item.quantity}
                                                        onChange={e => setSelectedItems(prev => ({ ...prev, [item.id]: { ...prev[item.id], qty: parseInt(e.target.value) } }))}
                                                        style={{ width: 60, padding: '4px 8px', border: '1px solid var(--color-border)', borderRadius: 4, textAlign: 'center', background: 'var(--color-bg-card)', color: 'var(--color-text-primary)' }}
                                                    />
                                                )}
                                                <span style={{ fontWeight: 600 }}>{formatCurrency(item.lineTotal)}</span>
                                            </div>
                                        ))}

                                        <div className="input-group mt-md">
                                            <label>Return Reason</label>
                                            <select className="input" value={reason} onChange={e => setReason(e.target.value)}>
                                                <option value="customer_request">Customer Request</option>
                                                <option value="defective">Defective Item</option>
                                                <option value="wrong_item">Wrong Item</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>
                                    </>
                                )}
                            </div>
                            {foundOrder && (
                                <div className="modal__footer">
                                    <button className="btn btn--secondary" onClick={() => setShowProcessModal(false)}>Cancel</button>
                                    <button className="btn btn--danger" onClick={processReturn} disabled={processing}>
                                        {processing ? '⏳ Processing...' : '↩️ Process Return'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Layout>
        </>
    );
}
