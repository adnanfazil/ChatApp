# Chat Application Backend Enhancement Plan

## Overview

This document outlines the implementation plan for enhancing the chat application backend with:
- Online/offline status tracking
- Socket connection authorization via JWT
- File/media upload system
- Secure file serving

## Current Architecture Analysis

### Existing Foundation
- **Express.js** server with CORS and middleware setup
- **Socket.IO** for real-time communication
- **MongoDB/Mongoose** for data persistence
- **JWT authentication** system already implemented
- **Modular structure** with separate routes, controllers, models, and middlewares

### Current Models
- **User Model**: Basic user information (firstName, lastName, email, password, image)
- **Message Model**: Simple text messages with sender and chat references
- **Chat Model**: Chat rooms with users, group admin, and latest message

## Implementation Plan

### Phase 1: Dependencies and Setup

#### Required Package Dependencies
```json
{
  "multer": "^1.4.5-lts.1",
  "sharp": "^0.33.0",
  "mime-types": "^2.1.35",
  "uuid": "^9.0.1",
  "helmet": "^7.1.0"
}
```

#### Environment Variables to Add
```env
# File Upload Configuration
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,application/pdf,text/plain
UPLOAD_PATH=./uploads
FILE_URL_EXPIRY=3600

# Security
SOCKET_AUTH_TIMEOUT=30000
```

### Phase 2: Model Updates

#### Enhanced User Model
```javascript
const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  image: { type: String, default: "..." },
  
  // New fields for online status
  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now },
  socketId: { type: String, default: null },
  
  // Connection tracking
  lastLoginIP: String,
  deviceInfo: String
}, {
  timestamps: true
});
```

#### Enhanced Message Model
```javascript
const messageSchema = mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  chat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Chat",
    required: true
  },
  
  // Message type and content
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'video', 'audio'],
    default: 'text'
  },
  
  // Flexible content structure
  content: {
    text: String,
    fileUrl: String,
    fileName: String,
    originalName: String,
    fileSize: Number,
    mimeType: String,
    thumbnail: String,
    duration: Number, // for audio/video
    dimensions: {
      width: Number,
      height: Number
    }
  },
  
  // Message status
  isEdited: { type: Boolean, default: false },
  editedAt: Date,
  isDeleted: { type: Boolean, default: false },
  deletedAt: Date
}, {
  timestamps: true
});
```

### Phase 3: Socket.IO JWT Authentication

#### Socket Authentication Middleware
```javascript
// middlewares/socketAuth.js
const { getUserIdFromToken } = require('../config/jwtProvider');
const User = require('../models/user');

const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || 
                  socket.handshake.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return next(new Error('Authentication token required'));
    }
    
    const userId = getUserIdFromToken(token);
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return next(new Error('User not found'));
    }
    
    socket.userId = userId;
    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Invalid authentication token'));
  }
};
```

#### Updated Socket.IO Server Setup
```javascript
// Enhanced socket connection handling
io.use(socketAuth);

io.on('connection', async (socket) => {
  console.log(`User ${socket.user.email} connected: ${socket.id}`);
  
  // Update user online status
  await User.findByIdAndUpdate(socket.userId, {
    isOnline: true,
    socketId: socket.id,
    lastSeen: new Date()
  });
  
  // Broadcast online status to user's contacts
  await broadcastUserStatus(socket.userId, true);
  
  // Handle disconnect
  socket.on('disconnect', async () => {
    await User.findByIdAndUpdate(socket.userId, {
      isOnline: false,
      socketId: null,
      lastSeen: new Date()
    });
    
    await broadcastUserStatus(socket.userId, false);
  });
});
```

### Phase 4: File Upload System

#### File Upload Middleware
```javascript
// middlewares/fileUpload.js
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const mime = require('mime-types');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = process.env.UPLOAD_PATH || './uploads';
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = process.env.ALLOWED_FILE_TYPES.split(',');
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('File type not allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB
  }
});
```

#### File Validation Utilities
```javascript
// utils/fileValidation.js
const sharp = require('sharp');
const mime = require('mime-types');

const validateFile = async (file) => {
  const validation = {
    isValid: true,
    errors: [],
    metadata: {}
  };
  
  // Check file size
  if (file.size > parseInt(process.env.MAX_FILE_SIZE)) {
    validation.isValid = false;
    validation.errors.push('File size exceeds limit');
  }
  
  // Validate image files
  if (file.mimetype.startsWith('image/')) {
    try {
      const imageInfo = await sharp(file.path).metadata();
      validation.metadata.dimensions = {
        width: imageInfo.width,
        height: imageInfo.height
      };
      
      // Generate thumbnail for images
      const thumbnailPath = file.path.replace(/(\.[^.]+)$/, '_thumb$1');
      await sharp(file.path)
        .resize(200, 200, { fit: 'inside' })
        .toFile(thumbnailPath);
      validation.metadata.thumbnail = thumbnailPath;
    } catch (error) {
      validation.isValid = false;
      validation.errors.push('Invalid image file');
    }
  }
  
  return validation;
};
```

### Phase 5: File Upload Controller

#### File Upload Controller
```javascript
// controllers/fileUpload.js
const { validateFile } = require('../utils/fileValidation');
const Message = require('../models/message');
const Chat = require('../models/chat');

const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const { chatId, messageType = 'file' } = req.body;
    
    // Validate the uploaded file
    const validation = await validateFile(req.file);
    if (!validation.isValid) {
      return res.status(400).json({ 
        message: 'File validation failed',
        errors: validation.errors 
      });
    }
    
    // Create message with file
    const messageContent = {
      fileUrl: `/api/files/${req.file.filename}`,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      ...validation.metadata
    };
    
    const newMessage = await Message.create({
      sender: req.user._id,
      chat: chatId,
      messageType,
      content: messageContent
    });
    
    // Update chat's latest message
    await Chat.findByIdAndUpdate(chatId, {
      latestMessage: newMessage._id
    });
    
    // Populate and return the message
    const fullMessage = await Message.findById(newMessage._id)
      .populate('sender', '-password')
      .populate({
        path: 'chat',
        populate: { path: 'users groupAdmin', select: '-password' }
      });
    
    res.status(201).json({ data: fullMessage });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
```

### Phase 6: Secure File Serving

#### File Serving Controller
```javascript
// controllers/fileServing.js
const path = require('path');
const fs = require('fs').promises;
const Message = require('../models/message');

const serveFile = async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(process.env.UPLOAD_PATH || './uploads', filename);
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ message: 'File not found' });
    }
    
    // Find message containing this file
    const message = await Message.findOne({
      'content.fileName': filename
    }).populate('chat');
    
    if (!message) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    // Check if user has access to this file
    const hasAccess = message.chat.users.some(
      userId => userId.toString() === req.user._id.toString()
    );
    
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Serve the file
    res.sendFile(path.resolve(filePath));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
```

### Phase 7: Route Updates

#### File Upload Routes
```javascript
// routes/upload.js
const express = require('express');
const router = express.Router();
const { authorization } = require('../middlewares/authorization');
const { upload } = require('../middlewares/fileUpload');
const { uploadFile } = require('../controllers/fileUpload');
const { serveFile } = require('../controllers/fileServing');

// File upload endpoint
router.post('/', 
  authorization, 
  upload.single('file'), 
  uploadFile
);

// File serving endpoint
router.get('/files/:filename', 
  authorization, 
  serveFile
);

module.exports = router;
```

#### Updated Message Routes
```javascript
// routes/message.js - Enhanced
const express = require('express');
const router = express.Router();
const wrapAsync = require('../middlewares/wrapAsync');
const { authorization } = require('../middlewares/authorization');
const messageController = require('../controllers/message');

// Text message
router.post('/', authorization, wrapAsync(messageController.createMessage));

// Get messages
router.get('/:chatId', authorization, wrapAsync(messageController.allMessage));

// Clear chat
router.delete('/clear/:chatId', authorization, wrapAsync(messageController.clearChat));

// Delete specific message
router.delete('/:messageId', authorization, wrapAsync(messageController.deleteMessage));

// Edit message
router.put('/:messageId', authorization, wrapAsync(messageController.editMessage));

module.exports = router;
```

### Phase 8: Enhanced Socket.IO Handlers

#### Online Status Broadcasting
```javascript
// utils/statusBroadcast.js
const User = require('../models/user');
const Chat = require('../models/chat');

const broadcastUserStatus = async (userId, isOnline) => {
  try {
    // Find all chats the user is part of
    const userChats = await Chat.find({
      users: userId
    }).populate('users', '_id');
    
    // Get all unique user IDs from these chats
    const contactIds = new Set();
    userChats.forEach(chat => {
      chat.users.forEach(user => {
        if (user._id.toString() !== userId.toString()) {
          contactIds.add(user._id.toString());
        }
      });
    });
    
    // Broadcast status to all contacts
    contactIds.forEach(contactId => {
      io.to(contactId).emit('user_status_change', {
        userId,
        isOnline,
        lastSeen: new Date()
      });
    });
  } catch (error) {
    console.error('Error broadcasting user status:', error);
  }
};
```

### Phase 9: Utility Functions

#### File Cleanup Utilities
```javascript
// utils/fileCleanup.js
const fs = require('fs').promises;
const path = require('path');
const Message = require('../models/message');

const cleanupOrphanedFiles = async () => {
  try {
    const uploadDir = process.env.UPLOAD_PATH || './uploads';
    const files = await fs.readdir(uploadDir);
    
    for (const file of files) {
      const message = await Message.findOne({
        'content.fileName': file
      });
      
      if (!message) {
        // File is orphaned, delete it
        await fs.unlink(path.join(uploadDir, file));
        console.log(`Deleted orphaned file: ${file}`);
      }
    }
  } catch (error) {
    console.error('Error during file cleanup:', error);
  }
};

// Run cleanup daily
setInterval(cleanupOrphanedFiles, 24 * 60 * 60 * 1000);
```

## Security Considerations

### File Upload Security
1. **File Type Validation**: Whitelist allowed MIME types
2. **File Size Limits**: Prevent large file uploads
3. **Filename Sanitization**: Use UUID-based naming
4. **Virus Scanning**: Ready for integration with antivirus APIs
5. **Access Control**: Verify user permissions before serving files

### Socket.IO Security
1. **JWT Authentication**: Validate tokens on connection
2. **Rate Limiting**: Prevent spam and abuse
3. **Input Validation**: Sanitize all socket data
4. **Connection Limits**: Prevent resource exhaustion

### General Security
1. **HTTPS Only**: Force secure connections in production
2. **CORS Configuration**: Restrict origins appropriately
3. **Helmet.js**: Security headers
4. **Input Sanitization**: Prevent injection attacks

## Performance Optimizations

### File Handling
1. **Thumbnail Generation**: Automatic for images
2. **Compression**: Optimize file sizes
3. **CDN Integration**: Ready for cloud storage
4. **Caching**: File metadata caching

### Database Optimizations
1. **Indexing**: Add indexes for frequently queried fields
2. **Pagination**: Implement for message loading
3. **Connection Pooling**: Optimize database connections

## Testing Strategy

### Unit Tests
- File upload validation
- JWT authentication
- Message creation with files
- Online status tracking

### Integration Tests
- Socket.IO authentication flow
- File upload and serving
- Real-time status updates
- Message delivery with attachments

### Security Tests
- File upload vulnerabilities
- Authentication bypass attempts
- Access control verification
- Rate limiting effectiveness

## Deployment Considerations

### Environment Setup
```bash
# Create upload directory
mkdir -p uploads
chmod 755 uploads

# Set environment variables
export MAX_FILE_SIZE=10485760
export ALLOWED_FILE_TYPES="image/jpeg,image/png,image/gif,application/pdf"
export UPLOAD_PATH="./uploads"
```

### Production Recommendations
1. **Cloud Storage**: Migrate to AWS S3 or similar
2. **Load Balancing**: Handle multiple server instances
3. **File CDN**: Serve files through CDN
4. **Monitoring**: Track file upload metrics
5. **Backup Strategy**: Regular file backups

## Migration Plan

### Database Migration
```javascript
// Migration script for existing data
const migrateExistingMessages = async () => {
  const messages = await Message.find({ messageType: { $exists: false } });
  
  for (const message of messages) {
    await Message.findByIdAndUpdate(message._id, {
      messageType: 'text',
      content: { text: message.message }
    });
  }
};
```

### Gradual Rollout
1. **Phase 1**: Deploy online status tracking
2. **Phase 2**: Add file upload capabilities
3. **Phase 3**: Enable media message types
4. **Phase 4**: Full feature activation

## Monitoring and Maintenance

### Key Metrics
- File upload success/failure rates
- Socket connection stability
- Online user count accuracy
- File storage usage
- Message delivery latency

### Maintenance Tasks
- Regular file cleanup
- Database optimization
- Security updates
- Performance monitoring
- Backup verification

---

This implementation plan provides a comprehensive roadmap for enhancing your chat application with advanced features while maintaining security, performance, and scalability.