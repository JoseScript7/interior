/**
 * userModel.js
 *
 * SQLite-backed user model with bcrypt password hashing.
 * All functions are async to demonstrate proper async/await patterns
 * and to keep the architecture ready for a future async driver swap.
 */

const db = require('../database');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

/**
 * Create a new user with a hashed password.
 * @param {string} name
 * @param {string} email
 * @param {string} password – plain-text (will be hashed)
 * @param {string} [role='user']
 * @returns {Promise<object>} The newly created user (without password)
 */
const createUser = async (name, email, password, role = 'user') => {
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const stmt = db.prepare(
    'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)'
  );
  const result = stmt.run(name, email, hashedPassword, role);

  return { id: result.lastInsertRowid, name, email, role };
};

/**
 * Find a user by email address.
 * @param {string} email
 * @returns {Promise<object|undefined>}
 */
const findUserByEmail = async (email) => {
  const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
  return stmt.get(email);
};

/**
 * Find a user by their numeric ID.
 * @param {number} id
 * @returns {Promise<object|undefined>}
 */
const findUserById = async (id) => {
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  return stmt.get(id);
};

/**
 * Return every user (without passwords) – intended for admin use.
 * @returns {Promise<object[]>}
 */
const getAllUsers = async () => {
  const stmt = db.prepare('SELECT id, name, email, role FROM users');
  return stmt.all();
};

/**
 * Validate credentials: looks the user up by email, then compares
 * the supplied password against the bcrypt hash.
 * @param {string} email
 * @param {string} password – plain-text
 * @returns {Promise<object|null>} The user object (if valid) or null
 */
const validateUser = async (email, password) => {
  const user = await findUserByEmail(email);
  if (!user) return null;

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return null;

  return user;
};

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  getAllUsers,
  validateUser
};
