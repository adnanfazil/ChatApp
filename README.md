# Chat Application - MERN Stack Real-Time Messaging Platform
Visitor count

## 📋 Project Overview
A comprehensive real-time chat application built using the MERN stack (MongoDB, Express.js, React.js, Node.js) with advanced features including file sharing, online/offline status tracking, and secure authentication. The application provides seamless communication with real-time updates via Socket.IO, responsive design with Tailwind CSS, and robust state management using Redux.

## 🚀 Key Features
### Core Messaging
- Real-time Chat : Instant messaging with Socket.IO
- Message Types : Support for text, images, videos, audio, and documents
- Typing Indicators : Real-time typing status

### File & Media Sharing
- Drag & Drop Upload : Intuitive file upload interface
- Multiple File Types : Images (JPEG, PNG, GIF, WebP), Videos (MP4, WebM), Audio (MP3, WAV), Documents (PDF, TXT)
- Cloud Storage : Cloudinary integration for reliable file hosting
- Upload Progress : Real-time progress tracking with cancel option
- Media Preview : Image previews and embedded media players
- File Validation : Client and server-side security checks

### User Management
- Authentication : Secure JWT-based login/signup
- Online/Offline Status : Real-time presence detection
- Last Seen : Timestamp tracking for offline users
- User Profiles : Profile management with image upload
- Contact Management : Add and manage contacts


## 🛠️ Technologies & Packages
### Backend
- Node.js : JavaScript runtime environment
- Express.js : Web application framework
- MongoDB : NoSQL database with Mongoose ODM
- Socket.IO : Real-time bidirectional communication
- JWT : Secure authentication tokens
- Cloudinary : Cloud-based media management
- Multer : File upload middleware
- Sharp : Image processing
- Helmet : Security middleware
- bcryptjs : Password hashing
### Frontend
- React.js : Component-based UI library
- Redux Toolkit : State management
- React Router : Client-side routing
- Socket.IO Client : Real-time communication
- Tailwind CSS : Utility-first CSS framework
- React Toastify : Notification system
- React Icons : Icon library
## 📦 Installation & Setup
### Prerequisites
- Node.js (v20.18.1 or higher)
- MongoDB (local or cloud instance)
- Cloudinary account (for file uploads)
### 1. Clone Repository
```
git clone https://github.com/adnanfazil/ChatApp.git
cd Chat_App
```
### 2. Backend Setup
```
cd backend
npm install
```
Create .env file in backend folder:

```
# Server Configuration
PORT=9000
FRONTEND_URL=http://localhost:5173

# Database
MONGODB_URI=mongodb://127.0.0.
1:27017/chat-app

# Authentication
JWT_SECRET=your-super-secret-jwt-key
-here

# Cloudinary Configuration 
(Required for file uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_nam
e
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secre
t

# File Upload Configuration
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/
png,image/gif,image/webp,
application/pdf,text/plain,video/
mp4,video/webm,audio/mpeg,audio/wav
SOCKET_AUTH_TIMEOUT=30000
```
### 3. Frontend Setup
```
cd frontend
npm install
```
Create .env file in frontend folder:

```
VITE_BACKEND_URL=http://
localhost:9000
```
### 4. Run the Application
Start Backend (from backend folder):

```
npm run dev
```
Start Frontend (from frontend folder):

```
npm run dev
```
### 5. Access Application
Open your browser and navigate to http://localhost:5173



```
## 🔒 Security Features
- JWT Authentication : Secure token-based authentication
- Socket Authentication : JWT validation for WebSocket connections
- File Validation : Type and size validation for uploads
- CORS Protection : Configured for specific origins
- Helmet.js : Security headers and protection
- Input Sanitization : Protection against malicious inputs
- Rate Limiting : Protection against spam and abuse
## 🐳 Docker Support
Run with Docker Compose:

```
docker-compose up --build
```
Individual Docker builds:

```
# Backend
cd backend
docker build -t chat-backend .

# Frontend
cd frontend
docker build -t chat-frontend .
```


