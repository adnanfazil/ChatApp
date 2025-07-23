const User = require('../models/user');
const Chat = require('../models/chat');

/**
 * Broadcast user online/offline status to all contacts
 * @param {string} userId - User ID
 * @param {boolean} isOnline - Online status
 * @param {Object} io - Socket.IO server instance
 */
const broadcastUserStatus = async (userId, isOnline, io) => {
	try {
		// Find all chats the user is part of
		const userChats = await Chat.find({
			users: userId
		}).populate('users', '_id');

		// Get all unique user IDs from these chats (contacts)
		const contactIds = new Set();
		userChats.forEach(chat => {
			chat.users.forEach(user => {
				if (user._id.toString() !== userId.toString()) {
					contactIds.add(user._id.toString());
				}
			});
		});

		// Get user info for broadcasting
		const user = await User.findById(userId).select('firstName lastName email image');

		// Broadcast status to all contacts
		contactIds.forEach(contactId => {
			io.to(contactId).emit('user_status_change', {
				userId,
				user: {
					_id: userId,
					firstName: user.firstName,
					lastName: user.lastName,
					email: user.email,
					image: user.image
				},
				isOnline,
				lastSeen: new Date(),
				timestamp: new Date()
			});
		});

		console.log(`Broadcasted ${isOnline ? 'online' : 'offline'} status for user ${userId} to ${contactIds.size} contacts`);
	} catch (error) {
		console.error('Error broadcasting user status:', error);
	}
};

/**
 * Get online status of multiple users
 * @param {Array} userIds - Array of user IDs
 * @returns {Object} Object with userId as key and status as value
 */
const getMultipleUserStatus = async (userIds) => {
	try {
		const users = await User.find({
			_id: { $in: userIds }
		}).select('_id isOnline lastSeen');

		const statusMap = {};
		users.forEach(user => {
			statusMap[user._id.toString()] = {
				isOnline: user.isOnline,
				lastSeen: user.lastSeen
			};
		});

		return statusMap;
	} catch (error) {
		console.error('Error getting multiple user status:', error);
		return {};
	}
};

/**
 * Update user online status in database
 * @param {string} userId - User ID
 * @param {boolean} isOnline - Online status
 * @param {string} socketId - Socket ID (optional)
 * @param {string} deviceInfo - Device information (optional)
 * @param {string} ipAddress - IP address (optional)
 */
const updateUserStatus = async (userId, isOnline, socketId = null, deviceInfo = null, ipAddress = null) => {
	try {
		const updateData = {
			isOnline,
			lastSeen: new Date()
		};

		if (isOnline) {
			updateData.socketId = socketId;
			if (deviceInfo) updateData.deviceInfo = deviceInfo;
			if (ipAddress) updateData.lastLoginIP = ipAddress;
		} else {
			updateData.socketId = null;
		}

		await User.findByIdAndUpdate(userId, updateData);
		console.log(`Updated ${isOnline ? 'online' : 'offline'} status for user ${userId}`);
	} catch (error) {
		console.error('Error updating user status:', error);
	}
};

/**
 * Get all online users in a chat
 * @param {string} chatId - Chat ID
 * @returns {Array} Array of online user IDs
 */
const getOnlineUsersInChat = async (chatId) => {
	try {
		const chat = await Chat.findById(chatId).populate({
			path: 'users',
			select: '_id isOnline',
			match: { isOnline: true }
		});

		if (!chat) return [];

		return chat.users.map(user => user._id.toString());
	} catch (error) {
		console.error('Error getting online users in chat:', error);
		return [];
	}
};

/**
 * Clean up offline users (remove stale online status)
 * This should be called periodically to clean up users who didn't disconnect properly
 */
const cleanupOfflineUsers = async () => {
	try {
		const staleThreshold = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
		
		const result = await User.updateMany(
			{
				isOnline: true,
				lastSeen: { $lt: staleThreshold }
			},
			{
				isOnline: false,
				socketId: null
			}
		);

		if (result.modifiedCount > 0) {
			console.log(`Cleaned up ${result.modifiedCount} stale online users`);
		}
	} catch (error) {
		console.error('Error cleaning up offline users:', error);
	}
};

module.exports = {
	broadcastUserStatus,
	getMultipleUserStatus,
	updateUserStatus,
	getOnlineUsersInChat,
	cleanupOfflineUsers
};