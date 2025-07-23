const { getUserIdFromToken } = require('../config/jwtProvider');
const User = require('../models/user');

const socketAuth = async (socket, next) => {
	try {
		// Get token from handshake auth or headers
		const token = socket.handshake.auth.token || 
					  socket.handshake.headers.authorization?.split(' ')[1];
		
		if (!token) {
			return next(new Error('Authentication token required'));
		}
		
		// Verify and decode token
		const userId = getUserIdFromToken(token);
		if (!userId) {
			return next(new Error('Invalid authentication token'));
		}
		
		// Get user from database
		const user = await User.findById(userId).select('-password');
		if (!user) {
			return next(new Error('User not found'));
		}
		
		// Store user info in socket
		socket.userId = userId;
		socket.user = user;
		
		next();
	} catch (error) {
		console.error('Socket authentication error:', error.message);
		next(new Error('Invalid authentication token'));
	}
};

module.exports = { socketAuth };