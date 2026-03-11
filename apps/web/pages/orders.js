import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import { api, formatCurrency, formatDateTime } from '../lib/api';

export default function OrdersPage() {
    const [orders, setOrders] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 0 });
    const [filterType, setFilterType] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);

    useEffect(() => { loadOrders(); }, [pagination.page, filterType, filterStatus]);

    async function loadOrders() {
        try {
            let url = `/orders?page=${pagination.page}&limit=15`;
            if (filterType) url += `&orderType=${filterType}`;
            if (filterStatus) url += `&status=${filterStatus}`;
            const data = await api(url);
            setOrders(data.orders || []);
            setPagination(data.pagination);
        } catch (err) { console.error(err); }
    }

    async function viewOrder(id) {
        try {
            const data = await api(`/orders/${id}`);
            setSelectedOrder(data.order);
        } catch (err) { console.error(err); }
    }

    const statusColors = { completed: 'success', pending: 'warning', returned: 'danger', partially_returned: 'warning' };

    return (
        <>
            <Head><title>Orders — Jewellery POS</title></Head>
            <Layout title="Orders" subtitle="All transactions">
                <div className="page">
                    <div className="page__header">
                        <div>
                            <h1 className="page__title">Orders</h1>
                            <p className="page__subtitle">{pagination.total} total orders</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
                        <select className="input" style={{ maxWidth: 160 }} value={filterType} onChange={e => { setFilterType(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}>
                            <option value="">All Types</option>
                            <option value="pos_sale">POS Sale</option>
                            <option value="online_order">Online Order</option>
                        </select>
                        <select className="input" style={{ maxWidth: 180 }} value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}>
                            <option value="">All Statuses</option>
                            <option value="completed">Completed</option>
                            <option value="pending">Pending</option>
                            <option value="returned">Returned</option>
                            <option value="partially_returned">Partially Returned</option>
                        </select>
                    </div>

                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr><th>Invoice</th><th>Date</th><th>Customer</th><th>Type</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th></th></tr>
                            </thead>
                            <tbody>
                                {orders.map(o => (
                                    <tr key={o.id}>
                                        <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 600 }}>{o.invoiceNumber}</td>
                                        <td style={{ fontSize: '0.82rem' }}>{formatDateTime(o.createdAt)}</td>
                                        <td>{o.customer?.fullName || 'Walk-in'}</td>
                                        <td><span className={`badge badge--${o.orderType === 'pos_sale' ? 'info' : 'purple'}`}>{o.orderType === 'pos_sale' ? '🏪 POS' : '🌐 Online'}</span></td>
                                        <td>{o._count?.items || 0}</td>
                                        <td style={{ fontWeight: 700 }}>{formatCurrency(o.totalAmount)}</td>
                                        <td><span className="badge badge--info">{o.payment?.method || '—'}</span></td>
                                        <td><span className={`badge badge--${statusColors[o.status] || 'info'}`}>{o.status}</span></td>
                                        <td><button className="btn btn--ghost btn--sm" onClick={() => viewOrder(o.id)}>👁️</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {pagination.pages > 1 && (
                        <div className="pagination">
                            <button className="pagination__btn" disabled={pagination.page <= 1} onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}>← Prev</button>
                            <span className="pagination__info">Page {pagination.page} of {pagination.pages}</span>
                            <button className="pagination__btn" disabled={pagination.page >= pagination.pages} onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}>Next →</button>
                        </div>
                    )}
                </div>

                {/* Order Detail Modal */}
                {selectedOrder && (
                    <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
                        <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 700 }}>
                            <div className="modal__header">
                                <h3 className="modal__title">📋 {selectedOrder.invoiceNumber}</h3>
                                <button className="btn btn--ghost btn--sm" onClick={() => setSelectedOrder(null)}>✕</button>
                            </div>
                            <div className="modal__body">
                                <div className="grid-3 mb-md">
                                    <div><strong style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>Date</strong><div style={{ fontSize: '0.88rem' }}>{formatDateTime(selectedOrder.createdAt)}</div></div>
                                    <div><strong style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>Cashier</strong><div style={{ fontSize: '0.88rem' }}>{selectedOrder.cashier?.fullName}</div></div>
                                    <div><strong style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>Customer</strong><div style={{ fontSize: '0.88rem' }}>{selectedOrder.customer?.fullName || 'Walk-in'}</div></div>
                                </div>

                                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 'var(--space-sm)' }}>Items</h4>
                                <div className="table-container mb-md" style={{ border: '1px solid var(--color-border)' }}>
                                    <table className="table">
                                        <thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
                                        <tbody>
                                            {(selectedOrder.items || []).map(item => (
                                                <tr key={item.id}>
                                                    <td><div style={{ fontWeight: 600 }}>{item.product?.name}</div><div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{item.product?.sku}</div></td>
                                                    <td>{item.quantity}</td>
                                                    <td>{formatCurrency(item.unitPrice)}</td>
                                                    <td style={{ fontWeight: 600 }}>{formatCurrency(item.lineTotal)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <div style={{ width: 250 }}>
                                        <div className="flex-between" style={{ fontSize: '0.88rem', marginBottom: 4 }}><span>Subtotal</span><span>{formatCurrency(selectedOrder.subtotal)}</span></div>
                                        <div className="flex-between" style={{ fontSize: '0.88rem', marginBottom: 4, color: 'var(--color-danger)' }}><span>Discount</span><span>- {formatCurrency(selectedOrder.discountAmount)}</span></div>
                                        <div className="flex-between" style={{ fontSize: '0.88rem', marginBottom: 4 }}><span>Tax</span><span>+ {formatCurrency(selectedOrder.taxAmount)}</span></div>
                                        <div className="flex-between" style={{ fontSize: '1.1rem', fontWeight: 800, paddingTop: 8, borderTop: '2px solid var(--color-border)' }}><span>Total</span><span style={{ color: 'var(--color-accent)' }}>{formatCurrency(selectedOrder.totalAmount)}</span></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Layout>
        </>
    );
}
