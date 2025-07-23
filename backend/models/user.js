const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
	{
		firstName: {
			type: String,
			required: true,
		},
		lastName: {
			type: String,
			required: true,
		},
		password: {
			type: String,
			required: true,
		},
		email: {
			type: String,
			required: true,
			unique: true,
		},
		image: {
			type: String,
			default:
				"https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg",
		},
		// Online status tracking
		isOnline: {
			type: Boolean,
			default: false,
		},
		lastSeen: {
			type: Date,
			default: Date.now,
		},
		socketId: {
			type: String,
			default: null,
		},
		// Connection tracking
		lastLoginIP: {
			type: String,
		},
		deviceInfo: {
			type: String,
		},
	},
	{
		timestamps: true,
	}
);

// Index for efficient queries
userSchema.index({ isOnline: 1 });
userSchema.index({ lastSeen: 1 });

const User = mongoose.model("User", userSchema);
module.exports = User;
