const API_BASE = '/api/v1';

export function getToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
}

export function setToken(token) {
    localStorage.setItem('token', token);
}

export function removeToken() {
    localStorage.removeItem('token');
}

export function getUser() {
    if (typeof window === 'undefined') return null;
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
}

export function setUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
}

export async function api(path, options = {}) {
    const token = getToken();
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.error?.message || 'Request failed');
    }
    return data;
}

export function formatCurrency(amount) {
    return `₨ ${Number(amount || 0).toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function formatDate(date) {
    return new Date(date).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(date) {
    return new Date(date).toLocaleString('en-PK', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export const METAL_EMOJIS = {
    gold: '🥇', silver: '🥈', platinum: '💎', diamond: '💠', other: '✨'
};

export const CATEGORY_EMOJIS = {
    rings: '💍', necklaces: '📿', bracelets: '⌚', earrings: '✨',
    pendants: '🔮', anklets: '🦶', sets: '👑', other: '💎'
};
