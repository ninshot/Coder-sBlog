# CodeConnect Frontend

CodeConnect is a modern web application that provides a platform for programmers to connect, share knowledge, and solve problems together. This repository contains the frontend implementation of the application.

## 🚀 Features

- **User Authentication**
  - Secure login and registration
  - JWT-based authentication
  - Protected routes

- **Channel Management**
  - Browse and join programming channels
  - Create and participate in discussions
  - Real-time message updates

- **Content Interaction**
  - Post messages and replies
  - Upvote/downvote system
  - Bookmark important content
  - Rich text formatting

- **User Analytics**
  - Detailed activity statistics
  - Visual data representation
  - Performance metrics

- **Search Functionality**
  - Search across messages and users
  - Advanced filtering options
  - Sort by relevance or date

- **Admin Dashboard**
  - User management
  - Channel moderation
  - System analytics

## 📄 Pages

- **Landing Page** (`/`)
  - Welcome screen with project overview
  - Feature highlights
  - Call-to-action for registration/login

- **Login Page** (`/login`)
  - User authentication
  - Form validation
  - Error handling

- **Registration Page** (`/register`)
  - New user registration
  - Username and password validation
  - Display name setup

- **Channels Page** (`/channels`)
  - List of all available channels
  - Channel creation (admin only)
  - Channel search and filtering

- **Channel Detail Page** (`/channels/:channelId`)
  - Channel-specific messages
  - Message creation and replies
  - Upvote/downvote functionality
  - Image upload support

- **Search Page** (`/search`)
  - Search across messages and users
  - Advanced filtering options
  - Sort by relevance, date, or post count

- **User Analytics Page** (`/users/:userId/analytics`)
  - User activity statistics
  - Visual data representation
  - Post and interaction metrics

- **Admin Dashboard** (`/admin`)
  - User management
  - Channel moderation
  - System-wide analytics
  - Admin privilege management

- **Bookmarks Page** (`/bookmarks`)
  - Saved messages and replies
  - Quick access to important content
  - Bookmark management

## 🛠️ Tech Stack

- **Frontend Framework**: React.js
- **State Management**: React Hooks
- **Routing**: React Router v7
- **Styling**: CSS Modules
- **Charts**: Chart.js
- **Build Tool**: Vite
- **Containerization**: Docker

## 📦 Installation

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Docker (optional)

### Local Development

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

### Docker Setup

1. Build the Docker image:
   ```bash
   docker build -t codeconnect-frontend .
   ```

2. Run the container:
   ```bash
   docker run -p 3000:80 codeconnect-frontend
   ```

## 🔧 Configuration

The frontend requires the following environment variables:

- `VITE_API_BASE_URL`: Backend API URL (default: http://localhost:8000)

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/         # Page components
│   ├── services/      # API services
│   ├── styles/        # CSS styles
│   ├── App.jsx        # Main application component
│   └── main.jsx       # Application entry point
├── public/            # Static assets
├── Dockerfile         # Docker configuration
├── nginx.conf         # Nginx configuration
└── package.json       # Project dependencies
```

## 🚀 Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm run lint`: Run ESLint

## 🔒 Security

- JWT-based authentication
- Protected routes
- Input validation


## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop


## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request



