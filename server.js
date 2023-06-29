const express = require('express');
const path = require('path');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

// Create a MySQL connection
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Armin@04120216',
  database: 'url_shortener'
});

// Connect to the database
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err.message);
    process.exit(1);
  }
  console.log('Connected to the MySQL database');

  // Create the users table if it doesn't exist
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE (username),
      UNIQUE (email)
    )
  `;
  connection.query(createTableQuery, (err) => {
    if (err) {
      console.error('Error creating the users table:', err);
      process.exit(1);
    }
    console.log('Created the users table');
  });

  // Create the links table if it doesn't exist
  const createLinksTableQuery = `
    CREATE TABLE IF NOT EXISTS links (
      id INT AUTO_INCREMENT PRIMARY KEY,
      url TEXT NOT NULL,
      short_hash VARCHAR(255) NOT NULL,
      views INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      user_id INT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `;
  connection.query(createLinksTableQuery, (err) => {
    if (err) {
      console.error('Error creating the links table:', err);
      process.exit(1);
    }
    console.log('Created the links table');
  });
});

const SECRET_KEY = 'your_secret_key';

// Generate a JWT token for a user
function generateToken(user) {
  const payload = {
    username: user.username,
    email: user.email
  };

  return jwt.sign(payload, SECRET_KEY, { expiresIn: '1h' });
}

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.sendStatus(403);
    }

    req.user = user;
    next();
  });
}

app.use(express.static(path.join(__dirname, 'public')));

// Register a new user
app.post('/api/register', (req, res) => {
  const { username, email, password } = req.body;

  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      console.error('Error hashing the password:', err);
      return res.status(500).json({ error: 'An error occurred during registration.' });
    }

    const checkExistingQuery = 'SELECT * FROM users WHERE username = ? OR email = ?';
    connection.query(checkExistingQuery, [username, email], (err, rows) => {
      if (err) {
        console.error('Error executing SQL query:', err);
        return res.status(500).json({ error: 'An error occurred during registration.' });
      }

      if (rows.length > 0) {
        return res.status(400).json({ error: 'Username or email already exists.' });
      }

      const insertUserQuery = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
      connection.query(insertUserQuery, [username, email, hashedPassword], (err) => {
        if (err) {
          console.error('Error executing SQL query:', err);
          return res.status(500).json({ error: 'An error occurred during registration.' });
        }

        res.json({ message: 'Registration successful.' });
      });
    });
  });
});

// Login a user and generate a JWT token
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  const checkUserQuery = 'SELECT * FROM users WHERE username = ?';
  connection.query(checkUserQuery, [username], (err, rows) => {
    if (err) {
      console.error('Error executing SQL query:', err);
      return res.status(500).json({ error: 'An error occurred during login.' });
    }

    if (rows.length === 0) {
      return res.status(400).json({ error: 'Invalid username or password.' });
    }

    bcrypt.compare(password, rows[0].password, (err, result) => {
      if (err) {
        console.error('Error comparing passwords:', err);
        return res.status(500).json({ error: 'An error occurred during login.' });
      }

      if (result) {
        const user = { username, email: rows[0].email };
        const token = generateToken(user);
        res.json({ message: 'Login successful.', token });
      } else {
        res.status(400).json({ error: 'Invalid username or password.' });
      }
    });
  });
});

// Shorten a URL and save it in the database
app.post('/api/shorten', authenticateToken, (req, res) => {
  const { url } = req.body;
  const { username } = req.user; // Get the username from the authenticated user

  // Generate a short hash for the URL (you can use any shortening algorithm of your choice)
  const shortHash = generateShortHash(url);

  // Save the shortened link, creation date, and number of views in the database
  const insertLinkQuery = 'INSERT INTO links (url, short_hash, views, created_at, user_id) VALUES (?, ?, ?, ?, ?)';
  const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' '); // Get the current date and time in the format 'YYYY-MM-DD HH:MM:SS'
  const views = 0; // Initial number of views is 0

  // Get the user ID based on the username
  const getUserIdQuery = 'SELECT id FROM users WHERE username = ?';
  connection.query(getUserIdQuery, [username], (err, rows) => {
    if (err) {
      console.error('Error executing SQL query:', err);
      return res.status(500).json({ error: 'An error occurred during URL shortening.' });
    }

    const userId = rows[0].id;

    connection.query(insertLinkQuery, [url, shortHash, views, currentDate, userId], (err) => {
      if (err) {
        console.error('Error executing SQL query:', err);
        return res.status(500).json({ error: 'An error occurred during URL shortening.' });
      }

      const shortenedLink = 'localhost/' + shortHash; // Construct the shortened link using your domain

      res.json({ shortenedLink });
    });
  });
});

// Generate a short hash for the URL (example implementation)
function generateShortHash(url) {
  // Implement your shortening algorithm here
  // You can use libraries like shortid, nanoid, or custom logic to generate a short hash

  // Example: Generate a random 6-character alphanumeric hash
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let shortHash = '';
  for (let i = 0; i < 6; i++) {
    shortHash += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return shortHash;
}

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
