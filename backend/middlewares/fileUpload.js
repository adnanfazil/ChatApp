const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const mime = require('mime-types');
const { v4: uuidv4 } = require('uuid');

// Cloudinary storage configuration
const storage = new CloudinaryStorage({
	cloudinary: cloudinary,
	params: async (req, file) => {
		// Determine folder based on file type
		let folder = 'chat-app/files';
		if (file.mimetype.startsWith('image/')) {
			folder = 'chat-app/images';
		} else if (file.mimetype.startsWith('video/')) {
			folder = 'chat-app/videos';
		} else if (file.mimetype.startsWith('audio/')) {
			folder = 'chat-app/audio';
		}

		// Generate unique filename
		const uniqueName = `${uuidv4()}-${Date.now()}`;

		return {
			folder: folder,
			public_id: uniqueName,
			resource_type: 'auto', // Automatically detect resource type
			allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'txt', 'mp4', 'webm', 'mp3', 'wav'],
		};
	},
});

// File filter function
const fileFilter = (req, file, cb) => {
	const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(',') || [
		'image/jpeg',
		'image/png',
		'image/gif',
		'image/webp',
		'application/pdf',
		'text/plain',
		'video/mp4',
		'video/webm',
		'audio/mpeg',
		'audio/wav'
	];

	if (allowedTypes.includes(file.mimetype)) {
		cb(null, true);
	} else {
		cb(new Error(`File type ${file.mimetype} not allowed`), false);
	}
};

// Multer configuration
const upload = multer({
	storage: storage,
	fileFilter: fileFilter,
	limits: {
		fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
		files: 1, // Only one file at a time
	},
});

// Error handling middleware for multer
const handleMulterError = (error, req, res, next) => {
	if (error instanceof multer.MulterError) {
		if (error.code === 'LIMIT_FILE_SIZE') {
			return res.status(400).json({
				message: 'File too large',
				maxSize: process.env.MAX_FILE_SIZE || '10MB'
			});
		}
		if (error.code === 'LIMIT_FILE_COUNT') {
			return res.status(400).json({
				message: 'Too many files. Only one file allowed per upload.'
			});
		}
		if (error.code === 'LIMIT_UNEXPECTED_FILE') {
			return res.status(400).json({
				message: 'Unexpected field name. Use "file" as the field name.'
			});
		}
	}
	
	if (error.message.includes('File type') && error.message.includes('not allowed')) {
		return res.status(400).json({
			message: error.message,
			allowedTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || []
		});
	}

	next(error);
};

module.exports = {
	upload,
	handleMulterError
};