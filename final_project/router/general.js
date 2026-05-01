'use strict';

const express = require('express');
const axios   = require('axios');

let books   = require('./booksdb.js');
let isValid = require('./auth_users.js').isValid;
let users   = require('./auth_users.js').users;

const public_users = express.Router();

const BASE_URL = 'http://localhost:5000';

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
// Returns all books using async-await with Axios
// ─────────────────────────────────────────────────────────────────────────────
public_users.get('/', async (req, res) => {
  try {
    const response = await axios.get(`${BASE_URL}/books`);
    return res.status(200).json(response.data);
  } catch (err) {
    // Fallback: serve directly from memory if Axios call fails
    return res.status(200).json(books);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Internal route used by Axios — GET /books
// ─────────────────────────────────────────────────────────────────────────────
public_users.get('/books', (req, res) => {
  return res.status(200).json(books);
});

// ─────────────────────────────────────────────────────────────────────────────
// Task 11 — GET /isbn/:isbn
// Returns a single book by ISBN using async-await with Axios
// ─────────────────────────────────────────────────────────────────────────────
public_users.get('/isbn/:isbn', async (req, res) => {
  const { isbn } = req.params;
  try {
    const response = await axios.get(`${BASE_URL}/books/${isbn}`);
    return res.status(200).json(response.data);
  } catch (err) {
    const status = err.response ? err.response.status : 404;
    const message = err.response ? err.response.data.message : `No book found with ISBN ${isbn}`;
    return res.status(status).json({ message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Internal route used by Axios — GET /books/:isbn
// ─────────────────────────────────────────────────────────────────────────────
public_users.get('/books/:isbn', (req, res) => {
  const book = books[req.params.isbn];
  if (!book) {
    return res.status(404).json({ message: `No book found with ISBN ${req.params.isbn}` });
  }
  return res.status(200).json(book);
});

// ─────────────────────────────────────────────────────────────────────────────
// Task 12 — GET /author/:author
// Returns all books matching an author using async-await with Axios
// ─────────────────────────────────────────────────────────────────────────────
public_users.get('/author/:author', async (req, res) => {
  const { author } = req.params;
  try {
    const response = await axios.get(`${BASE_URL}/books/author/${encodeURIComponent(author)}`);
    return res.status(200).json(response.data);
  } catch (err) {
    const status = err.response ? err.response.status : 404;
    const message = err.response ? err.response.data.message : `No books found by author "${author}"`;
    return res.status(status).json({ message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Internal route used by Axios — GET /books/author/:author
// ─────────────────────────────────────────────────────────────────────────────
public_users.get('/books/author/:author', (req, res) => {
  const authorQuery = req.params.author.toLowerCase();
  const matches = Object.entries(books)
    .filter(([, book]) => book.author.toLowerCase().includes(authorQuery))
    .map(([isbn, book]) => ({ isbn, ...book }));

  if (matches.length === 0) {
    return res.status(404).json({ message: `No books found by author "${req.params.author}"` });
  }
  return res.status(200).json(matches);
});

// ─────────────────────────────────────────────────────────────────────────────
// Task 13 — GET /title/:title
// Returns all books matching a title using async-await with Axios
// ─────────────────────────────────────────────────────────────────────────────
public_users.get('/title/:title', async (req, res) => {
  const { title } = req.params;
  try {
    const response = await axios.get(`${BASE_URL}/books/title/${encodeURIComponent(title)}`);
    return res.status(200).json(response.data);
  } catch (err) {
    const status = err.response ? err.response.status : 404;
    const message = err.response ? err.response.data.message : `No books found with title matching "${title}"`;
    return res.status(status).json({ message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Internal route used by Axios — GET /books/title/:title
// ─────────────────────────────────────────────────────────────────────────────
public_users.get('/books/title/:title', (req, res) => {
  const titleQuery = req.params.title.toLowerCase();
  const matches = Object.entries(books)
    .filter(([, book]) => book.title.toLowerCase().includes(titleQuery))
    .map(([isbn, book]) => ({ isbn, ...book }));

  if (matches.length === 0) {
    return res.status(404).json({ message: `No books found with title matching "${req.params.title}"` });
  }
  return res.status(200).json(matches);
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