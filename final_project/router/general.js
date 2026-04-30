'use strict';

const express = require('express');
let books = require('./booksdb.js');
let isValid = require('./auth_users.js').isValid;
let users = require('./auth_users.js').users;

const public_users = express.Router();

// ─── Helper: wrap the books object in a Promise (simulates async data fetch) ──
const getBooksAsync = () => Promise.resolve(books);

// POST /register
// Body: { "username": "...", "password": "..." }
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

// GET /
// Returns the full list of books (async/await)
public_users.get('/', async (req, res) => {
  try {
    const allBooks = await getBooksAsync();
    return res.status(200).json(allBooks);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to retrieve books', error: err.message });
  }
});

// GET /isbn/:isbn
// Returns details of a single book by ISBN (async/await)
public_users.get('/isbn/:isbn', async (req, res) => {
  try {
    const allBooks = await getBooksAsync();
    const book = allBooks[req.params.isbn];

    if (!book) {
      return res
        .status(404)
        .json({ message: `No book found with ISBN ${req.params.isbn}` });
    }

    return res.status(200).json(book);
  } catch (err) {
    return res.status(500).json({ message: 'Error retrieving book', error: err.message });
  }
});

// GET /author/:author
// Returns all books matching the given author name (async/await)
public_users.get('/author/:author', async (req, res) => {
  try {
    const allBooks = await getBooksAsync();
    const authorQuery = req.params.author.toLowerCase();

    const matches = Object.entries(allBooks)
      .filter(([, book]) => book.author.toLowerCase().includes(authorQuery))
      .map(([isbn, book]) => ({ isbn, ...book }));

    if (matches.length === 0) {
      return res
        .status(404)
        .json({ message: `No books found by author "${req.params.author}"` });
    }

    return res.status(200).json(matches);
  } catch (err) {
    return res.status(500).json({ message: 'Error retrieving books by author', error: err.message });
  }
});

// GET /title/:title
// Returns all books whose title contains the search string (async/await)
public_users.get('/title/:title', async (req, res) => {
  try {
    const allBooks = await getBooksAsync();
    const titleQuery = req.params.title.toLowerCase();

    const matches = Object.entries(allBooks)
      .filter(([, book]) => book.title.toLowerCase().includes(titleQuery))
      .map(([isbn, book]) => ({ isbn, ...book }));

    if (matches.length === 0) {
      return res
        .status(404)
        .json({ message: `No books found with title matching "${req.params.title}"` });
    }

    return res.status(200).json(matches);
  } catch (err) {
    return res.status(500).json({ message: 'Error retrieving books by title', error: err.message });
  }
});

// GET /review/:isbn
// Returns the reviews for a given book
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