/**
 * models/feedbackModel.js
 *
 * SQLite-backed feedback model for CRUD operations.
 */

const db = require('../database');

/**
 * Create a new feedback entry.
 * @param {number} userId
 * @param {string} title
 * @param {string} message
 * @param {string} category — 'bug' | 'feature' | 'general'
 * @returns {Promise<object>}
 */
const createFeedback = async (userId, title, message, category) => {
  const stmt = db.prepare(
    'INSERT INTO feedback (user_id, title, message, category) VALUES (?, ?, ?, ?)'
  );
  const result = stmt.run(userId, title, message, category);

  return {
    id: result.lastInsertRowid,
    user_id: userId,
    title,
    message,
    category,
    created_at: new Date().toISOString()
  };
};

/**
 * Get all feedback submitted by a specific user.
 * @param {number} userId
 * @returns {Promise<object[]>}
 */
const getFeedbackByUser = async (userId) => {
  const stmt = db.prepare(
    'SELECT f.*, u.name as user_name, u.email as user_email FROM feedback f JOIN users u ON f.user_id = u.id WHERE f.user_id = ? ORDER BY f.created_at DESC'
  );
  return stmt.all(userId);
};

/**
 * Get all feedback (admin only).
 * @returns {Promise<object[]>}
 */
const getAllFeedback = async () => {
  const stmt = db.prepare(
    'SELECT f.*, u.name as user_name, u.email as user_email FROM feedback f JOIN users u ON f.user_id = u.id ORDER BY f.created_at DESC'
  );
  return stmt.all();
};

module.exports = {
  createFeedback,
  getFeedbackByUser,
  getAllFeedback
};
