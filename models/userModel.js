/**
 * userModel.js
 */

const users = [
  {
    id: 1,
    name: 'Thiru',
    email: 'Thiru@example.com',
    password: 'Thiru@3106'
  },
  {
    id: 2,
    name: 'User',
    email: 'test@example.com',
    password: 'test123'
  }
];

/**
 * @param {string} email
 * @returns {object|undefined}
 */
const findUserByEmail = (email) => {
  return users.find(
    (user) => user.email.toLowerCase() === String(email).toLowerCase()
  );
};

/**
 * @param {string} email
 * @param {string} password
 * @returns {object|null}
 */
const validateUser = (email, password) => {
  const user = findUserByEmail(email);

  if (!user) return null;
  if (user.password !== password) return null;

  return user;
};

module.exports = {
  users,
  findUserByEmail,
  validateUser
};
