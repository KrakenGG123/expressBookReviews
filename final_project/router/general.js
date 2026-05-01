'use strict';

const express = require('express');
const axios   = require('axios');

let books   = require('./booksdb.js');
let isValid = require('./auth_users.js').isValid;
let users   = require('./auth_users.js').users;

const public_users = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// POST /register
// Body: { "username": "...", "password": "..." }
// ─────────────────────────────────────────────────────────────────────────────
public_users.post('/register', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: 'Username and password are required' });
  }

  if (!isValid(username)) {
    return res
      .status(409)
      .json({ message: 'Username already exists or is invalid' });
  }

  users.push({ username, password });
  return res
    .status(201)
    .json({ message: `User ${username} registered successfully` });
});

// ─────────────────────────────────────────────────────────────────────────────
// Task 10 — GET /
// Returns all books using async-await with a Promise
// ─────────────────────────────────────────────────────────────────────────────
public_users.get('/', async (req, res) => {
  try {
    const allBooks = await new Promise((resolve, reject) => {
      try {
        resolve(books);
      } catch (err) {
        reject(err);
      }
    });

    return res.status(200).json(JSON.stringify(allBooks));
  } catch (err) {
    return res
      .status(500)
      .json({ message: 'Failed to retrieve books', error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Task 11 — GET /isbn/:isbn
// Returns a single book by ISBN using async-await with a Promise
// ─────────────────────────────────────────────────────────────────────────────
public_users.get('/isbn/:isbn', async (req, res) => {
  const { isbn } = req.params;

  try {
    const book = await new Promise((resolve, reject) => {
      const found = books[isbn];
      if (found) {
        resolve(found);
      } else {
        reject(new Error(`No book found with ISBN ${isbn}`));
      }
    });

    return res.status(200).json(JSON.stringify(book));
  } catch (err) {
    return res.status(404).json({ message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Task 12 — GET /author/:author
// Returns all books matching an author using async-await with a Promise
// ─────────────────────────────────────────────────────────────────────────────
public_users.get('/author/:author', async (req, res) => {
  const authorQuery = req.params.author.toLowerCase();

  try {
    const matches = await new Promise((resolve, reject) => {
      const found = Object.entries(books)
        .filter(([, book]) => book.author.toLowerCase().includes(authorQuery))
        .map(([isbn, book]) => ({ isbn, ...book }));

      if (found.length > 0) {
        resolve(found);
      } else {
        reject(new Error(`No books found by author "${req.params.author}"`));
      }
    });

    return res.status(200).json(JSON.stringify(matches));
  } catch (err) {
    return res.status(404).json({ message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Task 13 — GET /title/:title
// Returns all books matching a title using async-await with a Promise
// ─────────────────────────────────────────────────────────────────────────────
public_users.get('/title/:title', async (req, res) => {
  const titleQuery = req.params.title.toLowerCase();

  try {
    const matches = await new Promise((resolve, reject) => {
      const found = Object.entries(books)
        .filter(([, book]) => book.title.toLowerCase().includes(titleQuery))
        .map(([isbn, book]) => ({ isbn, ...book }));

      if (found.length > 0) {
        resolve(found);
      } else {
        reject(new Error(`No books found with title matching "${req.params.title}"`));
      }
    });

    return res.status(200).json(JSON.stringify(matches));
  } catch (err) {
    return res.status(404).json({ message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /review/:isbn
// Returns the reviews for a given book (synchronous — no async needed here)
// ─────────────────────────────────────────────────────────────────────────────
public_users.get('/review/:isbn', (req, res) => {
  const book = books[req.params.isbn];

  if (!book) {
    return res
      .status(404)
      .json({ message: `No book found with ISBN ${req.params.isbn}` });
  }

  const reviews = book.reviews;

  if (Object.keys(reviews).length === 0) {
    return res
      .status(200)
      .json({ message: 'No reviews yet for this book', reviews });
  }

  return res.status(200).json(reviews);
});

module.exports.general = public_users;