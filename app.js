const express = require('express');
const path = require('path');
const session = require('express-session');

const authRoutes = require('./routes/authRoutes');

const app = express();

// ----- View engine -----
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ----- Middleware -----
app.use(express.urlencoded({ extended: true })); // parse form data
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // serve Bootstrap/CSS/JS/images

// Simple session (used to keep the user "logged in" - no JWT, no hashing)
app.use(
  session({
    secret: 'simple-login-secret-key', // change this in a real project
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 } // 1 hour
  })
);

// ----- Routes -----
app.use('/', authRoutes);

// ----- 404 fallback -----
app.use((req, res) => {
  res.status(404).send('Page not found');
});

// ----- Start server -----
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
