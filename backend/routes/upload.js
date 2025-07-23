const express = require('express');
const router = express.Router();
const { authorization } = require('../middlewares/authorization');
const { upload, handleMulterError } = require('../middlewares/fileUpload');
const { uploadFile } = require('../controllers/fileUpload');
const wrapAsync = require('../middlewares/wrapAsync');

/**
 * POST /api/upload
 * Upload a file and create a message
 * Body: { chatId: string }
 * File: multipart/form-data with field name 'file'
 */
router.post('/', 
	authorization,
	upload.single('file'),
	handleMulterError,
	wrapAsync(uploadFile)
);

/**
 * GET /api/upload/health
 * Health check endpoint for upload service
 */
router.get('/health', (req, res) => {
	res.json({
		message: 'Upload service is running',
		timestamp: new Date().toISOString(),
		maxFileSize: process.env.MAX_FILE_SIZE || '10MB',
		allowedTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || []
	});
});

module.exports = router;