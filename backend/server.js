const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const mysql = require('mysql2');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Database connection configuration
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'coders_blog'
});

// Connect to database
db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Connected to MySQL database');
  
  // Create tables if they don't exist
  createTables();
});

// Create necessary tables
function createTables() {
  // Create channels table
  db.query(`
    CREATE TABLE IF NOT EXISTS channels (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create messages table
  db.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      channel_id INT,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE
    )
  `);

  // Create replies table
  db.query(`
    CREATE TABLE IF NOT EXISTS replies (
      id INT AUTO_INCREMENT PRIMARY KEY,
      message_id INT,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
    )
  `);
}

// Channel Routes
// Create a new channel
app.post('/api/channels', (req, res) => {
  const { name, description } = req.body;
  const query = 'INSERT INTO channels (name, description) VALUES (?, ?)';
  
  db.query(query, [name, description], (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.status(201).json({ id: results.insertId, name, description });
  });
});

// Get all channels
app.get('/api/channels', (req, res) => {
  const query = 'SELECT * FROM channels ORDER BY created_at DESC';
  
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(results);
  });
});

// Message Routes
// Create a new message in a channel
app.post('/api/channels/:channelId/messages', (req, res) => {
  const { channelId } = req.params;
  const { title, content } = req.body;
  const query = 'INSERT INTO messages (channel_id, title, content) VALUES (?, ?, ?)';
  
  db.query(query, [channelId, title, content], (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.status(201).json({ id: results.insertId, channel_id: channelId, title, content });
  });
});

// Get all messages in a channel
app.get('/api/channels/:channelId/messages', (req, res) => {
  const { channelId } = req.params;
  const query = 'SELECT * FROM messages WHERE channel_id = ? ORDER BY created_at DESC';
  
  db.query(query, [channelId], (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(results);
  });
});

// Reply Routes
// Create a reply to a message
app.post('/api/messages/:messageId/replies', (req, res) => {
  const { messageId } = req.params;
  const { content } = req.body;
  const query = 'INSERT INTO replies (message_id, content) VALUES (?, ?)';
  
  db.query(query, [messageId, content], (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.status(201).json({ id: results.insertId, message_id: messageId, content });
  });
});

// Get all replies for a message
app.get('/api/messages/:messageId/replies', (req, res) => {
  const { messageId } = req.params;
  const query = 'SELECT * FROM replies WHERE message_id = ? ORDER BY created_at ASC';
  
  db.query(query, [messageId], (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(results);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
