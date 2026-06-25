/**
 * routes/feedbackRoutes.js
 */

const express = require('express');
const router = express.Router();

const feedbackController = require('../controllers/feedbackController');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

// Create feedback (authenticated)
router.post('/api/feedback', authenticateToken, feedbackController.addFeedback);

// Get own feedback (authenticated)
router.get('/api/feedback', authenticateToken, feedbackController.getUserFeedback);

// Get all feedback (admin only)
router.get(
  '/api/admin/feedback',
  authenticateToken,
  authorizeRole('admin'),
  feedbackController.getAllFeedback
);

module.exports = router;
