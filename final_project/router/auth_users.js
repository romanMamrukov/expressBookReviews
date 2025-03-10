const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username)=>{ //returns boolean
  // Check if username exists and is not empty
  return username !== undefined && username.trim() !== '';
}

const authenticatedUser = (username,password)=>{ //returns boolean
  // Find user with matching username and password
  const user = users.find(user => user.username === username && user.password === password);
  return !!user; // Convert to boolean
}

//only registered users can login
regd_users.post("/login", (req,res) => {
  const { username, password } = req.body;
  
  // Check if username and password are provided
  if (!username || !password) {
    return res.status(400).json({message: "Username and password are required"});
  }
  
  // Check if username is valid
  if (!isValid(username)) {
    return res.status(400).json({message: "Invalid username"});
  }
  
  // Authenticate user
  if (authenticatedUser(username, password)) {
    // Generate JWT token
    const token = jwt.sign({username: username}, "your_secret_key", {expiresIn: "1h"});
    // Save token to session
    req.session.authorization = {
      accessToken: token
    };
    return res.status(200).json({message: "Login successful", accessToken: token});
  } else {
    return res.status(401).json({message: "Invalid username or password"});
  }
});

// Add a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const review = req.query.review;
  const username = req.user.username;
  
  // Check if review is provided
  if (!review) {
    return res.status(400).json({message: "Review text is required as a query parameter"});
  }
  
  // Check if book with the ISBN exists
  if (!books[isbn]) {
    return res.status(404).json({message: "Book with the specified ISBN not found"});
  }
  
  // Initialize reviews object if it doesn't exist
  if (typeof books[isbn].reviews !== 'object') {
    books[isbn].reviews = {};
  }
  
  // Add or modify the review for this user
  books[isbn].reviews[username] = review;
  
  // Save changes to JSON file
  books.saveBooks();
  
  return res.status(200).json({
    message: "Review added/modified successfully", 
    book: books[isbn].title,
    review: review,
    user: username
  });
});

// Delete a book review
regd_users.delete("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const username = req.user.username;
  
  // Check if book with the ISBN exists
  if (!books[isbn]) {
    return res.status(404).json({message: "Book with the specified ISBN not found"});
  }
  
  // Check if the reviews object exists and is properly formatted
  if (typeof books[isbn].reviews !== 'object') {
    return res.status(404).json({message: "No reviews found for this book"});
  }
  
  // Check if the user has a review for this book
  if (!books[isbn].reviews[username]) {
    return res.status(404).json({message: "You don't have a review for this book"});
  }
  
  // Delete the review for this user
  delete books[isbn].reviews[username];
  
  // Save changes to JSON file
  books.saveBooks();
  
  return res.status(200).json({
    message: "Review deleted successfully",
    book: books[isbn].title,
    user: username
  });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
