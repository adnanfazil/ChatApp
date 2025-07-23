const { validateFile, getMessageType, isFileSafe } = require('../utils/fileValidation');
const Message = require('../models/message');
const Chat = require('../models/chat');
const cloudinary = require('../config/cloudinary');

/**
 * Upload file and create message
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const uploadFile = async (req, res) => {
	try {
		if (!req.file) {
			return res.status(400).json({ 
				message: 'No file uploaded',
				success: false 
			});
		}

		const { chatId } = req.body;

		if (!chatId) {
			// Clean up uploaded file if chatId is missing
			if (req.file.public_id) {
				await cloudinary.uploader.destroy(req.file.public_id);
			}
			return res.status(400).json({ 
				message: 'Chat ID is required',
				success: false 
			});
		}

		// Verify chat exists and user has access
		const chat = await Chat.findById(chatId);
		if (!chat) {
			// Clean up uploaded file
			if (req.file.public_id) {
				await cloudinary.uploader.destroy(req.file.public_id);
			}
			return res.status(404).json({ 
				message: 'Chat not found',
				success: false 
			});
		}

		// Check if user is part of the chat
		const isUserInChat = chat.users.some(userId => 
			userId.toString() === req.user._id.toString()
		);

		if (!isUserInChat) {
			// Clean up uploaded file
			if (req.file.public_id) {
				await cloudinary.uploader.destroy(req.file.public_id);
			}
			return res.status(403).json({ 
				message: 'Access denied. You are not part of this chat.',
				success: false 
			});
		}

		// Security check
		if (!isFileSafe(req.file)) {
			// Clean up uploaded file
			if (req.file.public_id) {
				await cloudinary.uploader.destroy(req.file.public_id);
			}
			return res.status(400).json({ 
				message: 'File type not allowed for security reasons',
				success: false 
			});
		}

		// Validate the uploaded file
		const validation = await validateFile(req.file);
		if (!validation.isValid) {
			// Clean up uploaded file
			if (req.file.public_id) {
				await cloudinary.uploader.destroy(req.file.public_id);
			}
			return res.status(400).json({ 
				message: 'File validation failed',
				errors: validation.errors,
				success: false 
			});
		}

		// Determine message type
		const messageType = getMessageType(req.file.mimetype);

		// Create message content
		const messageContent = {
			fileUrl: req.file.secure_url || req.file.path, // Fallback to path if secure_url not available
			fileName: req.file.filename || req.file.public_id,
			originalName: req.file.originalname,
			fileSize: req.file.size,
			mimeType: req.file.mimetype,
			publicId: req.file.public_id,
			...validation.metadata
		};

		// Debug log to check what we're getting from Cloudinary
		console.log('Cloudinary file object:', {
			secure_url: req.file.secure_url,
			path: req.file.path,
			public_id: req.file.public_id,
			filename: req.file.filename
		});
		console.log('Message content being saved:', messageContent);

		// Create new message
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
				populate: { path: 'users', select: '-password' }
			});

		res.status(201).json({ 
			data: fullMessage,
			success: true,
			message: 'File uploaded successfully'
		});

	} catch (error) {
		console.error('File upload error:', error);
		
		// Clean up uploaded file in case of error
		if (req.file?.public_id) {
			try {
				await cloudinary.uploader.destroy(req.file.public_id);
			} catch (cleanupError) {
				console.error('Error cleaning up file:', cleanupError);
			}
		}

		res.status(500).json({ 
			message: 'File upload failed',
			error: error.message,
			success: false 
		});
	}
};

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<boolean>} Success status
 */
const deleteFile = async (publicId) => {
	try {
		const result = await cloudinary.uploader.destroy(publicId);
		return result.result === 'ok';
	} catch (error) {
		console.error('Error deleting file from Cloudinary:', error);
		return false;
	}
};

/**
 * Get file info from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<Object|null>} File info or null
 */
const getFileInfo = async (publicId) => {
	try {
		const result = await cloudinary.api.resource(publicId);
		return result;
	} catch (error) {
		console.error('Error getting file info:', error);
		return null;
	}
};

/**
 * Generate secure URL for file access
 * @param {string} publicId - Cloudinary public ID
 * @param {Object} options - Transformation options
 * @returns {string} Secure URL
 */
const generateSecureUrl = (publicId, options = {}) => {
	try {
		return cloudinary.url(publicId, {
			secure: true,
			...options
		});
	} catch (error) {
		console.error('Error generating secure URL:', error);
		return null;
	}
};

module.exports = {
	uploadFile,
	deleteFile,
	getFileInfo,
	generateSecureUrl
};