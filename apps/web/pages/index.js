import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { api, setToken, setUser } from '../lib/api';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const data = await api('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });
            setToken(data.token);
            setUser(data.user);
            router.push('/dashboard');
        } catch (err) {
            setError(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const quickLogin = (email, pass) => {
        setEmail(email);
        setPassword(pass);
    };

    return (
        <>
            <Head>
                <title>Jewellery POS — Login</title>
                <meta name="description" content="Jewellery Inventory Management & Billing System" />
            </Head>

            <div className="login-page">
                <div className="login-card">
                    <div className="login-card__logo">
                        <div className="login-card__logo-icon">💎</div>
                        <h1 className="login-card__title">Jewellery POS</h1>
                        <p className="login-card__subtitle">Inventory & Billing System</p>
                    </div>

                    <form onSubmit={handleLogin}>
                        <div className="input-group">
                            <label>Email Address</label>
                            <input
                                className="input"
                                type="email"
                                placeholder="admin@jewellerypos.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>
                        <div className="input-group">
                            <label>Password</label>
                            <input
                                className="input"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        {error && (
                            <div style={{ color: 'var(--color-danger)', fontSize: '0.85rem', marginBottom: 'var(--space-md)', padding: '8px 12px', background: 'var(--color-danger-light)', borderRadius: 'var(--radius-sm)' }}>
                                {error}
                            </div>
                        )}

                        <button className="btn btn--primary btn--lg btn--full" type="submit" disabled={loading}>
                            {loading ? '⏳ Signing in...' : '🔐 Sign In'}
                        </button>
                    </form>

                    <div style={{ marginTop: 'var(--space-xl)', paddingTop: 'var(--space-md)', borderTop: '1px solid var(--color-border)' }}>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: 'var(--space-sm)', textAlign: 'center' }}>Quick Login (Demo)</p>
                        <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
                            <button className="btn btn--secondary btn--sm" style={{ flex: 1 }} onClick={() => quickLogin('admin@jewellerypos.com', 'admin123')}>
                                👑 Admin
                            </button>
                            <button className="btn btn--secondary btn--sm" style={{ flex: 1 }} onClick={() => quickLogin('manager@jewellerypos.com', 'manager123')}>
                                📋 Manager
                            </button>
                            <button className="btn btn--secondary btn--sm" style={{ flex: 1 }} onClick={() => quickLogin('cashier@jewellerypos.com', 'cashier123')}>
                                🛒 Cashier
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
