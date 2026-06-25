/**
 * authRoutes.js
 *
 * Route table:
 *
 *  Method | Path              | Auth?    | Role?  | Handler
 *  -------|-------------------|----------|--------|-------------------
 *  GET    | /                 | No       | —      | Redirect → /login
 *  GET    | /login            | No       | —      | getLoginPage
 *  GET    | /register         | No       | —      | getRegisterPage
 *  POST   | /login            | No       | —      | postLogin (form)
 *  POST   | /register         | No       | —      | postRegister (form)
 *  POST   | /api/register     | No       | —      | register (REST)
 *  POST   | /api/login        | No       | —      | login (REST)
 *  GET    | /dashboard        | ✅ JWT   | —      | getDashboard
 *  GET    | /api/profile      | ✅ JWT   | —      | getProfile
 *  GET    | /api/admin/users  | ✅ JWT   | admin  | getAllUsers
 *  GET    | /logout           | No       | —      | logout
 */

const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

// ── Public routes ───────────────────────────────────────────────────────

// Redirect root to /login
router.get('/', (req, res) => res.redirect('/login'));

// Login page (GET = show form, POST = process form)
router.get('/login', authController.getLoginPage);
router.post('/login', authController.postLogin);

// Register page (GET = show form, POST = process form)
router.get('/register', authController.getRegisterPage);
router.post('/register', authController.postRegister);

// ── REST API (public) ───────────────────────────────────────────────────

router.post('/api/register', authController.register);
router.post('/api/login', authController.login);

// ── Protected routes ────────────────────────────────────────────────────

// Dashboard (browser – requires JWT)
router.get('/dashboard', authenticateToken, authController.getDashboard);

// Profile (API – requires JWT)
router.get('/api/profile', authenticateToken, authController.getProfile);

// Admin-only: list all users
router.get(
  '/api/admin/users',
  authenticateToken,
  authorizeRole('admin'),
  authController.getAllUsers
);

// ── Auth check (for React SPA) ──────────────────────────────────────────

// Check if the user is currently authenticated (cookie-based)
router.get('/api/auth/check', authenticateToken, authController.getProfile);

// API logout (clears cookie, returns JSON)
router.post('/api/logout', (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ message: 'Logged out successfully.' });
});

// ── Logout ──────────────────────────────────────────────────────────────

router.get('/logout', authController.logout);

module.exports = router;
