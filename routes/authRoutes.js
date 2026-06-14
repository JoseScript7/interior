/**
 * authRoutes.js
 */

const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');

// Redirect root to /login
router.get('/', (req, res) => res.redirect('/login'));

// Login page (GET = show form, POST = process form)
router.get('/login', authController.getLoginPage);
router.post('/login', authController.postLogin);

// Protected dashboard page
router.get('/dashboard', authController.getDashboard);

// Logout
router.get('/logout', authController.logout);

module.exports = router;
