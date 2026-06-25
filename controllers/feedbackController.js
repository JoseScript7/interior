/**
 * controllers/feedbackController.js
 *
 * Handles feedback CRUD operations via REST API.
 */

const {
  createFeedback,
  getFeedbackByUser,
  getAllFeedback: getAllFeedbackFromModel
} = require('../models/feedbackModel');

/**
 * POST /api/feedback — Create new feedback (authenticated).
 */
const addFeedback = async (req, res) => {
  try {
    const { title, message, category } = req.body;

    if (!title || !message || !category) {
      return res.status(400).json({ error: 'Title, message, and category are required.' });
    }

    const validCategories = ['bug', 'feature', 'general'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: 'Category must be bug, feature, or general.' });
    }

    const feedback = await createFeedback(req.user.id, title, message, category);
    res.status(201).json({ message: 'Feedback submitted successfully.', feedback });
  } catch (err) {
    console.error('Feedback creation error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

/**
 * GET /api/feedback — Get feedback for the authenticated user.
 */
const getUserFeedback = async (req, res) => {
  try {
    const feedback = await getFeedbackByUser(req.user.id);
    res.status(200).json({ feedback });
  } catch (err) {
    console.error('Feedback fetch error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

/**
 * GET /api/admin/feedback — Get all feedback (admin only).
 */
const getAllFeedback = async (req, res) => {
  try {
    const feedback = await getAllFeedbackFromModel();
    res.status(200).json({ feedback });
  } catch (err) {
    console.error('Admin feedback fetch error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = {
  addFeedback,
  getUserFeedback,
  getAllFeedback
};
