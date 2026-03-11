import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import { api, formatCurrency, formatDate } from '../lib/api';

export default function DashboardPage() {
    const [stats, setStats] = useState(null);
    const [recentOrders, setRecentOrders] = useState([]);
    const [lowStock, setLowStock] = useState([]);
    const [goldRates, setGoldRates] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboard();
    }, []);

    async function loadDashboard() {
        try {
            const [salesData, ordersData, stockData, ratesData] = await Promise.all([
                api('/reports/daily-sales').catch(() => ({ totalRevenue: 0, totalOrders: 0, totalItems: 0 })),
                api('/orders?limit=8').catch(() => ({ orders: [] })),
                api('/products/low-stock').catch(() => ({ products: [], count: 0 })),
                api('/settings/gold-rates').catch(() => ({ rates: [] }))
            ]);

            setStats({
                revenue: salesData.totalRevenue || 0,
                orders: salesData.totalOrders || 0,
                items: salesData.totalItems || 0,
                avgOrder: salesData.averageOrderValue || 0,
                lowStockCount: stockData.count || 0
            });
            setRecentOrders(ordersData.orders || []);
            setLowStock((stockData.products || []).slice(0, 5));
            setGoldRates(ratesData.rates || []);
        } catch (err) {
            console.error('Dashboard load error:', err);
        } finally {
            setLoading(false);
        }
    }

    const rateLabels = { gold_24k: '24K Gold', gold_22k: '22K Gold', gold_18k: '18K Gold', silver: 'Silver', platinum: 'Platinum' };

    return (
        <>
            <Head><title>Dashboard — Jewellery POS</title></Head>
            <Layout title="Dashboard" subtitle="Overview of your store">
                <div className="page">
                    {/* Stat Cards */}
                    <div className="stat-grid">
                        <div className="stat-card">
                            <div className="stat-card__icon stat-card__icon--purple">💰</div>
                            <div>
                                <div className="stat-card__label">Today's Revenue</div>
                                <div className="stat-card__value">{formatCurrency(stats?.revenue || 0)}</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-card__icon stat-card__icon--blue">🛒</div>
                            <div>
                                <div className="stat-card__label">Orders Today</div>
                                <div className="stat-card__value">{stats?.orders || 0}</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-card__icon stat-card__icon--green">📦</div>
                            <div>
                                <div className="stat-card__label">Items Sold</div>
                                <div className="stat-card__value">{stats?.items || 0}</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-card__icon stat-card__icon--red">⚠️</div>
                            <div>
                                <div className="stat-card__label">Low Stock Items</div>
                                <div className="stat-card__value">{stats?.lowStockCount || 0}</div>
                            </div>
                        </div>
                    </div>

                    <div className="grid-2" style={{ gap: 'var(--space-lg)' }}>
                        {/* Recent Orders */}
                        <div className="card">
                            <div className="flex-between mb-md">
                                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Recent Orders</h3>
                                <button className="btn btn--ghost btn--sm" onClick={() => window.location.href = '/orders'}>View All →</button>
                            </div>
                            {recentOrders.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-state__icon">📋</div>
                                    <div className="empty-state__text">No orders yet today</div>
                                </div>
                            ) : (
                                <div className="table-container" style={{ border: 'none' }}>
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>Invoice</th>
                                                <th>Customer</th>
                                                <th>Amount</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recentOrders.map(order => (
                                                <tr key={order.id}>
                                                    <td style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '0.8rem' }}>{order.invoiceNumber}</td>
                                                    <td>{order.customer?.fullName || 'Walk-in'}</td>
                                                    <td style={{ fontWeight: 600 }}>{formatCurrency(order.totalAmount)}</td>
                                                    <td>
                                                        <span className={`badge badge--${order.status === 'completed' ? 'success' : order.status === 'returned' ? 'danger' : 'warning'}`}>
                                                            {order.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Right column */}
                        <div>
                            {/* Gold Rates */}
                            <div className="card mb-lg">
                                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--space-md)' }}>📊 Metal Rates (per gram)</h3>
                                {goldRates.length === 0 ? (
                                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>No rates available</p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                                        {goldRates.map(rate => (
                                            <div key={rate.id} className="flex-between" style={{ padding: '8px 12px', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                                                <span style={{ fontWeight: 500, fontSize: '0.88rem' }}>{rateLabels[rate.metalType] || rate.metalType}</span>
                                                <span style={{ fontWeight: 700, color: 'var(--color-gold)' }}>{formatCurrency(rate.ratePerGram)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Low Stock */}
                            <div className="card">
                                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--space-md)' }}>⚠️ Low Stock Alerts</h3>
                                {lowStock.length === 0 ? (
                                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>All items well stocked ✅</p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                                        {lowStock.map(p => (
                                            <div key={p.id} className="flex-between" style={{ padding: '8px 12px', background: 'var(--color-danger-light)', borderRadius: 'var(--radius-sm)' }}>
                                                <span style={{ fontSize: '0.85rem' }}>{p.name}</span>
                                                <span className="badge badge--danger">{p.quantity} left</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </Layout>
        </>
    );
}
