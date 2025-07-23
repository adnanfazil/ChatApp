const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const helmet = require("helmet");

const app = express();

// Security middleware
app.use(helmet({
	crossOriginResourcePolicy: { policy: "cross-origin" }
}));

const corsOptions = {
	origin: process.env.FRONTEND_URL,
	methods: ["GET", "POST", "PUT", "DELETE"],
	allowedHeaders: ["Content-Type", "Authorization"],
	credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
const PORT = process.env.PORT || 3000;

// All routers
const authRouter = require("./routes/auth");
const userRouter = require("./routes/user");
const chatRouter = require("./routes/chat");
const messageRouter = require("./routes/message");
const uploadRouter = require("./routes/upload");

// Connect to Database
main()
	.then(() => console.log("Database Connection established"))
	.catch((err) => console.log(err));

async function main() {
	await mongoose.connect('mongodb://127.0.0.1:27017/mydatabase');

}

// Root route
app.get("/", (req, res) => {
	res.json({
		message: "Welcome to Chat Application!",
		frontend_url: process.env.FRONTEND_URL,
		features: {
			fileUpload: true,
			onlineStatus: true,
			socketAuth: true
		},
		version: "2.0.0"
	});
});

// All routes
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/chat", chatRouter);
app.use("/api/message", messageRouter);
app.use("/api/upload", uploadRouter);

// Invalid routes
app.all("*", (req, res) => {
	res.status(404).json({ error: "Invalid Route" });
});

// Error handling middleware
app.use((err, req, res, next) => {
	console.error('Server error:', err);
	const errorMessage = err.message || "Something Went Wrong!";
	res.status(500).json({ message: errorMessage });
});

// Start the server
const server = app.listen(PORT, async () => {
	console.log(`Server listening on ${PORT}`);
});

// Socket.IO setup with authentication
const { Server } = require("socket.io");
const { socketAuth } = require("./middlewares/socketAuth");
const { broadcastUserStatus, updateUserStatus, cleanupOfflineUsers } = require("./utils/statusBroadcast");
const { scheduleCleanup } = require("./utils/fileCleanup");

const io = new Server(server, {
	pingTimeout: 60000,
	transports: ["websocket", "polling"],
	cors: corsOptions,
});

// Apply socket authentication middleware
io.use(socketAuth);

// Socket connection with enhanced features
io.on("connection", async (socket) => {
	console.log(`User ${socket.user.email} connected: ${socket.id}`);

	// Update user online status
	await updateUserStatus(
		socket.userId,
		true,
		socket.id,
		socket.handshake.headers['user-agent'],
		socket.handshake.address
	);

	// Broadcast online status to contacts
	await broadcastUserStatus(socket.userId, true, io);

	// Join user to their personal room
	socket.join(socket.userId);
	socket.emit("connected", {
		message: "Successfully connected",
		userId: socket.userId,
		timestamp: new Date()
	});

	// Enhanced message handler with file support
	const newMessageHandler = (newMessageReceived) => {
		let chat = newMessageReceived?.chat;
		if (!chat || !chat.users) return;

		chat.users.forEach((user) => {
			if (user._id === newMessageReceived.sender._id) return;
			console.log("Message received by:", user._id);
			socket.in(user._id).emit("message received", newMessageReceived);
		});
	};

	// Join a Chat Room and Typing effect
	const joinChatHandler = (room) => {
		if (socket.currentRoom) {
			if (socket.currentRoom === room) {
				console.log(`User already in Room: ${room}`);
				return;
			}
			socket.leave(socket.currentRoom);
			console.log(`User left Room: ${socket.currentRoom}`);
		}
		socket.join(room);
		socket.currentRoom = room;
		console.log("User joined Room:", room);
	};

	const typingHandler = (room) => {
		socket.in(room).emit("typing", {
			userId: socket.userId,
			user: {
				_id: socket.userId,
				firstName: socket.user.firstName,
				lastName: socket.user.lastName
			}
		});
	};

	const stopTypingHandler = (room) => {
		socket.in(room).emit("stop typing", {
			userId: socket.userId
		});
	};

	// Clear, Delete and Create chat handlers
	const clearChatHandler = (chatId) => {
		socket.in(chatId).emit("clear chat", chatId);
	};

	const deleteChatHandler = (chat, authUserId) => {
		if (!chat || !chat.users) return;
		chat.users.forEach((user) => {
			if (authUserId === user._id) return;
			console.log("Chat delete:", user._id);
			socket.in(user._id).emit("delete chat", chat._id);
		});
	};

	const chatCreateChatHandler = (chat, authUserId) => {
		if (!chat || !chat.users) return;
		chat.users.forEach((user) => {
			if (authUserId === user._id) return;
			console.log("Create chat:", user._id);
			socket.in(user._id).emit("chat created", chat);
		});
	};

	// File upload progress handler
	const fileUploadProgressHandler = (data) => {
		socket.emit("file upload progress", data);
	};

	// Online status request handler
	const getOnlineStatusHandler = async (userIds) => {
		try {
			const { getMultipleUserStatus } = require("./utils/statusBroadcast");
			const statusMap = await getMultipleUserStatus(userIds);
			socket.emit("online status response", statusMap);
		} catch (error) {
			console.error("Error getting online status:", error);
			socket.emit("online status error", { message: "Failed to get online status" });
		}
	};

	// Register event handlers
	socket.on("new message", newMessageHandler);
	socket.on("join chat", joinChatHandler);
	socket.on("typing", typingHandler);
	socket.on("stop typing", stopTypingHandler);
	socket.on("clear chat", clearChatHandler);
	socket.on("delete chat", deleteChatHandler);
	socket.on("chat created", chatCreateChatHandler);
	socket.on("file upload progress", fileUploadProgressHandler);
	socket.on("get online status", getOnlineStatusHandler);

	// Handle disconnect
	socket.on("disconnect", async () => {
		console.log(`User ${socket.user.email} disconnected: ${socket.id}`);
		
		// Update user offline status
		await updateUserStatus(socket.userId, false);
		
		// Broadcast offline status to contacts
		await broadcastUserStatus(socket.userId, false, io);
		
		// Clean up event listeners
		socket.off("new message", newMessageHandler);
		socket.off("join chat", joinChatHandler);
		socket.off("typing", typingHandler);
		socket.off("stop typing", stopTypingHandler);
		socket.off("clear chat", clearChatHandler);
		socket.off("delete chat", deleteChatHandler);
		socket.off("chat created", chatCreateChatHandler);
		socket.off("file upload progress", fileUploadProgressHandler);
		socket.off("get online status", getOnlineStatusHandler);
	});
});

// Start cleanup scheduler
const cleanupScheduler = scheduleCleanup();

// Cleanup offline users every 5 minutes
setInterval(cleanupOfflineUsers, 5 * 60 * 1000);

// Graceful shutdown
process.on('SIGTERM', () => {
	console.log('SIGTERM received, shutting down gracefully');
	cleanupScheduler.stop();
	server.close(() => {
		console.log('Server closed');
		process.exit(0);
	});
});

process.on('SIGINT', () => {
	console.log('SIGINT received, shutting down gracefully');
	cleanupScheduler.stop();
	server.close(() => {
		console.log('Server closed');
		process.exit(0);
	});
});

// Export io for use in other modules
module.exports = { io };
