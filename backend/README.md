# CodeConnect Backend

This is the backend server for the CodeConnect application, built with Node.js and Express. It provides a RESTful API for the frontend application to interact with the database and handle various operations.

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL
- **Authentication**: JWT
- **File Upload**: Multer
- **Security**: bcrypt, CORS

## 📦 Installation

### Prerequisites

- Node.js (v18 or higher)
- MySQL Server
- npm or yarn

### Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with the following variables:
   ```
   DB_HOST=localhost
   DB_USER=your_username
   DB_PASSWORD=your_password
   DB_NAME=coders_blog
   JWT_SECRET=your_jwt_secret
   PORT=8000
   ```

4. Start the server:
   ```bash
   npm run dev
   ```

## 📡 API Endpoints

### Authentication

- **POST** `/api/auth/register`
  - Register a new user
  - Required fields: `username`, `password`, `displayName`
  - Returns: JWT token and user data

- **POST** `/api/auth/login`
  - Authenticate user
  - Required fields: `username`, `password`
  - Returns: JWT token and user data

### Channels

- **GET** `/api/channels`
  - Get all channels
  - Returns: List of channels

- **GET** `/api/channels/:id`
  - Get specific channel by ID
  - Returns: Channel details

- **POST** `/api/channels`
  - Create a new channel (Admin only)
  - Required fields: `name`, `description`
  - Returns: Created channel data

### Messages

- **GET** `/api/channels/:channelId/messages`
  - Get all messages in a channel
  - Returns: List of messages

- **POST** `/api/channels/:channelId/messages`
  - Create a new message
  - Required fields: `title`, `content`, `user_id`, `displayName`
  - Optional: Image upload
  - Returns: Created message data

- **GET** `/api/messages/:messageId`
  - Get specific message by ID
  - Returns: Message details

### Replies

- **POST** `/api/messages/:messageId/replies`
  - Create a reply to a message
  - Required fields: `content`, `user_id`, `displayName`
  - Optional: `parent_reply_id`, image upload
  - Returns: Created reply data

- **GET** `/api/messages/:messageId/replies`
  - Get all replies for a message
  - Returns: List of replies

### User Analytics

- **GET** `/api/users/:userId/analytics`
  - Get user statistics and activity
  - Returns: User data, post counts, channel activity, etc.

### Admin Endpoints

- **GET** `/api/admin/users`
  - Get all users (Admin only)
  - Returns: List of users

- **GET** `/api/admin/channels`
  - Get all channels with statistics (Admin only)
  - Returns: List of channels with stats

- **GET** `/api/admin/analytics`
  - Get system-wide analytics (Admin only)
  - Returns: System statistics

### Interactions

- **POST** `/api/messages/:messageId/like`
  - Like a message
  - Returns: Success message

- **POST** `/api/messages/:messageId/dislike`
  - Dislike a message
  - Returns: Success message

- **POST** `/api/bookmarks`
  - Bookmark a message
  - Required fields: `message_id`
  - Returns: Success message

- **GET** `/api/bookmarks`
  - Get user's bookmarks
  - Returns: List of bookmarked messages

### Search

- **GET** `/api/search`
  - Search across messages and users
  - Query parameters: `query`, `type`, `sort`
  - Returns: Search results

## 🔒 Security

- JWT-based authentication
- Password hashing with bcrypt
- CORS protection
- Input validation
- File upload restrictions
- Admin-only endpoints protection

## 📁 Project Structure

```
backend/
├── server.js          # Main application file
├── package.json       # Project dependencies
├── .env              # Environment variables
├── uploads/          # Uploaded files directory
└── README.md         # Documentation
```

## 🚀 Available Scripts

- `npm start`: Start the production server
- `npm run dev`: Start the development server with nodemon

## 🔧 Configuration

The backend requires the following environment variables:

- `DB_HOST`: Database host
- `DB_USER`: Database username
- `DB_PASSWORD`: Database password
- `DB_NAME`: Database name
- `JWT_SECRET`: JWT secret key
- `PORT`: Server port (default: 8000)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
