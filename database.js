/**
 * database.js
 *
 * Initialises a SQLite database using better-sqlite3.
 * - Creates the `users` table if it does not exist.
 * - Seeds a default admin account on the very first run.
 *
 * better-sqlite3 is synchronous by design, but we wrap calls in async
 * functions elsewhere so the architecture is ready for a future async
 * driver swap.
 */

const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'database.sqlite');

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent-read performance
db.pragma('journal_mode = WAL');

// ── Create table ────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    name     TEXT    NOT NULL,
    email    TEXT    UNIQUE NOT NULL,
    password TEXT    NOT NULL,
    role     TEXT    DEFAULT 'user' CHECK(role IN ('admin', 'user'))
  )
`);

// ── Seed default admin ──────────────────────────────────────────────────
const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@example.com');

if (!existingAdmin) {
  const hashedPassword = bcrypt.hashSync('Admin@123', 10);
  db.prepare(
    'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)'
  ).run('Admin', 'admin@example.com', hashedPassword, 'admin');

  console.log('✔  Default admin seeded  →  admin@example.com / Admin@123');
}

module.exports = db;
