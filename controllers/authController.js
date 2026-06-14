
const { validateUser } = require('../models/userModel');

/**
 * Show the sign-in page. If the user is already logged in,
 */
const getLoginPage = (req, res) => {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }

  res.render('login', {
    error: null,
    oldEmail: ''
  });
};

/**
 * Validate the submitted credentials against the model.
 */
const postLogin = (req, res) => {
  const { email, password } = req.body;

  const user = validateUser(email, password);

  if (!user) {
    return res.render('login', {
      error: 'Invalid email or password. Please try again.',
      oldEmail: email || ''
    });
  }

  
  req.session.user = {
    id: user.id,
    name: user.name,
    email: user.email
  };

  res.redirect('/dashboard');
};

/**
 * A protected page - only accessible when logged in.
 */
const getDashboard = (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  res.render('dashboard', {
    user: req.session.user
  });
};

/**
 * Destroy the session and send the user back to the login page.
 */
const logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
};

module.exports = {
  getLoginPage,
  postLogin,
  getDashboard,
  logout
};
