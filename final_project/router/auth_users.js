'use strict';

const express = require('express');
const jwt = require('jsonwebtoken');
let books = require('./booksdb.js');

const regd_users = express.Router();

// In-memory user store (shared with general.js via module.exports)
let users = [];

// Check that a username string is non-empty and not already taken
const isValid = (username) => {
  if (!username || typeof username !== 'string' || username.trim() === '') {
    return false;
  }
  return !users.some((u) => u.username === username);
};

// Verify username + password against the stored users array
const authenticatedUser = (username, password) => {
  return users.some(
    (u) => u.username === username && u.password === password
  );
};

// POST /customer/login
// Body: { "username": "...", "password": "..." }
regd_users.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: 'Username and password are required' });
  }

  if (!authenticatedUser(username, password)) {
    return res
      .status(401)
      .json({ message: 'Invalid username or password' });
  }

  // Sign a JWT and store it in the session
  const accessToken = jwt.sign({ username }, 'access', { expiresIn: '1h' });
  req.session.authorization = { accessToken };

  return res.status(200).json({
    message: `User ${username} logged in successfully`,
    accessToken,
  });
});

// PUT /customer/auth/review/:isbn
// Query param: ?review=<text>
// Adds a new review or updates the logged-in user's existing review
regd_users.put('/auth/review/:isbn', (req, res) => {
  const isbn = req.params.isbn;
  const review = req.query.review;
  const username = req.user; // set by the JWT middleware in index.js

  if (!review) {
    return res.status(400).json({ message: 'Review text is required (use ?review=...)' });
  }

  if (!books[isbn]) {
    return res.status(404).json({ message: `Book with ISBN ${isbn} not found` });
  }

  books[isbn].reviews[username] = review;

  return res.status(200).json({
    message: `Review for ISBN ${isbn} added/updated successfully`,
    reviews: books[isbn].reviews,
  });
});

// DELETE /customer/auth/review/:isbn
// Logged-in user can only delete their own review
regd_users.delete('/auth/review/:isbn', (req, res) => {
  const isbn = req.params.isbn;
  const username = req.user; // set by the JWT middleware in index.js

  if (!books[isbn]) {
    return res.status(404).json({ message: `Book with ISBN ${isbn} not found` });
  }

  if (!books[isbn].reviews[username]) {
    return res
      .status(404)
      .json({ message: 'No review found for this user on that book' });
  }

  delete books[isbn].reviews[username];

  return res.status(200).json({
    message: `Review by ${username} for ISBN ${isbn} deleted successfully`,
    reviews: books[isbn].reviews,
  });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;