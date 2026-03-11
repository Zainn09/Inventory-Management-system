import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import { api, getUser } from '../lib/api';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('store');
    const [settings, setSettings] = useState({});
    const [users, setUsers] = useState([]);
    const [categories, setCategories] = useState([]);
    const [saving, setSaving] = useState(false);
    const [showUserModal, setShowUserModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [userForm, setUserForm] = useState({ email: '', password: '', fullName: '', role: 'cashier' });
    const [catForm, setCatForm] = useState({ name: '', description: '' });
    const currentUser = getUser();

    useEffect(() => {
        loadSettings();
        loadUsers();
        loadCategories();
    }, []);

    async function loadSettings() {
        try {
            const data = await api('/settings');
            setSettings(data.settings || {});
        } catch (err) { console.error(err); }
    }

    async function loadUsers() {
        try {
            const data = await api('/users');
            setUsers(data.users || []);
        } catch (err) { console.error(err); }
    }

    async function loadCategories() {
        try {
            const data = await api('/categories');
            setCategories(data.categories || []);
        } catch (err) { console.error(err); }
    }

    async function saveSetting(key, value) {
        setSaving(true);
        try {
            await api(`/settings/${key}`, { method: 'PATCH', body: JSON.stringify({ value }) });
            setSettings(prev => ({ ...prev, [key]: value }));
        } catch (err) { alert('Error: ' + err.message); }
        finally { setSaving(false); }
    }

    async function createUser(e) {
        e.preventDefault();
        try {
            await api('/users', { method: 'POST', body: JSON.stringify(userForm) });
            setShowUserModal(false);
            setUserForm({ email: '', password: '', fullName: '', role: 'cashier' });
            loadUsers();
        } catch (err) { alert('Error: ' + err.message); }
    }

    async function createCategory(e) {
        e.preventDefault();
        try {
            await api('/categories', { method: 'POST', body: JSON.stringify(catForm) });
            setShowCategoryModal(false);
            setCatForm({ name: '', description: '' });
            loadCategories();
        } catch (err) { alert('Error: ' + err.message); }
    }

    const tabs = [
        { key: 'store', label: '🏪 Store Info' },
        { key: 'billing', label: '💳 Billing & Tax' },
        { key: 'users', label: '👥 Users' },
        { key: 'categories', label: '🏷️ Categories' },
        { key: 'barcode', label: '📊 Barcode' },
        { key: 'hardware', label: '🔌 Hardware' }
    ];

    return (
        <>
            <Head><title>Settings — Jewellery POS</title></Head>
            <Layout title="Settings" subtitle="System configuration">
                <div className="page">
                    <div className="category-tabs mb-lg">
                        {tabs.map(t => (
                            <button key={t.key} className={`category-tab ${activeTab === t.key ? 'category-tab--active' : ''}`} onClick={() => setActiveTab(t.key)}>
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {/* Store Info */}
                    {activeTab === 'store' && (
                        <div className="card">
                            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>🏪 Store Information</h3>
                            <div className="grid-2">
                                {[
                                    { key: 'store_name', label: 'Store Name' },
                                    { key: 'store_phone', label: 'Phone' },
                                    { key: 'store_address', label: 'Address' },
                                    { key: 'store_gst', label: 'GST Number' }
                                ].map(field => (
                                    <div className="input-group" key={field.key}>
                                        <label>{field.label}</label>
                                        <input
                                            className="input"
                                            value={settings[field.key] || ''}
                                            onChange={e => setSettings(prev => ({ ...prev, [field.key]: e.target.value }))}
                                            onBlur={e => saveSetting(field.key, e.target.value)}
                                        />
                                    </div>
                                ))}
                            </div>
                            {saving && <p style={{ color: 'var(--color-success)', fontSize: '0.82rem', marginTop: 'var(--space-sm)' }}>💾 Saving...</p>}
                        </div>
                    )}

                    {/* Billing & Tax */}
                    {activeTab === 'billing' && (
                        <div className="card">
                            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>💳 Billing & Tax Settings</h3>
                            <div className="grid-2">
                                <div className="input-group">
                                    <label>Tax Rate (%)</label>
                                    <input className="input" type="number" step="0.5" value={settings.tax_rate || 3} onChange={e => setSettings(prev => ({ ...prev, tax_rate: e.target.value }))} onBlur={e => saveSetting('tax_rate', parseFloat(e.target.value))} />
                                </div>
                                <div className="input-group">
                                    <label>Currency Symbol</label>
                                    <input className="input" value={settings.currency_symbol || '₨'} onChange={e => setSettings(prev => ({ ...prev, currency_symbol: e.target.value }))} onBlur={e => saveSetting('currency_symbol', e.target.value)} />
                                </div>
                                <div className="input-group">
                                    <label>Currency Code</label>
                                    <input className="input" value={settings.currency || 'PKR'} onChange={e => setSettings(prev => ({ ...prev, currency: e.target.value }))} onBlur={e => saveSetting('currency', e.target.value)} />
                                </div>
                                <div className="input-group">
                                    <label>Loyalty Points per ₨100</label>
                                    <input className="input" type="number" value={settings.loyalty_points_per_100 || 1} onChange={e => setSettings(prev => ({ ...prev, loyalty_points_per_100: e.target.value }))} onBlur={e => saveSetting('loyalty_points_per_100', parseInt(e.target.value))} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Users */}
                    {activeTab === 'users' && (
                        <div className="card">
                            <div className="flex-between mb-lg">
                                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>👥 User Management</h3>
                                <button className="btn btn--primary btn--sm" onClick={() => setShowUserModal(true)}>+ Add User</button>
                            </div>
                            <div className="table-container" style={{ border: 'none' }}>
                                <table className="table">
                                    <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th></tr></thead>
                                    <tbody>
                                        {users.map(u => (
                                            <tr key={u.id}>
                                                <td style={{ fontWeight: 600 }}>{u.fullName}</td>
                                                <td>{u.email}</td>
                                                <td><span className={`badge badge--${u.role === 'admin' ? 'purple' : u.role === 'manager' ? 'info' : 'gold'}`}>{u.role}</span></td>
                                                <td><span className={`badge badge--${u.isActive ? 'success' : 'danger'}`}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Categories */}
                    {activeTab === 'categories' && (
                        <div className="card">
                            <div className="flex-between mb-lg">
                                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>🏷️ Product Categories</h3>
                                <button className="btn btn--primary btn--sm" onClick={() => setShowCategoryModal(true)}>+ Add Category</button>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
                                {categories.map(cat => (
                                    <div key={cat.id} style={{ padding: 'var(--space-md) var(--space-lg)', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                                        <div style={{ fontWeight: 600 }}>{cat.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{cat.description || ''}</div>
                                        <div style={{ fontSize: '0.72rem', marginTop: 4 }}><span className="badge badge--info">{cat._count?.products || 0} products</span></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Barcode */}
                    {activeTab === 'barcode' && (
                        <div className="card">
                            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>📊 Barcode Settings</h3>
                            <div className="grid-2">
                                <div className="input-group">
                                    <label>Barcode Prefix</label>
                                    <input className="input" value={settings.barcode_prefix || 'JWL'} onChange={e => setSettings(prev => ({ ...prev, barcode_prefix: e.target.value }))} onBlur={e => saveSetting('barcode_prefix', e.target.value)} />
                                </div>
                                <div className="input-group">
                                    <label>Barcode Type</label>
                                    <select className="input" value={settings.barcode_type || 'CODE128'} onChange={e => { setSettings(prev => ({ ...prev, barcode_type: e.target.value })); saveSetting('barcode_type', e.target.value); }}>
                                        <option value="CODE128">Code 128</option>
                                        <option value="EAN13">EAN-13</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Add User Modal */}
                {showUserModal && (
                    <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
                        <div className="modal" onClick={e => e.stopPropagation()}>
                            <div className="modal__header"><h3 className="modal__title">Add User</h3><button className="btn btn--ghost btn--sm" onClick={() => setShowUserModal(false)}>✕</button></div>
                            <form onSubmit={createUser}>
                                <div className="modal__body">
                                    <div className="grid-2">
                                        <div className="input-group"><label>Full Name *</label><input className="input" value={userForm.fullName} onChange={e => setUserForm({ ...userForm, fullName: e.target.value })} required /></div>
                                        <div className="input-group"><label>Email *</label><input className="input" type="email" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} required /></div>
                                        <div className="input-group"><label>Password *</label><input className="input" type="password" value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} required /></div>
                                        <div className="input-group"><label>Role</label><select className="input" value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value })}><option value="cashier">Cashier</option><option value="manager">Manager</option><option value="admin">Admin</option></select></div>
                                    </div>
                                </div>
                                <div className="modal__footer"><button type="button" className="btn btn--secondary" onClick={() => setShowUserModal(false)}>Cancel</button><button type="submit" className="btn btn--primary">+ Create User</button></div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Add Category Modal */}
                {showCategoryModal && (
                    <div className="modal-overlay" onClick={() => setShowCategoryModal(false)}>
                        <div className="modal" onClick={e => e.stopPropagation()}>
                            <div className="modal__header"><h3 className="modal__title">Add Category</h3><button className="btn btn--ghost btn--sm" onClick={() => setShowCategoryModal(false)}>✕</button></div>
                            <form onSubmit={createCategory}>
                                <div className="modal__body">
                                    <div className="input-group"><label>Name *</label><input className="input" value={catForm.name} onChange={e => setCatForm({ ...catForm, name: e.target.value })} required /></div>
                                    <div className="input-group"><label>Description</label><textarea className="input" rows={2} value={catForm.description} onChange={e => setCatForm({ ...catForm, description: e.target.value })} /></div>
                                </div>
                                <div className="modal__footer"><button type="button" className="btn btn--secondary" onClick={() => setShowCategoryModal(false)}>Cancel</button><button type="submit" className="btn btn--primary">+ Create Category</button></div>
                            </form>
                        </div>
                    </div>
                )}
            </Layout>
        </>
    );
}
