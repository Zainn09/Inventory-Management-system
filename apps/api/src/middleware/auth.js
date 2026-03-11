const jwt = require('jsonwebtoken');
const { hasPermission } = require('@jewellery-pos/shared');

const JWT_SECRET = process.env.JWT_SECRET || 'jewellery-pos-secret-key-change-in-production';
const JWT_EXPIRES = '24h';

function generateToken(user) {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role, name: user.fullName },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES }
    );
}

function authenticate(req, res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Missing or invalid token' } });
    }
    try {
        const token = header.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: { code: 'TOKEN_EXPIRED', message: 'Token expired or invalid' } });
    }
}

function authorize(...permissions) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
        }
        const allowed = permissions.some(p => hasPermission(req.user.role, p));
        if (!allowed) {
            return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } });
        }
        next();
    };
}

module.exports = { generateToken, authenticate, authorize, JWT_SECRET };
