const Message = require('../models/message');
const { deleteFile, getFileInfo } = require('../controllers/fileUpload');
const cloudinary = require('../config/cloudinary');

/**
 * Clean up orphaned files from Cloudinary
 * Files that exist in Cloudinary but not referenced in any message
 */
const cleanupOrphanedFiles = async () => {
	try {
		console.log('Starting orphaned files cleanup...');
		
		// Get all files from Cloudinary chat-app folder
		const cloudinaryFiles = await getAllCloudinaryFiles();
		
		// Get all file public IDs from database
		const dbFiles = await Message.find({
			'content.publicId': { $exists: true, $ne: null },
			isDeleted: false
		}).select('content.publicId');
		
		const dbPublicIds = new Set(dbFiles.map(msg => msg.content.publicId));
		
		// Find orphaned files
		const orphanedFiles = cloudinaryFiles.filter(file => !dbPublicIds.has(file.public_id));
		
		console.log(`Found ${orphanedFiles.length} orphaned files`);
		
		// Delete orphaned files
		let deletedCount = 0;
		for (const file of orphanedFiles) {
			try {
				const success = await deleteFile(file.public_id);
				if (success) {
					deletedCount++;
					console.log(`Deleted orphaned file: ${file.public_id}`);
				}
			} catch (error) {
				console.error(`Failed to delete file ${file.public_id}:`, error);
			}
		}
		
		console.log(`Cleanup completed. Deleted ${deletedCount} orphaned files.`);
		return { total: orphanedFiles.length, deleted: deletedCount };
		
	} catch (error) {
		console.error('Error during orphaned files cleanup:', error);
		throw error;
	}
};

/**
 * Clean up deleted messages' files
 * Remove files from Cloudinary for messages marked as deleted
 */
const cleanupDeletedMessageFiles = async () => {
	try {
		console.log('Starting deleted message files cleanup...');
		
		// Find deleted messages with files
		const deletedMessages = await Message.find({
			isDeleted: true,
			'content.publicId': { $exists: true, $ne: null }
		});
		
		console.log(`Found ${deletedMessages.length} deleted messages with files`);
		
		let deletedCount = 0;
		for (const message of deletedMessages) {
			try {
				const success = await deleteFile(message.content.publicId);
				if (success) {
					// Remove publicId from message to avoid future cleanup attempts
					await Message.findByIdAndUpdate(message._id, {
						$unset: { 'content.publicId': 1 }
					});
					deletedCount++;
					console.log(`Deleted file for deleted message: ${message.content.publicId}`);
				}
			} catch (error) {
				console.error(`Failed to delete file ${message.content.publicId}:`, error);
			}
		}
		
		console.log(`Deleted message files cleanup completed. Deleted ${deletedCount} files.`);
		return { total: deletedMessages.length, deleted: deletedCount };
		
	} catch (error) {
		console.error('Error during deleted message files cleanup:', error);
		throw error;
	}
};

/**
 * Get all files from Cloudinary chat-app folder
 * @returns {Array} Array of file objects
 */
const getAllCloudinaryFiles = async () => {
	try {
		const allFiles = [];
		let nextCursor = null;
		
		do {
			const result = await cloudinary.api.resources({
				type: 'upload',
				prefix: 'chat-app/',
				max_results: 500,
				next_cursor: nextCursor
			});
			
			allFiles.push(...result.resources);
			nextCursor = result.next_cursor;
		} while (nextCursor);
		
		return allFiles;
	} catch (error) {
		console.error('Error fetching Cloudinary files:', error);
		return [];
	}
};

/**
 * Schedule periodic cleanup
 * Run cleanup tasks at specified intervals
 */
const scheduleCleanup = () => {
	// Run orphaned files cleanup daily at 2 AM
	const dailyCleanup = setInterval(async () => {
		try {
			await cleanupOrphanedFiles();
			await cleanupDeletedMessageFiles();
		} catch (error) {
			console.error('Scheduled cleanup failed:', error);
		}
	}, 24 * 60 * 60 * 1000); // 24 hours
	
	console.log('File cleanup scheduler started');
	
	return {
		dailyCleanup,
		stop: () => {
			clearInterval(dailyCleanup);
			console.log('File cleanup scheduler stopped');
		}
	};
};

module.exports = {
	scheduleCleanup
};