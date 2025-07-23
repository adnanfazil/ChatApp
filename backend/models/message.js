const mongoose = require("mongoose");

const messageSchema = mongoose.Schema(
	{
		sender: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		chat: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Chat",
			required: true,
		},
		// Message type
		messageType: {
			type: String,
			enum: ['text', 'image', 'file', 'video', 'audio'],
			default: 'text',
		},
		// Flexible content structure
		content: {
			// For text messages
			text: {
				type: String,
				trim: true,
			},
			// For file/media messages
			fileUrl: String,
			fileName: String,
			originalName: String,
			fileSize: Number,
			mimeType: String,
			// For images/videos
			thumbnail: String,
			dimensions: {
				width: Number,
				height: Number,
			},
			// For audio/video
			duration: Number,
			// Cloudinary public_id for deletion
			publicId: String,
		},
		// Message status
		isEdited: {
			type: Boolean,
			default: false,
		},
		editedAt: Date,
		isDeleted: {
			type: Boolean,
			default: false,
		},
		deletedAt: Date,
		// Legacy field for backward compatibility
		message: {
			type: String,
			trim: true,
		},
	},
	{
		timestamps: true,
	}
);

// Indexes for efficient queries
messageSchema.index({ chat: 1, createdAt: -1 });
messageSchema.index({ messageType: 1 });
messageSchema.index({ isDeleted: 1 });

// Virtual for backward compatibility
messageSchema.virtual('messageText').get(function() {
	return this.content?.text || this.message || '';
});

// Pre-save middleware to handle backward compatibility
messageSchema.pre('save', function(next) {
	// If it's a text message and content.text is set, also set the legacy message field
	if (this.messageType === 'text' && this.content?.text) {
		this.message = this.content.text;
	}
	// If legacy message field is set but content.text is not, set content.text
	if (this.message && !this.content?.text) {
		if (!this.content) this.content = {};
		this.content.text = this.message;
	}
	next();
});

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;
