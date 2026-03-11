import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import { api, formatCurrency } from '../lib/api';

export default function ReportsPage() {
    const [activeReport, setActiveReport] = useState('daily');
    const [dailyData, setDailyData] = useState(null);
    const [salesData, setSalesData] = useState(null);
    const [categoryData, setCategoryData] = useState(null);
    const [inventoryData, setInventoryData] = useState(null);
    const [profitData, setProfitData] = useState(null);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => { loadReport(activeReport); }, [activeReport]);

    async function loadReport(type) {
        setLoading(true);
        try {
            switch (type) {
                case 'daily':
                    const daily = await api('/reports/daily-sales');
                    setDailyData(daily);
                    break;
                case 'sales':
                    let url = '/reports/sales';
                    const params = [];
                    if (dateFrom) params.push(`from=${dateFrom}`);
                    if (dateTo) params.push(`to=${dateTo}`);
                    if (params.length) url += '?' + params.join('&');
                    const sales = await api(url);
                    setSalesData(sales);
                    break;
                case 'category':
                    const cat = await api('/reports/sales-by-category');
                    setCategoryData(cat);
                    break;
                case 'inventory':
                    const inv = await api('/reports/inventory');
                    setInventoryData(inv);
                    break;
                case 'profit':
                    let pUrl = '/reports/profit';
                    const pParams = [];
                    if (dateFrom) pParams.push(`from=${dateFrom}`);
                    if (dateTo) pParams.push(`to=${dateTo}`);
                    if (pParams.length) pUrl += '?' + pParams.join('&');
                    const profit = await api(pUrl);
                    setProfitData(profit);
                    break;
            }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }

    const reports = [
        { key: 'daily', label: '📅 Daily Sales', icon: '📊' },
        { key: 'sales', label: '📈 Sales Range', icon: '📈' },
        { key: 'category', label: '🏷️ By Category', icon: '🏷️' },
        { key: 'inventory', label: '📦 Inventory', icon: '📦' },
        { key: 'profit', label: '💰 Profit', icon: '💰' }
    ];

    return (
        <>
            <Head><title>Reports — Jewellery POS</title></Head>
            <Layout title="Reports & Analytics" subtitle="Business intelligence">
                <div className="page">
                    {/* Report tabs */}
                    <div className="category-tabs mb-lg">
                        {reports.map(r => (
                            <button
                                key={r.key}
                                className={`category-tab ${activeReport === r.key ? 'category-tab--active' : ''}`}
                                onClick={() => setActiveReport(r.key)}
                            >{r.label}</button>
                        ))}
                    </div>

                    {/* Date filters for sales & profit */}
                    {(activeReport === 'sales' || activeReport === 'profit') && (
                        <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)', alignItems: 'flex-end' }}>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label>From</label>
                                <input className="input" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                            </div>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label>To</label>
                                <input className="input" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
                            </div>
                            <button className="btn btn--primary" onClick={() => loadReport(activeReport)}>Apply</button>
                        </div>
                    )}

                    {loading && <div className="empty-state"><div className="empty-state__icon">⏳</div><div className="empty-state__text">Loading report...</div></div>}

                    {/* Daily Sales */}
                    {activeReport === 'daily' && dailyData && !loading && (
                        <div>
                            <div className="stat-grid">
                                <div className="stat-card">
                                    <div className="stat-card__icon stat-card__icon--purple">💰</div>
                                    <div><div className="stat-card__label">Revenue</div><div className="stat-card__value">{formatCurrency(dailyData.totalRevenue)}</div></div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-card__icon stat-card__icon--blue">🛒</div>
                                    <div><div className="stat-card__label">Orders</div><div className="stat-card__value">{dailyData.totalOrders}</div></div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-card__icon stat-card__icon--green">📦</div>
                                    <div><div className="stat-card__label">Items Sold</div><div className="stat-card__value">{dailyData.totalItems}</div></div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-card__icon stat-card__icon--gold">📊</div>
                                    <div><div className="stat-card__label">Avg. Order</div><div className="stat-card__value">{formatCurrency(dailyData.averageOrderValue)}</div></div>
                                </div>
                            </div>

                            {dailyData.paymentBreakdown && Object.keys(dailyData.paymentBreakdown).length > 0 && (
                                <div className="card mb-lg">
                                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--space-md)' }}>💳 Payment Breakdown</h3>
                                    <div className="grid-3">
                                        {Object.entries(dailyData.paymentBreakdown).map(([method, amount]) => (
                                            <div key={method} style={{ padding: 'var(--space-md)', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                                                <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{method}</div>
                                                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-accent)' }}>{formatCurrency(amount)}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Sales by Range */}
                    {activeReport === 'sales' && salesData && !loading && (
                        <div>
                            <div className="stat-grid">
                                <div className="stat-card"><div className="stat-card__icon stat-card__icon--purple">💰</div><div><div className="stat-card__label">Total Revenue</div><div className="stat-card__value">{formatCurrency(salesData.totalRevenue)}</div></div></div>
                                <div className="stat-card"><div className="stat-card__icon stat-card__icon--blue">🛒</div><div><div className="stat-card__label">Total Orders</div><div className="stat-card__value">{salesData.totalOrders}</div></div></div>
                                <div className="stat-card"><div className="stat-card__icon stat-card__icon--red">🏷️</div><div><div className="stat-card__label">Discounts Given</div><div className="stat-card__value">{formatCurrency(salesData.totalDiscount)}</div></div></div>
                                <div className="stat-card"><div className="stat-card__icon stat-card__icon--green">📊</div><div><div className="stat-card__label">Tax Collected</div><div className="stat-card__value">{formatCurrency(salesData.totalTax)}</div></div></div>
                            </div>

                            {salesData.dailySales && salesData.dailySales.length > 0 && (
                                <div className="card">
                                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--space-md)' }}>📅 Daily Breakdown</h3>
                                    <div className="table-container" style={{ border: 'none' }}>
                                        <table className="table">
                                            <thead><tr><th>Date</th><th>Orders</th><th>Revenue</th></tr></thead>
                                            <tbody>
                                                {salesData.dailySales.map(day => (
                                                    <tr key={day.date}>
                                                        <td style={{ fontWeight: 500 }}>{day.date}</td>
                                                        <td>{day.orders}</td>
                                                        <td style={{ fontWeight: 700 }}>{formatCurrency(day.revenue)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* By Category */}
                    {activeReport === 'category' && categoryData && !loading && (
                        <div className="card">
                            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--space-md)' }}>🏷️ Sales by Category</h3>
                            <div className="table-container" style={{ border: 'none' }}>
                                <table className="table">
                                    <thead><tr><th>Category</th><th>Items Sold</th><th>Revenue</th><th>Share</th></tr></thead>
                                    <tbody>
                                        {(categoryData.categories || []).map(cat => {
                                            const totalRev = (categoryData.categories || []).reduce((s, c) => s + c.totalRevenue, 0);
                                            const share = totalRev > 0 ? ((cat.totalRevenue / totalRev) * 100).toFixed(1) : 0;
                                            return (
                                                <tr key={cat.id}>
                                                    <td style={{ fontWeight: 600 }}>{cat.name}</td>
                                                    <td>{cat.totalSold}</td>
                                                    <td style={{ fontWeight: 700 }}>{formatCurrency(cat.totalRevenue)}</td>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                                            <div style={{ width: 100, height: 8, background: 'var(--color-bg-secondary)', borderRadius: 4, overflow: 'hidden' }}>
                                                                <div style={{ width: `${share}%`, height: '100%', background: 'var(--color-accent)', borderRadius: 4 }} />
                                                            </div>
                                                            <span style={{ fontSize: '0.82rem' }}>{share}%</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Inventory */}
                    {activeReport === 'inventory' && inventoryData && !loading && (
                        <div>
                            <div className="stat-grid">
                                <div className="stat-card"><div className="stat-card__icon stat-card__icon--blue">📦</div><div><div className="stat-card__label">Total Products</div><div className="stat-card__value">{inventoryData.totalProducts}</div></div></div>
                                <div className="stat-card"><div className="stat-card__icon stat-card__icon--green">🔢</div><div><div className="stat-card__label">Total Quantity</div><div className="stat-card__value">{inventoryData.totalQuantity}</div></div></div>
                                <div className="stat-card"><div className="stat-card__icon stat-card__icon--gold">💰</div><div><div className="stat-card__label">Cost Value</div><div className="stat-card__value">{formatCurrency(inventoryData.totalCostValue)}</div></div></div>
                                <div className="stat-card"><div className="stat-card__icon stat-card__icon--purple">🏷️</div><div><div className="stat-card__label">Retail Value</div><div className="stat-card__value">{formatCurrency(inventoryData.totalRetailValue)}</div></div></div>
                            </div>

                            {inventoryData.lowStockCount > 0 && (
                                <div style={{ padding: 'var(--space-md)', background: 'var(--color-warning-light)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-lg)', display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                                    <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                                    <span style={{ fontWeight: 600 }}>{inventoryData.lowStockCount} items are below their low stock threshold</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Profit */}
                    {activeReport === 'profit' && profitData && !loading && (
                        <div className="stat-grid">
                            <div className="stat-card"><div className="stat-card__icon stat-card__icon--purple">💰</div><div><div className="stat-card__label">Total Revenue</div><div className="stat-card__value">{formatCurrency(profitData.totalRevenue)}</div></div></div>
                            <div className="stat-card"><div className="stat-card__icon stat-card__icon--red">📉</div><div><div className="stat-card__label">Total Cost</div><div className="stat-card__value">{formatCurrency(profitData.totalCost)}</div></div></div>
                            <div className="stat-card"><div className="stat-card__icon stat-card__icon--green">📈</div><div><div className="stat-card__label">Gross Profit</div><div className="stat-card__value">{formatCurrency(profitData.grossProfit)}</div></div></div>
                            <div className="stat-card"><div className="stat-card__icon stat-card__icon--gold">🎯</div><div><div className="stat-card__label">Margin</div><div className="stat-card__value">{profitData.marginPercentage}%</div></div></div>
                        </div>
                    )}
                </div>
            </Layout>
        </>
    );
}
