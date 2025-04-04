# CodeConnect

CodeConnect is a modern web application designed for programmers to connect, share knowledge, and solve problems together. It provides a platform for users to discuss programming-related questions, share solutions, and collaborate in various programming channels.

## 🌟 Features

### User Features
- **Authentication System**
  - Secure login and registration
  - JWT-based authentication
  - User profile management

- **Channel Management**
  - Browse and join programming channels
  - Create and participate in discussions
  - Real-time message updates

- **Content Interaction**
  - Post messages and replies
  - Upvote/downvote system
  - Bookmark important content
  - Image upload support
  - Rich text formatting

- **Search Functionality**
  - Search across messages and users
  - Advanced filtering options
  - Sort by relevance, date, or post count

- **User Analytics**
  - Detailed activity statistics
  - Visual data representation
  - Performance metrics

### Admin Features
- **Dashboard**
  - User management
  - Channel moderation
  - System analytics
  - Admin privilege management

## 🛠️ Tech Stack

### Frontend
- **Framework**: React.js
- **State Management**: React Hooks
- **Routing**: React Router v7
- **Styling**: CSS Modules
- **Charts**: Chart.js
- **Build Tool**: Vite
- **Containerization**: Docker

### Backend
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
- Docker (optional)
- npm or yarn

### Local Development Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```

2. Backend Setup:
   ```bash
   cd backend
   npm install
   ```
   Create `.env` file:
   ```
   DB_HOST=localhost
   DB_USER=your_username
   DB_PASSWORD=your_password
   DB_NAME=coders_blog
   JWT_SECRET=your_jwt_secret
   PORT=8000
   ```

3. Frontend Setup:
   ```bash
   cd frontend
   npm install
   ```
   Create `.env` file:
   ```
   VITE_API_BASE_URL=http://localhost:8000
   ```

4. Start the servers:
   ```bash
   # Terminal 1 (Backend)
   cd backend
   npm run dev

   # Terminal 2 (Frontend)
   cd frontend
   npm run dev
   ```

### Docker Setup

1. Build and start the containers:
   ```bash
   docker-compose up --build
   ```

2. Access the application:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:8000

## 📁 Project Structure

```
CodeConnect/
├── frontend/              # Frontend application
│   ├── src/              # Source files
│   ├── public/           # Static assets
│   ├── Dockerfile        # Frontend Docker configuration
│   └── nginx.conf        # Nginx configuration
│
├── backend/              # Backend server
│   ├── server.js         # Main application file
│   ├── uploads/          # Uploaded files directory
│   └── Dockerfile        # Backend Docker configuration
│
├── docker-compose.yml    # Docker Compose configuration
└── README.md            # Project documentation
```

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- CORS protection
- Input validation
- File upload restrictions
- Admin-only endpoints protection
- XSS protection
- CSRF protection

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop
- Tablet
- Mobile devices

## 🚀 Deployment

### Production Deployment
1. Build the frontend:
   ```bash
   cd frontend
   npm run build
   ```

2. Start the backend server:
   ```bash
   cd backend
   npm start
   ```

### Docker Deployment
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 📝 API Documentation

For detailed API documentation, please refer to:
- [Backend API Documentation](backend/README.md)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

