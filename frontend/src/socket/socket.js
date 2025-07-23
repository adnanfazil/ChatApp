import { io } from "socket.io-client";

// Get backend URL with fallback
const ENDPOINT = import.meta.env.VITE_BACKEND_URL || "http://localhost:9000";

// Validate endpoint
if (!ENDPOINT || ENDPOINT === "undefined") {
	console.error("VITE_BACKEND_URL is not defined. Please check your .env file.");
}

// Create socket connection with JWT authentication
const createSocket = () => {
	const token = localStorage.getItem("token");
	
	// Only create socket if we have a valid endpoint
	if (!ENDPOINT || ENDPOINT === "undefined") {
		console.error("Cannot create socket connection: Invalid backend URL");
		return null;
	}
	
	const socket = io(ENDPOINT, {
		reconnectionDelay: 1000,
		reconnection: true,
		reconnectionAttempts: 10,
		transports: ["websocket", "polling"],
		agent: false,
		upgrade: false,
		rejectUnauthorized: false,
		auth: {
			token: token
		}
	});

	// Handle authentication errors
	socket.on("connect_error", (error) => {
		console.error("Socket connection error:", error.message);
		if (error.message.includes("Authentication")) {
			// Token is invalid, redirect to login
			localStorage.removeItem("token");
			window.location.href = "/signin";
		}
	});

	// Handle successful connection
	socket.on("connected", (data) => {
		console.log("Socket connected successfully:", data);
	});

	// Handle user status changes
	socket.on("user_status_change", (data) => {
		console.log("User status changed:", data);
		// Dispatch to Redux store if needed
		window.dispatchEvent(new CustomEvent("userStatusChange", { detail: data }));
	});

	return socket;
};

// Initialize socket only if endpoint is valid AND user is authenticated
let socket = null;
try {
	// Only create socket if we have a token
	if (localStorage.getItem("token")) {
		socket = createSocket();
	}
} catch (error) {
	console.error("Failed to create socket connection:", error);
}

// Function to initialize socket (creates new connection if none exists)
export const initializeSocket = () => {
	if (!socket || socket.disconnected) {
		socket = createSocket();
	}
	return socket;
};

// Function to get current socket instance
export const getSocket = () => {
	return socket;
};

// Function to reconnect with new token
export const reconnectSocket = () => {
	if (socket) {
		socket.disconnect();
	}
	socket = createSocket();
	return socket;
};

// Export socket with null check
export default socket;
export { socket }; // Add named export for compatibility
