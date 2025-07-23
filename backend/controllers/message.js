const Chat = require("../models/chat");
const Message = require("../models/message");
const { deleteFile } = require('../controllers/fileUpload');

const createMessage = async (req, res) => {
	const { message, chatId, messageType = 'text' } = req.body;
	
	// Validate required fields
	if (!chatId) {
		return res.status(400).json({ message: "Chat ID is required" });
	}

	// For text messages, ensure message content is provided
	if (messageType === 'text' && !message) {
		return res.status(400).json({ message: "Message content is required" });
	}

	try {
		// Verify chat exists and user has access
		const chat = await Chat.findById(chatId);
		if (!chat) {
			return res.status(404).json({ message: "Chat not found" });
		}

		// Check if user is part of the chat
		const isUserInChat = chat.users.some(userId =>
			userId.toString() === req.user._id.toString()
		);

		if (!isUserInChat) {
			return res.status(403).json({ message: "Access denied. You are not part of this chat." });
		}

		// Create message data
		const messageData = {
			sender: req.user._id,
			chat: chatId,
			messageType,
		};

		// Handle different message types
		if (messageType === 'text') {
			messageData.content = { text: message };
			messageData.message = message; // For backward compatibility
		} else {
			// For file messages, content should be provided by file upload controller
			const { content } = req.body;
			if (!content) {
				return res.status(400).json({ message: "File content is required for non-text messages" });
			}
			messageData.content = content;
		}

		// Create the message
		const newMessage = await Message.create(messageData);

		// Update chat's latest message
		await Chat.findByIdAndUpdate(chatId, {
			latestMessage: newMessage._id,
		});

		// Populate and return the message (REMOVED groupAdmin from populate)
		const fullMessage = await Message.findById(newMessage._id)
			.populate("sender", "-password")
			.populate({
				path: "chat",
				populate: { path: "users", select: "-password" },
			});

		return res.status(201).json({
			data: fullMessage,
			success: true
		});

	} catch (error) {
		console.error('Create message error:', error);
		return res.status(500).json({
			message: "Failed to create message",
			error: error.message
		});
	}
};

const allMessage = async (req, res) => {
	try {
		const chatId = req.params.chatId;
		const { page = 1, limit = 50 } = req.query;

		// Verify chat exists and user has access
		const chat = await Chat.findById(chatId);
		if (!chat) {
			return res.status(404).json({ message: "Chat not found" });
		}

		// Check if user is part of the chat
		const isUserInChat = chat.users.some(userId =>
			userId.toString() === req.user._id.toString()
		);

		if (!isUserInChat) {
			return res.status(403).json({ message: "Access denied. You are not part of this chat." });
		}

		// Get messages with pagination
		const skip = (parseInt(page) - 1) * parseInt(limit);
		const messages = await Message.find({
			chat: chatId,
			isDeleted: false
		})
		.populate("sender", "-password")
		.populate("chat")
		.sort({ createdAt: -1 })
		.skip(skip)
		.limit(parseInt(limit));

		// Get total count for pagination
		const totalMessages = await Message.countDocuments({
			chat: chatId,
			isDeleted: false
		});

		return res.status(200).json({
			data: messages.reverse(), // Reverse to show oldest first
			pagination: {
				currentPage: parseInt(page),
				totalPages: Math.ceil(totalMessages / parseInt(limit)),
				totalMessages,
				hasMore: skip + messages.length < totalMessages
			},
			success: true
		});

	} catch (error) {
		console.error('Get messages error:', error);
		return res.status(500).json({
			message: "Failed to retrieve messages",
			error: error.message
		});
	}
};

const clearChat = async (req, res) => {
	try {
		const chatId = req.params.chatId;

		// Verify chat exists and user has access
		const chat = await Chat.findById(chatId);
		if (!chat) {
			return res.status(404).json({ message: "Chat not found" });
		}

		// Check if user is part of the chat
		const isUserInChat = chat.users.some(userId =>
			userId.toString() === req.user._id.toString()
		);

		if (!isUserInChat) {
			return res.status(403).json({ message: "Access denied. You are not part of this chat." });
		}

		// Get all messages with files to delete from Cloudinary
		const messagesWithFiles = await Message.find({
			chat: chatId,
			messageType: { $in: ['image', 'video', 'audio', 'file'] },
			'content.publicId': { $exists: true }
		});

		// Delete files from Cloudinary
		const deletePromises = messagesWithFiles.map(message => {
			if (message.content.publicId) {
				return deleteFile(message.content.publicId);
			}
		});

		await Promise.allSettled(deletePromises);

		// Delete all messages
		await Message.deleteMany({ chat: chatId });

		// Update chat's latest message to null
		await Chat.findByIdAndUpdate(chatId, {
			latestMessage: null
		});

		return res.status(200).json({
			message: "Chat cleared successfully",
			success: true
		});

	} catch (error) {
		console.error('Clear chat error:', error);
		return res.status(500).json({
			message: "Failed to clear chat",
			error: error.message
		});
	}
};

const deleteMessage = async (req, res) => {
	try {
		const { messageId } = req.params;

		// Find the message
		const message = await Message.findById(messageId).populate('chat');
		if (!message) {
			return res.status(404).json({ message: "Message not found" });
		}

		// Check if user is the sender (removed group admin check)
		const isOwner = message.sender.toString() === req.user._id.toString();

		if (!isOwner) {
			return res.status(403).json({ message: "You can only delete your own messages" });
		}

		// If message has a file, delete from Cloudinary
		if (message.content?.publicId) {
			await deleteFile(message.content.publicId);
		}

		// Soft delete the message
		await Message.findByIdAndUpdate(messageId, {
			isDeleted: true,
			deletedAt: new Date(),
			content: { text: "This message was deleted" }
		});

		return res.status(200).json({
			message: "Message deleted successfully",
			success: true
		});

	} catch (error) {
		console.error('Delete message error:', error);
		return res.status(500).json({
			message: "Failed to delete message",
			error: error.message
		});
	}
};

const editMessage = async (req, res) => {
	try {
		const { messageId } = req.params;
		const { message: newText } = req.body;

		if (!newText || newText.trim() === '') {
			return res.status(400).json({ message: "Message content is required" });
		}

		// Find the message
		const message = await Message.findById(messageId);
		if (!message) {
			return res.status(404).json({ message: "Message not found" });
		}

		// Check if user is the sender
		if (message.sender.toString() !== req.user._id.toString()) {
			return res.status(403).json({ message: "You can only edit your own messages" });
		}

		// Only text messages can be edited
		if (message.messageType !== 'text') {
			return res.status(400).json({ message: "Only text messages can be edited" });
		}

		// Update the message
		const updatedMessage = await Message.findByIdAndUpdate(
			messageId,
			{
				'content.text': newText.trim(),
				message: newText.trim(), // For backward compatibility
				isEdited: true,
				editedAt: new Date()
			},
			{ new: true }
		).populate("sender", "-password");

		return res.status(200).json({
			data: updatedMessage,
			message: "Message updated successfully",
			success: true
		});

	} catch (error) {
		console.error('Edit message error:', error);
		return res.status(500).json({
			message: "Failed to edit message",
			error: error.message
		});
	}
};

module.exports = {
	createMessage,
	allMessage,
	clearChat,
	deleteMessage,
	editMessage
};
