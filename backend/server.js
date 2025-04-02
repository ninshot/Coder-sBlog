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

    // Create replies table if it doesn't exist
    connection.query(`
      CREATE TABLE IF NOT EXISTS replies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        message_id INT,
        user_id INT,
        displayName VARCHAR(255),
        content TEXT NOT NULL,
        image_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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
  } catch (err) {
    console.error('Failed to initialize database:', err);
    // Retry connection after 5 seconds
    setTimeout(initializeDatabase, 5000);
  }
}

// Start database initialization
initializeDatabase();

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

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
                   'user_id', r.user_id,
                   'displayName', r.displayName,
                   'content', r.content,
                   'image_url', r.image_url,
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
app.post('/api/messages/:messageId/replies', authenticateToken, upload.single('image'), (req, res) => {
  const { messageId } = req.params;
  const { content, user_id, displayName } = req.body;
  let imageUrl = null;

  console.log('Received reply creation request:', {
    messageId,
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

  const query = 'INSERT INTO replies (message_id, user_id, displayName, content, image_url) VALUES (?, ?, ?, ?, ?)';
  
  db.query(query, [messageId, user_id, displayName, content, imageUrl], (err, results) => {
    if (err) {
      console.error('Error creating reply:', err);
      res.status(500).json({ error: err.message });
      return;
    }

    // Get the newly created reply with formatted timestamp
    const getReplyQuery = `
      SELECT id, message_id, user_id, displayName, content, image_url,
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
      
      console.log('Created reply:', replyResults[0]);
      res.status(201).json(replyResults[0]);
    });
  });
});

// Get all replies for a message
app.get('/api/messages/:messageId/replies', (req, res) => {
  const { messageId } = req.params;
  const query = `
    SELECT id, message_id, user_id, displayName, content, image_url,
           DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at
    FROM replies 
    WHERE message_id = ? 
    ORDER BY created_at ASC
  `;
  
  db.query(query, [messageId], (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(results);
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

// Delete a message (admin only)
app.delete('/api/admin/messages/:messageId', authenticateToken, requireAdmin, (req, res) => {
  const { messageId } = req.params;
  const query = 'DELETE FROM messages WHERE id = ?';
  
  db.query(query, [messageId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'Message not found' });
    }
    res.json({ message: 'Message deleted successfully' });
  });
});

// Delete a reply (admin only)
app.delete('/api/admin/replies/:replyId', authenticateToken, requireAdmin, (req, res) => {
  const { replyId } = req.params;
  const query = 'DELETE FROM replies WHERE id = ?';
  
  db.query(query, [replyId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'Reply not found' });
    }
    res.json({ message: 'Reply deleted successfully' });
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
