require('dotenv').config();

const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');

// Initialise the database (creates tables + seeds admin on first run)
require('./database');

const authRoutes = require('./routes/authRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const stockRoutes = require('./routes/stockRoutes');

const app = express();

// ----- View engine -----
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ----- Middleware -----
app.use(cors({
  origin: 'http://localhost:5173',  // Vite dev server
  credentials: true                 // allow cookies cross-origin
}));
app.use(express.urlencoded({ extended: true })); // parse form data
app.use(express.json());                         // parse JSON bodies
app.use(cookieParser());                         // parse cookies (JWT)
app.use(express.static(path.join(__dirname, 'public'))); // serve Bootstrap/CSS/JS/images

// ----- Routes -----
app.use('/', authRoutes);
app.use('/', feedbackRoutes);
app.use('/', stockRoutes);

// ----- 404 fallback -----
app.use((req, res) => {
  res.status(404).send('Page not found');
});

// ----- Global async error handler -----
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err);

  if (req.accepts('html')) {
    return res.status(500).send('Internal server error');
  }
  res.status(500).json({ error: 'Internal server error.' });
});

// ----- Start server -----
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
