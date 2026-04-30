import { useState, useEffect, useMemo } from 'react';
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
    const [refundMethod, setRefundMethod] = useState('cash');
    const [notes, setNotes] = useState('');
    const [processing, setProcessing] = useState(false);
    const [searching, setSearching] = useState(false);
    const [expandedReturn, setExpandedReturn] = useState(null);

    useEffect(() => { loadReturns(); }, []);

    async function loadReturns() {
        try {
            const data = await api('/returns');
            setReturns(data.returns || []);
        } catch (err) { console.error(err); }
    }

    async function searchOrder() {
        if (!invoiceSearch.trim()) return;
        setSearching(true);
        try {
            const data = await api(`/orders?limit=50`);
            const order = (data.orders || []).find(o =>
                o.invoiceNumber.toLowerCase().includes(invoiceSearch.toLowerCase())
            );
            if (order) {
                const detail = await api(`/orders/${order.id}`);
                setFoundOrder(detail.order);
                setSelectedItems({});
            } else {
                alert('Order not found for: ' + invoiceSearch);
            }
        } catch (err) { alert('Error: ' + err.message); }
        finally { setSearching(false); }
    }

    // Calculate refund preview
    const refundPreview = useMemo(() => {
        if (!foundOrder) return { items: 0, amount: 0 };
        let totalItems = 0;
        let totalAmount = 0;
        Object.entries(selectedItems).forEach(([itemId, v]) => {
            if (v.selected) {
                const orderItem = (foundOrder.items || []).find(i => i.id === itemId);
                if (orderItem) {
                    const qty = v.qty || orderItem.quantity;
                    const refund = (orderItem.lineTotal / orderItem.quantity) * qty;
                    totalItems += qty;
                    totalAmount += refund;
                }
            }
        });
        return { items: totalItems, amount: totalAmount };
    }, [selectedItems, foundOrder]);

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
                    refundMethod,
                    notes: notes.trim() || undefined
                })
            });
            setShowProcessModal(false);
            setFoundOrder(null);
            setInvoiceSearch('');
            setNotes('');
            setRefundMethod('cash');
            loadReturns();
            alert('✅ Return processed successfully! Refund: ' + formatCurrency(refundPreview.amount));
        } catch (err) {
            alert('Error: ' + err.message);
        } finally {
            setProcessing(false);
        }
    }

    function openModal() {
        setShowProcessModal(true);
        setFoundOrder(null);
        setInvoiceSearch('');
        setSelectedItems({});
        setReason('customer_request');
        setRefundMethod('cash');
        setNotes('');
    }

    const reasonLabels = {
        customer_request: '🔄 Customer Request',
        defective: '⚠️ Defective',
        wrong_item: '❌ Wrong Item',
        other: '📝 Other'
    };

    const refundMethodLabels = {
        cash: '💵 Cash Refund',
        card: '💳 Card Refund',
        store_credit: '🎁 Store Credit'
    };

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
                        <button className="btn btn--primary" onClick={openModal}>
                            ↩️ New Return
                        </button>
                    </div>

                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Return Invoice</th>
                                    <th>Original Order</th>
                                    <th>Reason</th>
                                    <th>Items</th>
                                    <th>Refund</th>
                                    <th>Method</th>
                                    <th>Processed By</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {returns.map(r => (
                                    <tr key={r.id} onClick={() => setExpandedReturn(expandedReturn === r.id ? null : r.id)} style={{ cursor: 'pointer' }}>
                                        <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 600 }}>{r.returnInvoice}</td>
                                        <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{r.order?.invoiceNumber}</td>
                                        <td><span className="badge badge--warning">{reasonLabels[r.reason] || r.reason}</span></td>
                                        <td>{r._count?.items || 0}</td>
                                        <td style={{ fontWeight: 700, color: 'var(--color-danger)' }}>{formatCurrency(r.refundAmount)}</td>
                                        <td><span className="badge badge--info">{r.refundMethod || 'cash'}</span></td>
                                        <td>{r.processedBy?.fullName}</td>
                                        <td style={{ fontSize: '0.82rem' }}>{formatDateTime(r.createdAt)}</td>
                                    </tr>
                                ))}
                                {returns.length === 0 && (
                                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--color-text-muted)' }}>No returns yet</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Process Return Modal */}
                {showProcessModal && (
                    <div className="modal-overlay" onClick={() => setShowProcessModal(false)}>
                        <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 700 }}>
                            <div className="modal__header">
                                <h3 className="modal__title">↩️ Process Return</h3>
                                <button className="btn btn--ghost btn--sm" onClick={() => setShowProcessModal(false)}>✕</button>
                            </div>
                            <div className="modal__body">
                                {/* Search order */}
                                <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
                                    <input
                                        className="input"
                                        placeholder="Search invoice number (e.g. INV-20260319-0001)"
                                        value={invoiceSearch}
                                        onChange={e => setInvoiceSearch(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && searchOrder()}
                                        autoFocus
                                    />
                                    <button className="btn btn--primary" onClick={searchOrder} disabled={searching}>
                                        {searching ? '⏳' : '🔍'} Find
                                    </button>
                                </div>

                                {foundOrder && (
                                    <>
                                        {/* Order summary card */}
                                        <div style={{ padding: 'var(--space-md)', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-md)', border: '1px solid var(--color-border)' }}>
                                            <div className="flex-between">
                                                <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>{foundOrder.invoiceNumber}</span>
                                                <span style={{ fontWeight: 700, color: 'var(--color-accent)' }}>{formatCurrency(foundOrder.totalAmount)}</span>
                                            </div>
                                            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
                                                {formatDateTime(foundOrder.createdAt)} • {foundOrder.customer?.fullName || 'Walk-in'} • Status: <span className={`badge ${foundOrder.status === 'completed' ? 'badge--success' : 'badge--warning'}`}>{foundOrder.status}</span>
                                            </div>
                                        </div>

                                        {/* Items to return */}
                                        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 'var(--space-sm)' }}>Select items to return:</h4>
                                        {(foundOrder.items || []).map(item => {
                                            const isSelected = selectedItems[item.id]?.selected || false;
                                            const returnQty = selectedItems[item.id]?.qty || item.quantity;
                                            const itemRefund = isSelected ? (item.lineTotal / item.quantity) * returnQty : 0;

                                            return (
                                                <div key={item.id} style={{
                                                    display: 'flex', alignItems: 'center', gap: 'var(--space-md)',
                                                    padding: 'var(--space-sm) var(--space-md)',
                                                    border: `2px solid ${isSelected ? 'var(--color-danger)' : 'var(--color-border)'}`,
                                                    borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-sm)',
                                                    background: isSelected ? 'var(--color-danger-light)' : 'transparent',
                                                    transition: 'all 150ms ease'
                                                }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={e => setSelectedItems(prev => ({
                                                            ...prev,
                                                            [item.id]: { ...prev[item.id], selected: e.target.checked, qty: prev[item.id]?.qty || item.quantity }
                                                        }))}
                                                        style={{ width: 18, height: 18, cursor: 'pointer' }}
                                                    />
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{item.product?.name}</div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                                            {item.product?.sku} • {item.quantity} × {formatCurrency(item.unitPrice)}
                                                            {item.product?.weightGrams && ` • ${item.product.weightGrams}g`}
                                                            {item.product?.metalType && ` • ${item.product.metalType.toUpperCase()}`}
                                                        </div>
                                                    </div>
                                                    {isSelected && (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                                                            <label style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>Qty:</label>
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                max={item.quantity}
                                                                value={returnQty}
                                                                onChange={e => setSelectedItems(prev => ({
                                                                    ...prev,
                                                                    [item.id]: { ...prev[item.id], qty: Math.min(parseInt(e.target.value) || 1, item.quantity) }
                                                                }))}
                                                                style={{ width: 55, padding: '4px 8px', border: '1px solid var(--color-border)', borderRadius: 4, textAlign: 'center', background: 'var(--color-bg-card)', color: 'var(--color-text-primary)', fontSize: '0.88rem', fontWeight: 600 }}
                                                            />
                                                        </div>
                                                    )}
                                                    <div style={{ textAlign: 'right', minWidth: 80 }}>
                                                        <div style={{ fontWeight: 600 }}>{formatCurrency(item.lineTotal)}</div>
                                                        {isSelected && (
                                                            <div style={{ fontSize: '0.72rem', color: 'var(--color-danger)', fontWeight: 700 }}>
                                                                Refund: {formatCurrency(itemRefund)}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {/* Refund Preview */}
                                        {refundPreview.items > 0 && (
                                            <div style={{
                                                margin: 'var(--space-md) 0',
                                                padding: 'var(--space-md)',
                                                background: 'var(--color-danger-light)',
                                                border: '2px solid var(--color-danger)',
                                                borderRadius: 'var(--radius-md)',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}>
                                                <div>
                                                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>📊 Refund Summary</div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                                                        {refundPreview.items} item(s) being returned
                                                    </div>
                                                </div>
                                                <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--color-danger)' }}>
                                                    {formatCurrency(refundPreview.amount)}
                                                </div>
                                            </div>
                                        )}

                                        {/* Reason & Refund Method */}
                                        <div className="grid-2" style={{ marginTop: 'var(--space-md)' }}>
                                            <div className="input-group">
                                                <label>Return Reason</label>
                                                <select className="input" value={reason} onChange={e => setReason(e.target.value)}>
                                                    <option value="customer_request">🔄 Customer Request</option>
                                                    <option value="defective">⚠️ Defective Item</option>
                                                    <option value="wrong_item">❌ Wrong Item</option>
                                                    <option value="other">📝 Other</option>
                                                </select>
                                            </div>
                                            <div className="input-group">
                                                <label>Refund Method</label>
                                                <select className="input" value={refundMethod} onChange={e => setRefundMethod(e.target.value)}>
                                                    <option value="cash">💵 Cash</option>
                                                    <option value="card">💳 Card Reversal</option>
                                                    <option value="store_credit">🎁 Store Credit</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* Notes */}
                                        <div className="input-group">
                                            <label>Notes (optional)</label>
                                            <textarea
                                                className="input"
                                                rows={2}
                                                placeholder="Add any additional notes about this return..."
                                                value={notes}
                                                onChange={e => setNotes(e.target.value)}
                                                style={{ resize: 'vertical', minHeight: 60 }}
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                            {foundOrder && (
                                <div className="modal__footer">
                                    <button className="btn btn--secondary" onClick={() => setShowProcessModal(false)}>Cancel</button>
                                    <button
                                        className="btn btn--danger"
                                        onClick={processReturn}
                                        disabled={processing || refundPreview.items === 0}
                                    >
                                        {processing ? '⏳ Processing...' : `↩️ Process Return — ${formatCurrency(refundPreview.amount)}`}
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
