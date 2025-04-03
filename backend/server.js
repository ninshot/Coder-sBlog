const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Load environment variables
dotenv.config();

const app = express();

// JWT secret key
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Admin account credentials
const ADMIN_USER = {
  id: 1,
  username: 'admin',
  password: 'admin123', // This will be set during initialization
  displayName: 'System Administrator',
  isAdmin: true
};

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    // Ensure uploads directory exists with proper permissions
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    // Set directory permissions
    fs.chmodSync(uploadDir, '777');
    console.log('Upload directory:', uploadDir);
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = uniqueSuffix + path.extname(file.originalname);
    console.log('Generated filename:', filename);
    cb(null, filename);
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
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
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
        user_id INT,
        displayName VARCHAR(255),
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        image_url VARCHAR(255),
        upvotes INT DEFAULT 0,
        downvotes INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `, (err) => {
      if (err) {
        console.error('Error creating messages table:', err);
        reject(err);
        return;
      }
      console.log('Messages table created or already exists');
    });

    // Create replies table
    connection.query(`
      CREATE TABLE IF NOT EXISTS replies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        message_id INT,
        user_id INT,
        displayName VARCHAR(255),
        content TEXT NOT NULL,
        image_url VARCHAR(255),
        upvotes INT DEFAULT 0,
        downvotes INT DEFAULT 0,
        parent_reply_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (parent_reply_id) REFERENCES replies(id) ON DELETE CASCADE
      )
    `, (err) => {
      if (err) {
        console.error('Error creating replies table:', err);
        reject(err);
        return;
      }
      console.log('Replies table created or already exists');

      // Check if image_url column exists, add it if it doesn't
      connection.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'replies' 
        AND COLUMN_NAME = 'image_url'
      `, (err, results) => {
        if (err) {
          console.error('Error checking for image_url column:', err);
          reject(err);
          return;
        }

        if (results.length === 0) {
          // Add image_url column if it doesn't exist
          connection.query(`
            ALTER TABLE replies 
            ADD COLUMN image_url VARCHAR(255)
          `, (err) => {
            if (err) {
              console.error('Error adding image_url column:', err);
              reject(err);
              return;
            }
            console.log('Added image_url column to replies table');
            resolve();
          });
        } else {
          console.log('image_url column already exists in replies table');
          resolve();
        }
      });
    });

    // Create votes table
    connection.query(`
      CREATE TABLE IF NOT EXISTS votes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        message_id INT,
        reply_id INT,
        vote_type ENUM('upvote', 'downvote') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
        FOREIGN KEY (reply_id) REFERENCES replies(id) ON DELETE CASCADE,
        UNIQUE KEY unique_vote (user_id, message_id, reply_id)
      )
    `, (err) => {
      if (err) {
        console.error('Error creating votes table:', err);
        reject(err);
        return;
      }
      console.log('Votes table created or already exists');
      resolve();
    });

    // Create users table
    connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        displayName VARCHAR(255) NOT NULL,
        isAdmin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('Error creating users table:', err);
        reject(err);
        return;
      }
      console.log('Users table created or already exists');
    });

    // Create admin account if it doesn't exist
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync('admin123', salt);
    connection.query(`
      INSERT IGNORE INTO users (id, username, password, displayName, isAdmin)
      VALUES (1, 'admin', ?, 'System Administrator', TRUE)
    `, [hashedPassword], (err) => {
      if (err) {
        console.error('Error creating admin account:', err);
        reject(err);
        return;
      }
      console.log('Admin account created or already exists');
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
    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Failed to initialize database:', err);
    // Retry connection after 5 seconds
    setTimeout(initializeDatabase, 5000);
  }
}

// Start database initialization
initializeDatabase();

// Middleware to check database connection
const checkDatabaseConnection = (req, res, next) => {
  if (!db) {
    return res.status(503).json({ error: 'Database connection not established' });
  }
  next();
};

// Middleware to authenticate JWT tokens
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  console.log('Auth Header:', authHeader);
  
  const token = authHeader?.split(' ')[1];
  console.log('Extracted Token:', token);
  console.log('JWT_SECRET:', JWT_SECRET);
  
  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ error: 'No token provided' });
  }
  
  // First try to verify as JWT token
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.log('JWT verification failed:', err);
      // If JWT verification fails, check if it's the direct secret key
      if (token === JWT_SECRET) {
        console.log('Token validated as direct secret key');
        req.user = { id: 1, isAdmin: true }; // Default admin user for direct secret key
        next();
      } else {
        console.log('Token mismatch with secret key');
        return res.status(403).json({ error: 'Invalid token' });
      }
    } else {
      console.log('Token verified successfully as JWT');
      req.user = user;
      next();
    }
  });
}

// Admin middleware
const requireAdmin = (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Channel Routes
// Create a new channel
app.post('/api/channels', authenticateToken, (req, res) => {
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
app.post('/api/channels/:channelId/messages', authenticateToken, upload.single('image'), (req, res) => {
  const { channelId } = req.params;
  const { title, content, user_id, displayName } = req.body;
  let imageUrl = null;

  console.log('Received message creation request:', {
    channelId,
    title,
    content,
    user_id,
    displayName,
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

  const query = 'INSERT INTO messages (channel_id, user_id, displayName, title, content, image_url) VALUES (?, ?, ?, ?, ?, ?)';
  
  db.query(query, [channelId, user_id, displayName, title, content, imageUrl], (err, results) => {
    if (err) {
      console.error('Error creating message:', err);
      res.status(500).json({ error: err.message });
      return;
    }

    // Get the newly created message with formatted timestamp
    const getMessageQuery = `
      SELECT id, channel_id, user_id, displayName, title, content, image_url,
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
app.get('/api/channels/:channelId/messages', (req, res) => {
  const { channelId } = req.params;
  const query = `
    WITH RECURSIVE reply_tree AS (
      -- Base case: get all top-level replies (no parent)
      SELECT 
        id, 
        message_id, 
        user_id, 
        displayName, 
        content, 
        image_url, 
        parent_reply_id,
        created_at,
        upvotes,
        downvotes,
        0 as level
      FROM replies 
      WHERE message_id IN (
        SELECT id FROM messages WHERE channel_id = ?
      ) AND parent_reply_id IS NULL
      
      UNION ALL
      
      -- Recursive case: get all child replies
      SELECT 
        r.id, 
        r.message_id, 
        r.user_id, 
        r.displayName, 
        r.content, 
        r.image_url, 
        r.parent_reply_id,
        r.created_at,
        r.upvotes,
        r.downvotes,
        rt.level + 1
      FROM replies r
      JOIN reply_tree rt ON r.parent_reply_id = rt.id
    )
    SELECT 
      m.*,
      DATE_FORMAT(m.created_at, '%Y-%m-%d %H:%i:%s') as created_at,
      COALESCE(
        (
          SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
              'id', rt.id,
              'user_id', rt.user_id,
              'displayName', rt.displayName,
              'content', rt.content,
              'image_url', rt.image_url,
              'parent_reply_id', rt.parent_reply_id,
              'created_at', DATE_FORMAT(rt.created_at, '%Y-%m-%d %H:%i:%s'),
              'upvotes', rt.upvotes,
              'downvotes', rt.downvotes,
              'replies', (
                SELECT JSON_ARRAYAGG(
                  JSON_OBJECT(
                    'id', child.id,
                    'user_id', child.user_id,
                    'displayName', child.displayName,
                    'content', child.content,
                    'image_url', child.image_url,
                    'parent_reply_id', child.parent_reply_id,
                    'created_at', DATE_FORMAT(child.created_at, '%Y-%m-%d %H:%i:%s'),
                    'upvotes', child.upvotes,
                    'downvotes', child.downvotes
                  )
                )
                FROM reply_tree child
                WHERE child.parent_reply_id = rt.id
              )
            )
          )
          FROM reply_tree rt
          WHERE rt.message_id = m.id AND rt.level = 0
        ),
        JSON_ARRAY()
      ) as replies
    FROM messages m 
    WHERE m.channel_id = ? 
    ORDER BY m.created_at DESC
  `;
  
  db.query(query, [channelId, channelId], (err, results) => {
    if (err) {
      console.error('Error fetching messages:', err);
      res.status(500).json({ error: err.message });
      return;
    }
    
    res.json(results);
  });
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
// Create a reply to a message or another reply
app.post('/api/messages/:messageId/replies', authenticateToken, upload.single('image'), (req, res) => {
  const { messageId } = req.params;
  const { content, user_id, displayName, parent_reply_id } = req.body;
  let imageUrl = null;

  if (req.file) {
    imageUrl = `/uploads/${req.file.filename}`;
  }

  const query = 'INSERT INTO replies (message_id, user_id, displayName, content, image_url, parent_reply_id) VALUES (?, ?, ?, ?, ?, ?)';
  
  db.query(query, [messageId, user_id, displayName, content, imageUrl, parent_reply_id], (err, results) => {
    if (err) {
      console.error('Error creating reply:', err);
      res.status(500).json({ error: err.message });
      return;
    }

    const getReplyQuery = `
      SELECT id, message_id, user_id, displayName, content, image_url, parent_reply_id,
             DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at
      FROM replies 
      WHERE id = ?
    `;
    
    db.query(getReplyQuery, [results.insertId], (err, replyResults) => {
      if (err) {
        console.error('Error fetching created reply:', err);
        res.status(500).json({ error: err.message });
        return;
      }
      
      res.status(201).json(replyResults[0]);
    });
  });
});

// Get all replies for a message with nested structure
app.get('/api/messages/:messageId/replies', (req, res) => {
  const { messageId } = req.params;
  const query = `
    WITH RECURSIVE reply_tree AS (
      -- Base case: get all top-level replies (no parent)
      SELECT 
        id, 
        message_id, 
        user_id, 
        displayName, 
        content, 
        image_url, 
        parent_reply_id,
        created_at,
        upvotes,
        downvotes,
        0 as level
      FROM replies 
      WHERE message_id = ? AND parent_reply_id IS NULL
      
      UNION ALL
      
      -- Recursive case: get all child replies
      SELECT 
        r.id, 
        r.message_id, 
        r.user_id, 
        r.displayName, 
        r.content, 
        r.image_url, 
        r.parent_reply_id,
        r.created_at,
        r.upvotes,
        r.downvotes,
        rt.level + 1
      FROM replies r
      JOIN reply_tree rt ON r.parent_reply_id = rt.id
    )
    SELECT 
      id, 
      message_id, 
      user_id, 
      displayName, 
      content, 
      image_url, 
      parent_reply_id,
      DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at,
      level
    FROM reply_tree
    ORDER BY level, created_at ASC
  `;
  
  db.query(query, [messageId], (err, results) => {
    if (err) {
      console.error('Error fetching replies:', err);
      res.status(500).json({ error: err.message });
      return;
    }
    
    // Convert flat results into nested structure
    const buildNestedReplies = (replies, parentId = null) => {
      return replies
        .filter(reply => reply.parent_reply_id === parentId)
        .map(reply => ({
          ...reply,
          replies: buildNestedReplies(replies, reply.id)
        }));
    };
    
    const nestedReplies = buildNestedReplies(results);
    res.json(nestedReplies);
  });
});

// User Routes
// Register a new user
app.post('/api/auth/register', async (req, res) => {
  const { username, password, displayName } = req.body;

  if (!username || !password || !displayName) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = 'INSERT INTO users (username, password, displayName) VALUES (?, ?, ?)';
    
    db.query(query, [username, hashedPassword, displayName], (err, results) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ message: 'Username already exists' });
        }
        console.error('Error registering user:', err);
        return res.status(500).json({ error: err.message });
      }

      // Get the newly created user
      const getUserQuery = 'SELECT id, username, displayName, isAdmin FROM users WHERE id = ?';
      db.query(getUserQuery, [results.insertId], (err, userResults) => {
        if (err) {
          console.error('Error fetching created user:', err);
          return res.status(500).json({ error: err.message });
        }

        const user = userResults[0];
        const token = jwt.sign(
          { 
            id: user.id, 
            username: user.username, 
            displayName: user.displayName,
            isAdmin: user.isAdmin 
          },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        res.status(201).json({ 
          token,
          user: {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            isAdmin: user.isAdmin
          }
        });
      });
    });
  } catch (error) {
    console.error('Error in registration:', error);
    res.status(500).json({ error: error.message });
  }
});

// Login user
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  const query = 'SELECT * FROM users WHERE username = ?';
  
  db.query(query, [username], async (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (results.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = results[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        displayName: user.displayName,
        isAdmin: user.isAdmin 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ 
      token,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        isAdmin: user.isAdmin
      }
    });
  });
});

// Admin Routes
// Get all users (admin only)
app.get('/api/admin/users', authenticateToken, requireAdmin, (req, res) => {
  const query = 'SELECT id, username, displayName, isAdmin, created_at FROM users';
  
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// Delete a user (admin only)
app.delete('/api/admin/users/:userId', authenticateToken, requireAdmin, (req, res) => {
  const { userId } = req.params;
  
  if (userId === '1') {
    return res.status(400).json({ message: 'Cannot delete admin account' });
  }

  const query = 'DELETE FROM users WHERE id = ?';
  
  db.query(query, [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  });
});

// Delete a channel (admin only)
app.delete('/api/admin/channels/:channelId', authenticateToken, requireAdmin, (req, res) => {
  const { channelId } = req.params;
  const query = 'DELETE FROM channels WHERE id = ?';
  
  db.query(query, [channelId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'Channel not found' });
    }
    res.json({ message: 'Channel deleted successfully' });
  });
});

// Delete a message (user can delete their own messages)
app.delete('/api/messages/:messageId', authenticateToken, (req, res) => {
  const { messageId } = req.params;
  const userId = req.user.id;
  const isAdmin = req.user.isAdmin;

  // First check if the message exists and belongs to the user
  const checkQuery = 'SELECT user_id FROM messages WHERE id = ?';
  
  db.query(checkQuery, [messageId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const message = results[0];
    // Only allow deletion if user is admin or owns the message
    if (!isAdmin && message.user_id !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }

    // Delete the message
    const deleteQuery = 'DELETE FROM messages WHERE id = ?';
    db.query(deleteQuery, [messageId], (err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (results.affectedRows === 0) {
        return res.status(404).json({ message: 'Message not found' });
      }
      res.json({ message: 'Message deleted successfully' });
    });
  });
});

// Delete a reply (user can delete their own replies)
app.delete('/api/replies/:replyId', authenticateToken, (req, res) => {
  const { replyId } = req.params;
  const userId = req.user.id;
  const isAdmin = req.user.isAdmin;

  // First check if the reply exists and belongs to the user
  const checkQuery = 'SELECT user_id FROM replies WHERE id = ?';
  
  db.query(checkQuery, [replyId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'Reply not found' });
    }

    const reply = results[0];
    // Only allow deletion if user is admin or owns the reply
    if (!isAdmin && reply.user_id !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this reply' });
    }

    // Delete the reply
    const deleteQuery = 'DELETE FROM replies WHERE id = ?';
    db.query(deleteQuery, [replyId], (err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (results.affectedRows === 0) {
        return res.status(404).json({ message: 'Reply not found' });
      }
      res.json({ message: 'Reply deleted successfully' });
    });
  });
});

// Vote Routes
// Vote on a message
app.post('/api/messages/:messageId/vote', authenticateToken, (req, res) => {
  const { messageId } = req.params;
  const { voteType } = req.body;
  const userId = req.user.id;

  if (!['upvote', 'downvote'].includes(voteType)) {
    return res.status(400).json({ message: 'Invalid vote type' });
  }

  // Start a transaction
  db.beginTransaction((err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Check if user has already voted
    const checkVoteQuery = 'SELECT vote_type FROM votes WHERE user_id = ? AND message_id = ?';
    db.query(checkVoteQuery, [userId, messageId], (err, results) => {
      if (err) {
        db.rollback(() => {
          res.status(500).json({ error: err.message });
        });
        return;
      }

      if (results.length > 0) {
        const previousVote = results[0].vote_type;
        if (previousVote === voteType) {
          // Remove the vote if clicking the same button again
          const removeVoteQuery = 'DELETE FROM votes WHERE user_id = ? AND message_id = ?';
          const updateCountQuery = `
            UPDATE messages 
            SET ${voteType}s = ${voteType}s - 1 
            WHERE id = ?
          `;

          db.query(removeVoteQuery, [userId, messageId], (err) => {
            if (err) {
              db.rollback(() => {
                res.status(500).json({ error: err.message });
              });
              return;
            }

            db.query(updateCountQuery, [messageId], (err) => {
              if (err) {
                db.rollback(() => {
                  res.status(500).json({ error: err.message });
                });
                return;
              }

              db.commit((err) => {
                if (err) {
                  db.rollback(() => {
                    res.status(500).json({ error: err.message });
                  });
                  return;
                }
                res.json({ message: 'Vote removed successfully' });
              });
            });
          });
        } else {
          // Change vote type
          const updateVoteQuery = 'UPDATE votes SET vote_type = ? WHERE user_id = ? AND message_id = ?';
          const updateCountQuery = `
            UPDATE messages 
            SET ${previousVote}s = ${previousVote}s - 1,
                ${voteType}s = ${voteType}s + 1 
            WHERE id = ?
          `;

          db.query(updateVoteQuery, [voteType, userId, messageId], (err) => {
            if (err) {
              db.rollback(() => {
                res.status(500).json({ error: err.message });
              });
              return;
            }

            db.query(updateCountQuery, [messageId], (err) => {
              if (err) {
                db.rollback(() => {
                  res.status(500).json({ error: err.message });
                });
                return;
              }

              db.commit((err) => {
                if (err) {
                  db.rollback(() => {
                    res.status(500).json({ error: err.message });
                  });
                  return;
                }
                res.json({ message: 'Vote updated successfully' });
              });
            });
          });
        }
      } else {
        // Add new vote
        const addVoteQuery = 'INSERT INTO votes (user_id, message_id, vote_type) VALUES (?, ?, ?)';
        const updateCountQuery = `
          UPDATE messages 
          SET ${voteType}s = ${voteType}s + 1 
          WHERE id = ?
        `;

        db.query(addVoteQuery, [userId, messageId, voteType], (err) => {
          if (err) {
            db.rollback(() => {
              res.status(500).json({ error: err.message });
            });
            return;
          }

          db.query(updateCountQuery, [messageId], (err) => {
            if (err) {
              db.rollback(() => {
                res.status(500).json({ error: err.message });
              });
              return;
            }

            db.commit((err) => {
              if (err) {
                db.rollback(() => {
                  res.status(500).json({ error: err.message });
                });
                return;
              }
              res.json({ message: 'Vote added successfully' });
            });
          });
        });
      }
    });
  });
});

// Vote on a reply
app.post('/api/replies/:replyId/vote', authenticateToken, (req, res) => {
  const { replyId } = req.params;
  const { voteType } = req.body;
  const userId = req.user.id;

  if (!['upvote', 'downvote'].includes(voteType)) {
    return res.status(400).json({ message: 'Invalid vote type' });
  }

  // Start a transaction
  db.beginTransaction((err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Check if user has already voted
    const checkVoteQuery = 'SELECT vote_type FROM votes WHERE user_id = ? AND reply_id = ?';
    db.query(checkVoteQuery, [userId, replyId], (err, results) => {
      if (err) {
        return db.rollback(() => {
          res.status(500).json({ error: err.message });
        });
      }

      const handleTransaction = (query, params, successMessage) => {
        db.query(query, params, (err) => {
          if (err) {
            return db.rollback(() => {
              res.status(500).json({ error: err.message });
            });
          }

          db.commit((err) => {
            if (err) {
              return db.rollback(() => {
                res.status(500).json({ error: err.message });
              });
            }
            res.json({ message: successMessage });
          });
        });
      };

      if (results.length > 0) {
        const previousVote = results[0].vote_type;
        
        if (previousVote === voteType) {
          // Remove the vote if clicking the same button again
          const removeVoteQuery = 'DELETE FROM votes WHERE user_id = ? AND reply_id = ?';
          const updateCountQuery = `
            UPDATE replies 
            SET ${voteType}s = ${voteType}s - 1 
            WHERE id = ?
          `;

          db.query(removeVoteQuery, [userId, replyId], (err) => {
            if (err) {
              return db.rollback(() => {
                res.status(500).json({ error: err.message });
              });
            }

            handleTransaction(updateCountQuery, [replyId], 'Vote removed successfully');
          });
        } else {
          // Change vote type
          const updateVoteQuery = 'UPDATE votes SET vote_type = ? WHERE user_id = ? AND reply_id = ?';
          const updateCountQuery = `
            UPDATE replies 
            SET ${previousVote}s = ${previousVote}s - 1,
                ${voteType}s = ${voteType}s + 1 
            WHERE id = ?
          `;

          db.query(updateVoteQuery, [voteType, userId, replyId], (err) => {
            if (err) {
              return db.rollback(() => {
                res.status(500).json({ error: err.message });
              });
            }

            handleTransaction(updateCountQuery, [replyId], 'Vote updated successfully');
          });
        }
      } else {
        // Add new vote
        const addVoteQuery = 'INSERT INTO votes (user_id, reply_id, vote_type) VALUES (?, ?, ?)';
        const updateCountQuery = `
          UPDATE replies 
          SET ${voteType}s = ${voteType}s + 1 
          WHERE id = ?
        `;

        db.query(addVoteQuery, [userId, replyId, voteType], (err) => {
          if (err) {
            return db.rollback(() => {
              res.status(500).json({ error: err.message });
            });
          }

          handleTransaction(updateCountQuery, [replyId], 'Vote added successfully');
        });
      }
    });
  });
});

// Get user's vote status for a message
app.get('/api/messages/:messageId/vote-status', authenticateToken, (req, res) => {
  const { messageId } = req.params;
  const userId = req.user.id;

  const query = 'SELECT vote_type FROM votes WHERE user_id = ? AND message_id = ?';
  db.query(query, [userId, messageId], (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ voteType: results.length > 0 ? results[0].vote_type : null });
  });
});

// Get user's vote status for a reply
app.get('/api/replies/:replyId/vote-status', authenticateToken, (req, res) => {
  const { replyId } = req.params;
  const userId = req.user.id;

  const query = 'SELECT vote_type FROM votes WHERE user_id = ? AND reply_id = ?';
  db.query(query, [userId, replyId], (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ voteType: results.length > 0 ? results[0].vote_type : null });
  });
});

// Like/Dislike Routes
// Like a message
app.post('/api/messages/:messageId/like', authenticateToken, (req, res) => {
  const { messageId } = req.params;
  const query = 'UPDATE messages SET upvotes = upvotes + 1 WHERE id = ?';
  
  db.query(query, [messageId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'Message not found' });
    }
    res.json({ message: 'Message liked successfully' });
  });
});

// Dislike a message
app.post('/api/messages/:messageId/dislike', authenticateToken, (req, res) => {
  const { messageId } = req.params;
  const query = 'UPDATE messages SET downvotes = downvotes + 1 WHERE id = ?';
  
  db.query(query, [messageId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'Message not found' });
    }
    res.json({ message: 'Message disliked successfully' });
  });
});

// Like a reply
app.post('/api/replies/:replyId/like', authenticateToken, (req, res) => {
  const { replyId } = req.params;
  const query = 'UPDATE replies SET upvotes = upvotes + 1 WHERE id = ?';
  
  db.query(query, [replyId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'Reply not found' });
    }
    res.json({ message: 'Reply liked successfully' });
  });
});

// Dislike a reply
app.post('/api/replies/:replyId/dislike', authenticateToken, (req, res) => {
  const { replyId } = req.params;
  const query = 'UPDATE replies SET downvotes = downvotes + 1 WHERE id = ?';
  
  db.query(query, [replyId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'Reply not found' });
    }
    res.json({ message: 'Reply disliked successfully' });
  });
});

// Search Routes
// Search messages and replies
app.get('/api/search', checkDatabaseConnection, (req, res) => {
  const { query } = req.query;
  
  if (!query || query.trim() === '') {
    return res.status(400).json({ message: 'Search query is required' });
  }

  // Clean and prepare the search query
  const cleanedQuery = query.trim().replace(/[%_]/g, '\\$&'); // Escape SQL wildcards
  const searchTerms = cleanedQuery.split(/\s+/).filter(term => term.length > 0);
  
  if (searchTerms.length === 0) {
    return res.status(400).json({ message: 'Search query is required' });
  }

  // Build the search conditions
  const messageConditions = searchTerms.map(term => 
    `(m.title LIKE ? OR m.content LIKE ?)`
  ).join(' AND ');
  
  const replyConditions = searchTerms.map(term => 
    `(r.content LIKE ?)`
  ).join(' AND ');

  const searchQuery = `
    SELECT 
      'message' as type,
      m.id,
      m.title,
      m.content,
      m.created_at,
      m.channel_id,
      c.name as channel_name,
      m.displayName as author,
      m.upvotes,
      m.downvotes,
      m.image_url,
      (
        CASE 
          WHEN m.title LIKE ? THEN 2
          WHEN m.content LIKE ? THEN 1
          ELSE 0
        END
      ) as relevance
    FROM messages m
    JOIN channels c ON m.channel_id = c.id
    WHERE m.title LIKE ? OR m.content LIKE ?
    
    UNION ALL
    
    SELECT 
      'reply' as type,
      r.id,
      NULL as title,
      r.content,
      r.created_at,
      m.channel_id,
      c.name as channel_name,
      r.displayName as author,
      r.upvotes,
      r.downvotes,
      r.image_url,
      (
        CASE 
          WHEN r.content LIKE ? THEN 1
          ELSE 0
        END
      ) as relevance
    FROM replies r
    JOIN messages m ON r.message_id = m.id
    JOIN channels c ON m.channel_id = c.id
    WHERE r.content LIKE ?
    
    ORDER BY relevance DESC, created_at DESC
  `;

  // Prepare parameters for the query
  const searchPattern = `%${cleanedQuery}%`;
  const params = [
    // Message title and content conditions for relevance
    searchPattern,
    searchPattern,
    // Message title and content conditions for WHERE
    searchPattern,
    searchPattern,
    // Reply content condition for relevance
    searchPattern,
    // Reply content condition for WHERE
    searchPattern
  ];
  
  db.query(searchQuery, params, (err, results) => {
    if (err) {
      console.error('Error searching:', err);
      return res.status(500).json({ error: err.message });
    }
    
    // Format the results to include proper image URLs
    const formattedResults = results.map(result => ({
      ...result,
      image_url: result.image_url ? `/uploads/${result.image_url}` : null,
      created_at: new Date(result.created_at).toISOString()
    }));
    
    res.json(formattedResults);
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
