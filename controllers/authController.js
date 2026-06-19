/**
 * controllers/authController.js
 *
 * Fully async JWT-based authentication controller.
 * Supports both browser flows (cookie-based JWT, EJS views)
 * and REST API flows (Authorization header, JSON responses).
 */

const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/authMiddleware');
const {
  createUser,
  validateUser,
  findUserById,
  getAllUsers: getAllUsersFromModel
} = require('../models/userModel');

const TOKEN_EXPIRY = '1h';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: false,          // set to true in production with HTTPS
  sameSite: 'lax',
  maxAge: 60 * 60 * 1000  // 1 hour (matches TOKEN_EXPIRY)
};

/**
 * Helper: sign a JWT with user payload.
 */
const signToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
};

// ── Page Renderers ──────────────────────────────────────────────────────

/**
 * GET /login – Show the sign-in page.
 * If the user already has a valid JWT cookie, redirect to dashboard.
 */
const getLoginPage = async (req, res) => {
  try {
    // Check if user already has a valid token cookie
    if (req.cookies && req.cookies.token) {
      try {
        jwt.verify(req.cookies.token, JWT_SECRET);
        return res.redirect('/dashboard');
      } catch (_) {
        // Token invalid/expired – fall through to show login
      }
    }

    res.render('login', { error: null, oldEmail: '' });
  } catch (err) {
    res.render('login', { error: 'Something went wrong.', oldEmail: '' });
  }
};

/**
 * GET /register – Show the registration page.
 */
const getRegisterPage = async (req, res) => {
  try {
    res.render('register', { error: null, oldName: '', oldEmail: '' });
  } catch (err) {
    res.render('register', { error: 'Something went wrong.', oldName: '', oldEmail: '' });
  }
};

// ── Browser Form Handlers ───────────────────────────────────────────────

/**
 * POST /login – Form submit: validate, set cookie, redirect.
 */
const postLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await validateUser(email, password);
    if (!user) {
      return res.render('login', {
        error: 'Invalid email or password. Please try again.',
        oldEmail: email || ''
      });
    }

    const token = signToken(user);
    res.cookie('token', token, COOKIE_OPTIONS);
    res.redirect('/dashboard');
  } catch (err) {
    res.render('login', {
      error: 'Something went wrong. Please try again.',
      oldEmail: req.body.email || ''
    });
  }
};

/**
 * POST /register (form) – Register via browser form, set cookie, redirect.
 */
const postRegister = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      return res.render('register', {
        error: 'All fields are required.',
        oldName: name || '',
        oldEmail: email || ''
      });
    }

    if (password !== confirmPassword) {
      return res.render('register', {
        error: 'Passwords do not match.',
        oldName: name || '',
        oldEmail: email || ''
      });
    }

    if (password.length < 6) {
      return res.render('register', {
        error: 'Password must be at least 6 characters.',
        oldName: name || '',
        oldEmail: email || ''
      });
    }

    const newUser = await createUser(name, email, password);
    const token = signToken(newUser);
    res.cookie('token', token, COOKIE_OPTIONS);
    res.redirect('/dashboard');
  } catch (err) {
    // Handle duplicate email (UNIQUE constraint)
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      return res.render('register', {
        error: 'An account with that email already exists.',
        oldName: req.body.name || '',
        oldEmail: req.body.email || ''
      });
    }
    res.render('register', {
      error: 'Something went wrong. Please try again.',
      oldName: req.body.name || '',
      oldEmail: req.body.email || ''
    });
  }
};

// ── REST API Handlers ───────────────────────────────────────────────────

/**
 * POST /api/register – REST: returns JSON + JWT.
 */
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const newUser = await createUser(name, email, password);
    const token = signToken(newUser);

    // Also set cookie so browser clients are immediately authenticated
    res.cookie('token', token, COOKIE_OPTIONS);

    res.status(201).json({
      message: 'User registered successfully.',
      token,
      user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role }
    });
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'An account with that email already exists.' });
    }
    res.status(500).json({ error: 'Internal server error.' });
  }
};

/**
 * POST /api/login – REST: returns JSON + JWT.
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await validateUser(email, password);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = signToken(user);

    // Also set cookie for browser clients
    res.cookie('token', token, COOKIE_OPTIONS);

    res.status(200).json({
      message: 'Login successful.',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error.' });
  }
};

// ── Protected Handlers ──────────────────────────────────────────────────

/**
 * GET /dashboard – Protected page (requires authenticateToken middleware).
 */
const getDashboard = async (req, res) => {
  try {
    const user = await findUserById(req.user.id);
    if (!user) {
      res.clearCookie('token');
      return res.redirect('/login');
    }

    res.render('dashboard', {
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.redirect('/login');
  }
};

/**
 * GET /api/profile – Returns the authenticated user's own profile (JSON).
 */
const getProfile = async (req, res) => {
  try {
    const user = await findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.status(200).json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error.' });
  }
};

/**
 * GET /api/admin/users – Admin only: returns all users.
 */
const getAllUsers = async (req, res) => {
  try {
    const users = await getAllUsersFromModel();
    res.status(200).json({ users });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error.' });
  }
};

/**
 * GET /logout – Clears the JWT cookie and redirects to login.
 */
const logout = async (req, res) => {
  res.clearCookie('token');
  res.redirect('/login');
};

module.exports = {
  getLoginPage,
  getRegisterPage,
  postLogin,
  postRegister,
  register,
  login,
  getDashboard,
  getProfile,
  getAllUsers,
  logout
};
