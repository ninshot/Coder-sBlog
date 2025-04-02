const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config();

const app = express();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  }
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'mysql',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'rootpassword',
  database: process.env.DB_NAME || 'coders_blog'
};

// Function to create database connection
function createConnection() {
  return new Promise((resolve, reject) => {
    const connection = mysql.createConnection(dbConfig);
    
    connection.connect((err) => {
      if (err) {
        console.error('Error connecting to the database:', err);
        reject(err);
        return;
      }
      resolve(connection);
    });
  });
}

// Function to create tables
function createTables(connection) {
  return new Promise((resolve, reject) => {
    // Create channels table
    connection.query(`
      CREATE TABLE IF NOT EXISTS channels (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('Error creating channels table:', err);
        reject(err);
        return;
      }
      console.log('Channels table created or already exists');
    });

    // Create messages table (programming questions)
    connection.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        channel_id INT,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        image_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE
      )
    `, (err) => {
      if (err) {
        console.error('Error creating messages table:', err);
        reject(err);
        return;
      }
      console.log('Messages table created or already exists');
    });

    // Create replies table (answers/responses)
    connection.query(`
      CREATE TABLE IF NOT EXISTS replies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        message_id INT,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
      )
    `, (err) => {
      if (err) {
        console.error('Error creating replies table:', err);
        reject(err);
        return;
      }
      console.log('Replies table created or already exists');
      resolve();
    });
  });
}

// Initialize database connection and tables
let db;
async function initializeDatabase() {
  try {
    db = await createConnection();
    await createTables(db);
  } catch (err) {
    console.error('Failed to initialize database:', err);
    // Retry connection after 5 seconds
    setTimeout(initializeDatabase, 5000);
  }
}

// Start database initialization
initializeDatabase();

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
    res.status(201).json({ 
      id: results.insertId, 
      name, 
      description,
      message: 'Channel created successfully' 
    });
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

// Get a specific channel by ID
app.get('/api/channels/:id', (req, res) => {
  const { id } = req.params;
  const query = 'SELECT * FROM channels WHERE id = ?';
  
  db.query(query, [id], (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (results.length === 0) {
      res.status(404).json({ message: 'Channel not found' });
      return;
    }
    res.json(results[0]);
  });
});

// Message Routes (Programming Questions)
// Create a new message in a channel
app.post('/api/channels/:channelId/messages', upload.single('image'), (req, res) => {
  const { channelId } = req.params;
  const { title, content } = req.body;
  let imageUrl = null;

  console.log('Received message creation request:', {
    channelId,
    title,
    content,
    hasFile: !!req.file,
    fileDetails: req.file
  });

  if (req.file) {
    imageUrl = `/uploads/${req.file.filename}`;
    console.log('File uploaded successfully:', {
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype,
      imageUrl
    });
  }

  const query = 'INSERT INTO messages (channel_id, title, content, image_url) VALUES (?, ?, ?, ?)';
  
  db.query(query, [channelId, title, content, imageUrl], (err, results) => {
    if (err) {
      console.error('Error creating message:', err);
      res.status(500).json({ error: err.message });
      return;
    }

    // Get the newly created message with formatted timestamp
    const getMessageQuery = `
      SELECT id, channel_id, title, content, image_url,
             DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at
      FROM messages 
      WHERE id = ?
    `;
    
    db.query(getMessageQuery, [results.insertId], (err, messageResults) => {
      if (err) {
        console.error('Error fetching created message:', err);
        res.status(500).json({ error: err.message });
        return;
      }
      
      console.log('Created message:', messageResults[0]);
      res.status(201).json(messageResults[0]);
    });
  });
});

// Get all messages in a channel
app.get('/api/channels/:channelId/messages', async (req, res) => {
  const { channelId } = req.params;
  const query = `
    SELECT m.*, 
           DATE_FORMAT(m.created_at, '%Y-%m-%d %H:%i:%s') as created_at,
           COALESCE(
             (
               SELECT JSON_ARRAYAGG(
                 JSON_OBJECT(
                   'id', r.id,
                   'content', r.content,
                   'created_at', DATE_FORMAT(r.created_at, '%Y-%m-%d %H:%i:%s')
                 )
               )
               FROM replies r
               WHERE r.message_id = m.id
             ),
             JSON_ARRAY()
           ) as replies
    FROM messages m 
    WHERE m.channel_id = ? 
    ORDER BY m.created_at DESC
  `;
  
  try {
    const connection = await createConnection();
    connection.query(query, [channelId], (err, results) => {
      connection.end();
      if (err) {
        console.error('Error fetching messages:', err);
        res.status(500).json({ error: err.message });
        return;
      }
      
      // The replies are already parsed by mysql2
      const messages = results.map(message => ({
        ...message,
        replies: message.replies || []
      }));
      
      res.json(messages);
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Get a specific message with its replies
app.get('/api/messages/:messageId', (req, res) => {
  const { messageId } = req.params;
  const query = `
    SELECT m.*, c.name as channel_name 
    FROM messages m 
    JOIN channels c ON m.channel_id = c.id 
    WHERE m.id = ?
  `;
  
  db.query(query, [messageId], (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (results.length === 0) {
      res.status(404).json({ message: 'Message not found' });
      return;
    }
    res.json(results[0]);
  });
});

// Reply Routes (Answers/Responses)
// Create a reply to a message
app.post('/api/messages/:messageId/replies', async (req, res) => {
  const { messageId } = req.params;
  const { content } = req.body;
  const query = 'INSERT INTO replies (message_id, content) VALUES (?, ?)';
  
  try {
    const connection = await createConnection();
    connection.query(query, [messageId, content], async (err, results) => {
      if (err) {
        connection.end();
        res.status(500).json({ error: err.message });
        return;
      }

      // Get the newly created reply with formatted timestamp
      const getReplyQuery = `
        SELECT id, message_id, content, 
               DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at
        FROM replies 
        WHERE id = ?
      `;
      
      connection.query(getReplyQuery, [results.insertId], (err, replyResults) => {
        connection.end();
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        
        res.status(201).json(replyResults[0]);
      });
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to create reply' });
  }
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
