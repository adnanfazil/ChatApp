const sharp = require('sharp');
const mime = require('mime-types');

/**
 * Validate uploaded file and extract metadata
 * @param {Object} file - Multer file object
 * @returns {Object} Validation result with metadata
 */
const validateFile = async (file) => {
	const validation = {
		isValid: true,
		errors: [],
		metadata: {}
	};

	try {
		// Check file size
		const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024;
		if (file.size > maxSize) {
			validation.isValid = false;
			validation.errors.push(`File size exceeds limit of ${maxSize / (1024 * 1024)}MB`);
		}

		// Check file type
		const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(',') || [];
		if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
			validation.isValid = false;
			validation.errors.push(`File type ${file.mimetype} not allowed`);
		}

		// Extract metadata based on file type
		if (file.mimetype.startsWith('image/')) {
			validation.metadata = await validateImage(file);
		} else if (file.mimetype.startsWith('video/')) {
			validation.metadata = await validateVideo(file);
		} else if (file.mimetype.startsWith('audio/')) {
			validation.metadata = await validateAudio(file);
		} else {
			validation.metadata = await validateDocument(file);
		}

		// Add common metadata
		validation.metadata.fileSize = file.size;
		validation.metadata.mimeType = file.mimetype;
		validation.metadata.originalName = file.originalname;

	} catch (error) {
		console.error('File validation error:', error);
		validation.isValid = false;
		validation.errors.push('File validation failed');
	}

	return validation;
};

/**
 * Validate image files and extract metadata
 * @param {Object} file - Multer file object
 * @returns {Object} Image metadata
 */
const validateImage = async (file) => {
	const metadata = {};

	try {
		// For Cloudinary uploads, we can't use sharp directly on the file path
		// Instead, we'll get metadata from Cloudinary response
		if (file.width && file.height) {
			metadata.dimensions = {
				width: file.width,
				height: file.height
			};
		}

		// If we have a secure_url, that's our main file URL
		if (file.secure_url) {
			metadata.fileUrl = file.secure_url;
		} else if (file.path) {
			// Fallback to path if secure_url is not available
			metadata.fileUrl = file.path;
		}

		// Cloudinary provides thumbnail URLs for images
		if (file.public_id && metadata.fileUrl) {
			metadata.publicId = file.public_id;
			// Generate thumbnail URL using Cloudinary transformations
			metadata.thumbnail = metadata.fileUrl.replace('/upload/', '/upload/w_200,h_200,c_fit/');
		}

	} catch (error) {
		console.error('Image validation error:', error);
		throw new Error('Invalid image file');
	}

	return metadata;
};

/**
 * Validate video files and extract metadata
 * @param {Object} file - Multer file object
 * @returns {Object} Video metadata
 */
const validateVideo = async (file) => {
	const metadata = {};

	try {
		if (file.secure_url) {
			metadata.fileUrl = file.secure_url;
		}

		if (file.public_id) {
			metadata.publicId = file.public_id;
			// Generate video thumbnail using Cloudinary
			metadata.thumbnail = file.secure_url?.replace('/upload/', '/upload/so_0,w_200,h_200,c_fit/').replace(/\.[^.]+$/, '.jpg');
		}

		// Cloudinary provides duration for videos
		if (file.duration) {
			metadata.duration = file.duration;
		}

		if (file.width && file.height) {
			metadata.dimensions = {
				width: file.width,
				height: file.height
			};
		}

	} catch (error) {
		console.error('Video validation error:', error);
		throw new Error('Invalid video file');
	}

	return metadata;
};

/**
 * Validate audio files and extract metadata
 * @param {Object} file - Multer file object
 * @returns {Object} Audio metadata
 */
const validateAudio = async (file) => {
	const metadata = {};

	try {
		if (file.secure_url) {
			metadata.fileUrl = file.secure_url;
		}

		if (file.public_id) {
			metadata.publicId = file.public_id;
		}

		// Cloudinary provides duration for audio files
		if (file.duration) {
			metadata.duration = file.duration;
		}

	} catch (error) {
		console.error('Audio validation error:', error);
		throw new Error('Invalid audio file');
	}

	return metadata;
};

/**
 * Validate document files
 * @param {Object} file - Multer file object
 * @returns {Object} Document metadata
 */
const validateDocument = async (file) => {
	const metadata = {};

	try {
		if (file.secure_url) {
			metadata.fileUrl = file.secure_url;
		}

		if (file.public_id) {
			metadata.publicId = file.public_id;
		}

		// For PDFs, Cloudinary can generate thumbnails
		if (file.mimetype === 'application/pdf' && file.public_id) {
			metadata.thumbnail = file.secure_url?.replace('/upload/', '/upload/w_200,h_200,c_fit,f_jpg/').replace(/\.[^.]+$/, '.jpg');
		}

	} catch (error) {
		console.error('Document validation error:', error);
		throw new Error('Invalid document file');
	}

	return metadata;
};

/**
 * Determine message type based on MIME type
 * @param {string} mimeType - File MIME type
 * @returns {string} Message type
 */
const getMessageType = (mimeType) => {
	if (mimeType.startsWith('image/')) return 'image';
	if (mimeType.startsWith('video/')) return 'video';
	if (mimeType.startsWith('audio/')) return 'audio';
	return 'file';
};

/**
 * Check if file is safe (basic security check)
 * @param {Object} file - Multer file object
 * @returns {boolean} Is file safe
 */
const isFileSafe = (file) => {
	// Check for dangerous file extensions
	const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.jar'];
	const fileName = file.originalname.toLowerCase();
	
	for (const ext of dangerousExtensions) {
		if (fileName.endsWith(ext)) {
			return false;
		}
	}

	// Check for suspicious MIME types
	const dangerousMimeTypes = [
		'application/x-executable',
		'application/x-msdownload',
		'application/x-msdos-program'
	];

	if (dangerousMimeTypes.includes(file.mimetype)) {
		return false;
	}

	return true;
};

module.exports = {
	validateFile,
	getMessageType,
	isFileSafe
};