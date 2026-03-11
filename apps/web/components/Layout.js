import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { getUser, getToken, removeToken } from '../lib/api';

const NAV_ITEMS = [
    {
        group: 'Main', items: [
            { key: 'dashboard', label: 'Dashboard', icon: '📊', path: '/dashboard' },
            { key: 'pos', label: 'POS / Billing', icon: '🛒', path: '/pos' },
        ]
    },
    {
        group: 'Management', items: [
            { key: 'inventory', label: 'Inventory', icon: '💎', path: '/inventory' },
            { key: 'customers', label: 'Customers', icon: '👥', path: '/customers' },
            { key: 'orders', label: 'Orders', icon: '📋', path: '/orders' },
            { key: 'returns', label: 'Returns', icon: '↩️', path: '/returns' },
        ]
    },
    {
        group: 'Insights', items: [
            { key: 'reports', label: 'Reports', icon: '📈', path: '/reports' },
        ]
    },
    {
        group: 'System', items: [
            { key: 'settings', label: 'Settings', icon: '⚙️', path: '/settings' },
        ]
    },
];

export default function Layout({ children, title, subtitle }) {
    const router = useRouter();
    const [user, setUserState] = useState(null);
    const [theme, setTheme] = useState('light');

    useEffect(() => {
        const token = getToken();
        if (!token) { router.push('/'); return; }
        const u = getUser();
        setUserState(u);
        const saved = localStorage.getItem('theme') || 'light';
        setTheme(saved);
        document.documentElement.setAttribute('data-theme', saved);
    }, []);

    const toggleTheme = useCallback(() => {
        const next = theme === 'light' ? 'dark' : 'light';
        setTheme(next);
        localStorage.setItem('theme', next);
        document.documentElement.setAttribute('data-theme', next);
    }, [theme]);

    const handleLogout = () => {
        removeToken();
        localStorage.removeItem('user');
        router.push('/');
    };

    const activeKey = NAV_ITEMS.flatMap(g => g.items).find(i => router.pathname.startsWith(i.path))?.key;

    if (!user) return null;

    return (
        <div className="app-layout">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar__logo">
                    <div className="sidebar__logo-icon">💎</div>
                    <span className="sidebar__logo-text">Jewellery POS</span>
                </div>

                <nav className="sidebar__nav">
                    {NAV_ITEMS.map(group => {
                        // Filter items by role
                        const visibleItems = group.items.filter(item => {
                            if (user.role === 'cashier') {
                                return ['dashboard', 'pos', 'orders'].includes(item.key);
                            }
                            if (user.role === 'manager') {
                                return item.key !== 'settings';
                            }
                            return true;
                        });
                        if (visibleItems.length === 0) return null;
                        return (
                            <div key={group.group} className="sidebar__nav-group">
                                <div className="sidebar__nav-label">{group.group}</div>
                                {visibleItems.map(item => (
                                    <button
                                        key={item.key}
                                        className={`sidebar__nav-item ${activeKey === item.key ? 'sidebar__nav-item--active' : ''}`}
                                        onClick={() => router.push(item.path)}
                                    >
                                        <span className="sidebar__nav-icon">{item.icon}</span>
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        );
                    })}
                </nav>

                <div className="sidebar__user">
                    <div className="sidebar__user-avatar">
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="sidebar__user-info">
                        <div className="sidebar__user-name">{user.name}</div>
                        <div className="sidebar__user-role">{user.role}</div>
                    </div>
                </div>
            </aside>

            {/* Main */}
            <main className="main-content">
                <div className="topbar">
                    <div className="topbar__left">
                        <div>
                            <div className="topbar__title">{title || 'Dashboard'}</div>
                            {subtitle && <div className="topbar__breadcrumb">{subtitle}</div>}
                        </div>
                    </div>
                    <div className="topbar__right">
                        <button className="topbar__icon-btn" onClick={toggleTheme} title="Toggle theme">
                            {theme === 'light' ? '🌙' : '☀️'}
                        </button>
                        <button className="topbar__icon-btn" title="Notifications" style={{ position: 'relative' }}>
                            🔔<span className="badge" style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, background: 'var(--color-danger)', borderRadius: '50%', border: '2px solid var(--color-bg-card)' }}></span>
                        </button>
                        <button className="btn btn--ghost btn--sm" onClick={handleLogout}>
                            Logout
                        </button>
                    </div>
                </div>

                {children}
            </main>
        </div>
    );
}
