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

  // Create the user_activity table if it doesn't exist
  const createUserActivityTableQuery = `
    CREATE TABLE IF NOT EXISTS user_activity (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      activity_name VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `;
  connection.query(createUserActivityTableQuery, (err) => {
    if (err) {
      console.error('Error creating the user_activity table:', err);
      process.exit(1);
    }
    console.log('Created the user_activity table');
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

// Retrieve user activity
app.get('/api/user/activity', authenticateToken, (req, res) => {
  const username = req.user.username;

  const getActivityQuery = 'SELECT * FROM user_activity WHERE user_id IN (SELECT id FROM users WHERE username = ?)';
  connection.query(getActivityQuery, [username], (err, rows) => {
    if (err) {
      console.error('Error executing SQL query:', err);
      return res.status(500).json({ error: 'An error occurred while fetching user activity.' });
    }

    res.json(rows);
  });
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
