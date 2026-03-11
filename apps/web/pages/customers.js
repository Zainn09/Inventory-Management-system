import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import { api, formatCurrency, formatDate } from '../lib/api';

export default function CustomersPage() {
    const [customers, setCustomers] = useState([]);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editCustomer, setEditCustomer] = useState(null);
    const [form, setForm] = useState({});
    const [saving, setSaving] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    useEffect(() => { loadCustomers(); }, [search]);

    async function loadCustomers() {
        try {
            let url = '/customers?limit=50';
            if (search) url += `&search=${search}`;
            const data = await api(url);
            setCustomers(data.customers || []);
        } catch (err) { console.error(err); }
    }

    function openCreate() {
        setEditCustomer(null);
        setForm({ fullName: '', phone: '', email: '', address: '', dateOfBirth: '' });
        setShowModal(true);
    }

    function openEdit(c) {
        setEditCustomer(c);
        setForm({ fullName: c.fullName, phone: c.phone, email: c.email || '', address: c.address || '', dateOfBirth: c.dateOfBirth || '' });
        setShowModal(true);
    }

    async function saveCustomer(e) {
        e.preventDefault();
        setSaving(true);
        try {
            if (editCustomer) {
                await api(`/customers/${editCustomer.id}`, { method: 'PATCH', body: JSON.stringify(form) });
            } else {
                await api('/customers', { method: 'POST', body: JSON.stringify(form) });
            }
            setShowModal(false);
            loadCustomers();
        } catch (err) { alert('Error: ' + err.message); }
        finally { setSaving(false); }
    }

    async function viewCustomer(id) {
        try {
            const data = await api(`/customers/${id}`);
            setSelectedCustomer(data.customer);
        } catch (err) { console.error(err); }
    }

    return (
        <>
            <Head><title>Customers — Jewellery POS</title></Head>
            <Layout title="Customers" subtitle="Manage customer profiles">
                <div className="page">
                    <div className="page__header">
                        <div>
                            <h1 className="page__title">Customers</h1>
                            <p className="page__subtitle">{customers.length} registered customers</p>
                        </div>
                        <button className="btn btn--primary" onClick={openCreate}>+ Add Customer</button>
                    </div>

                    <input className="input input--search mb-lg" style={{ maxWidth: 320 }} placeholder="Search by name, phone, email..." value={search} onChange={e => setSearch(e.target.value)} />

                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr><th>Name</th><th>Phone</th><th>Email</th><th>Orders</th><th>Joined</th><th>Actions</th></tr>
                            </thead>
                            <tbody>
                                {customers.map(c => (
                                    <tr key={c.id}>
                                        <td style={{ fontWeight: 600 }}>{c.fullName}</td>
                                        <td>{c.phone}</td>
                                        <td>{c.email || '—'}</td>
                                        <td><span className="badge badge--purple">{c._count?.orders || 0}</span></td>
                                        <td style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>{formatDate(c.createdAt)}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 4 }}>
                                                <button className="btn btn--ghost btn--sm" onClick={() => viewCustomer(c.id)}>👁️</button>
                                                <button className="btn btn--ghost btn--sm" onClick={() => openEdit(c)}>✏️</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Customer Detail Modal */}
                {selectedCustomer && (
                    <div className="modal-overlay" onClick={() => setSelectedCustomer(null)}>
                        <div className="modal" onClick={e => e.stopPropagation()}>
                            <div className="modal__header">
                                <h3 className="modal__title">👤 {selectedCustomer.fullName}</h3>
                                <button className="btn btn--ghost btn--sm" onClick={() => setSelectedCustomer(null)}>✕</button>
                            </div>
                            <div className="modal__body">
                                <div className="grid-2 mb-md">
                                    <div><strong style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Phone</strong><div>{selectedCustomer.phone}</div></div>
                                    <div><strong style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Email</strong><div>{selectedCustomer.email || '—'}</div></div>
                                    <div><strong style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Address</strong><div>{selectedCustomer.address || '—'}</div></div>
                                    <div><strong style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Loyalty Points</strong><div style={{ fontWeight: 700, color: 'var(--color-gold)' }}>{selectedCustomer.loyaltyBalance || 0} pts</div></div>
                                </div>
                                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 'var(--space-sm)' }}>Recent Orders</h4>
                                {(selectedCustomer.orders || []).length === 0 ? (
                                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>No orders yet</p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                                        {selectedCustomer.orders.map(o => (
                                            <div key={o.id} className="flex-between" style={{ padding: '8px 12px', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                                                <span style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{o.invoiceNumber}</span>
                                                <span style={{ fontWeight: 600 }}>{formatCurrency(o.totalAmount)}</span>
                                                <span className={`badge badge--${o.status === 'completed' ? 'success' : 'warning'}`}>{o.status}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Add/Edit Modal */}
                {showModal && (
                    <div className="modal-overlay" onClick={() => setShowModal(false)}>
                        <div className="modal" onClick={e => e.stopPropagation()}>
                            <div className="modal__header">
                                <h3 className="modal__title">{editCustomer ? 'Edit Customer' : 'Add Customer'}</h3>
                                <button className="btn btn--ghost btn--sm" onClick={() => setShowModal(false)}>✕</button>
                            </div>
                            <form onSubmit={saveCustomer}>
                                <div className="modal__body">
                                    <div className="grid-2">
                                        <div className="input-group"><label>Full Name *</label><input className="input" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} required /></div>
                                        <div className="input-group"><label>Phone *</label><input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required /></div>
                                        <div className="input-group"><label>Email</label><input className="input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                                        <div className="input-group"><label>Date of Birth</label><input className="input" type="date" value={form.dateOfBirth} onChange={e => setForm({ ...form, dateOfBirth: e.target.value })} /></div>
                                    </div>
                                    <div className="input-group"><label>Address</label><textarea className="input" rows={2} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
                                </div>
                                <div className="modal__footer">
                                    <button type="button" className="btn btn--secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                    <button type="submit" className="btn btn--primary" disabled={saving}>{saving ? '⏳ Saving...' : editCustomer ? '💾 Update' : '+ Add Customer'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </Layout>
        </>
    );
}
