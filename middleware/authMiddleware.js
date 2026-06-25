/**
 * middleware/authMiddleware.js
 *
 * Two middleware functions:
 *  1. authenticateToken – verifies JWT from Authorization header or cookie
 *  2. authorizeRole     – checks user role against an allow-list
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production';

/**
 * Extracts and verifies a JWT.
 *
 * Token lookup order:
 *   1. `Authorization: Bearer <token>` header  (API / Postman)
 *   2. `token` cookie                          (browser flow)
 *
 * On success: attaches `req.user = { id, email, role }` and calls next().
 * On failure: returns 401 JSON or redirects to /login for browser requests.
 */
const authenticateToken = async (req, res, next) => {
  try {
    let token = null;

    // 1. Check Authorization header
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    // 2. Fall back to cookie
    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      // If it looks like a browser request, redirect to login
      if (req.accepts('html') && !req.path.startsWith('/api/')) {
        return res.redirect('/login');
      }
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
    next();
  } catch (err) {
    if (req.accepts('html') && !req.path.startsWith('/api/')) {
      return res.redirect('/login');
    }
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

/**
 * Returns a middleware that checks `req.user.role` against the supplied
 * list of allowed roles. Must be used AFTER `authenticateToken`.
 *
 * Usage:  router.get('/admin', authenticateToken, authorizeRole('admin'), handler)
 */
const authorizeRole = (...roles) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !roles.includes(req.user.role)) {
        if (req.accepts('html')) {
          return res.status(403).send('Forbidden. Insufficient permissions.');
        }
        return res.status(403).json({ error: 'Forbidden. Insufficient permissions.' });
      }
      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports = {
  authenticateToken,
  authorizeRole,
  JWT_SECRET
};
