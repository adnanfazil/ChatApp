/**
 * File upload utilities for the chat application
 */

// File type configurations
export const FILE_TYPES = {
	IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
	VIDEO: ['video/mp4', 'video/webm'],
	AUDIO: ['audio/mpeg', 'audio/wav', 'audio/mp3'],
	DOCUMENT: ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
};

// Maximum file size (10MB)
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Get message type based on file MIME type
 * @param {string} mimeType - File MIME type
 * @returns {string} Message type
 */
export const getMessageType = (mimeType) => {
	if (FILE_TYPES.IMAGE.includes(mimeType)) return 'image';
	if (FILE_TYPES.VIDEO.includes(mimeType)) return 'video';
	if (FILE_TYPES.AUDIO.includes(mimeType)) return 'audio';
	return 'file';
};

/**
 * Validate file before upload
 * @param {File} file - File to validate
 * @returns {Object} Validation result
 */
export const validateFile = (file) => {
	const errors = [];
	
	// Check file size
	if (file.size > MAX_FILE_SIZE) {
		errors.push(`File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
	}
	
	// Check file type
	const allAllowedTypes = [
		...FILE_TYPES.IMAGE,
		...FILE_TYPES.VIDEO,
		...FILE_TYPES.AUDIO,
		...FILE_TYPES.DOCUMENT
	];
	
	if (!allAllowedTypes.includes(file.type)) {
		errors.push('File type not supported');
	}
	
	return {
		isValid: errors.length === 0,
		errors,
		messageType: getMessageType(file.type)
	};
};

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
	if (bytes === 0) return '0 Bytes';
	
	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Get file icon based on file type
 * @param {string} mimeType - File MIME type
 * @returns {string} Icon name for react-icons
 */
export const getFileIcon = (mimeType) => {
	if (FILE_TYPES.IMAGE.includes(mimeType)) return 'FaImage';
	if (FILE_TYPES.VIDEO.includes(mimeType)) return 'FaVideo';
	if (FILE_TYPES.AUDIO.includes(mimeType)) return 'FaMusic';
	if (mimeType === 'application/pdf') return 'FaFilePdf';
	return 'FaFile';
};

/**
 * Upload file to server
 * @param {File} file - File to upload
 * @param {string} chatId - Chat ID
 * @param {Function} onProgress - Progress callback
 * @returns {Promise} Upload promise
 */
export const uploadFile = async (file, chatId, onProgress = null) => {
	const formData = new FormData();
	formData.append('file', file);
	formData.append('chatId', chatId);
	
	const token = localStorage.getItem('token');
	
	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		
		// Track upload progress
		if (onProgress) {
			xhr.upload.addEventListener('progress', (event) => {
				if (event.lengthComputable) {
					const percentComplete = (event.loaded / event.total) * 100;
					onProgress(percentComplete);
				}
			});
		}
		
		xhr.addEventListener('load', () => {
			if (xhr.status === 201) {
				const response = JSON.parse(xhr.responseText);
				resolve(response);
			} else {
				const error = JSON.parse(xhr.responseText);
				reject(new Error(error.message || 'Upload failed'));
			}
		});
		
		xhr.addEventListener('error', () => {
			reject(new Error('Network error during upload'));
		});
		
		xhr.open('POST', `${import.meta.env.VITE_BACKEND_URL}/api/upload`);
		xhr.setRequestHeader('Authorization', `Bearer ${token}`);
		xhr.send(formData);
	});
};

/**
 * Create a preview URL for file
 * @param {File} file - File to preview
 * @returns {string} Preview URL
 */
export const createFilePreview = (file) => {
	if (FILE_TYPES.IMAGE.includes(file.type)) {
		return URL.createObjectURL(file);
	}
	return null;
};

/**
 * Check if file type supports preview
 * @param {string} mimeType - File MIME type
 * @returns {boolean} Whether file supports preview
 */
export const supportsPreview = (mimeType) => {
	return FILE_TYPES.IMAGE.includes(mimeType) || FILE_TYPES.VIDEO.includes(mimeType);
};

/**
 * Get file extension from filename
 * @param {string} filename - File name
 * @returns {string} File extension
 */
export const getFileExtension = (filename) => {
	return filename.split('.').pop().toLowerCase();
};

/**
 * Truncate filename for display
 * @param {string} filename - File name
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated filename
 */
export const truncateFilename = (filename, maxLength = 30) => {
	if (filename.length <= maxLength) return filename;
	
	const extension = getFileExtension(filename);
	const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));
	const truncatedName = nameWithoutExt.substring(0, maxLength - extension.length - 4) + '...';
	
	return `${truncatedName}.${extension}`;
};