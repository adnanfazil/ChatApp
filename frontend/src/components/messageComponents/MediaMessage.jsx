import { useState } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import {
	FaImage,
	FaMusic,
	FaFile,
	FaFilePdf,
	FaDownload,
	FaTimes,
	FaExpand,
	FaPlay,
	FaEye
} from 'react-icons/fa';
import { formatFileSize, truncateFilename } from '../../utils/fileUpload';

const MediaMessage = ({ message, isOwn }) => {
	const [imageLoaded, setImageLoaded] = useState(false);
	const [imageError, setImageError] = useState(false);
	const [showFullScreen, setShowFullScreen] = useState(false);
	const [downloading, setDownloading] = useState(false);
	const [downloadedBlob, setDownloadedBlob] = useState(null);
	const [downloadedUrl, setDownloadedUrl] = useState(null);
	const [showPreview, setShowPreview] = useState(false);

	const { content, messageType } = message;
	const { fileUrl, fileName, originalName, fileSize, mimeType, thumbnail } = content || {};

	// Add debugging
	console.log('MediaMessage Debug:', {
		messageType,
		fileUrl,
		originalName,
		mimeType,
		downloadedUrl: !!downloadedUrl
	});

	// Enhanced download function with CORS handling
	const handleDownloadWithPreview = async () => {
		if (!fileUrl) {
			console.error('No fileUrl available for download');
			return;
		}

		console.log('Starting download for:', fileUrl);
		setDownloading(true);
		try {
			// Try fetch with no-cors mode for Cloudinary URLs
			let response;
			try {
				response = await fetch(fileUrl, {
					mode: 'cors',
					credentials: 'omit'
				});
			} catch (corsError) {
				console.log('CORS failed, trying alternative method:', corsError);
				// Fallback: direct download without blob
				const link = document.createElement('a');
				link.href = fileUrl;
				link.download = originalName || fileName || 'download';
				link.target = '_blank';
				link.rel = 'noopener noreferrer';
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
				
				// For preview, use original URL
				setDownloadedUrl(fileUrl);
				setShowPreview(true);
				return;
			}
			
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			
			const blob = await response.blob();
			console.log('Blob created successfully:', blob.size, 'bytes');
			
			// Create object URL for preview
			const objectUrl = URL.createObjectURL(blob);
			
			// Store for preview
			setDownloadedBlob(blob);
			setDownloadedUrl(objectUrl);
			
			// Trigger download
			const link = document.createElement('a');
			link.href = objectUrl;
			link.download = originalName || fileName || 'download';
			document.body.appendChild(link);
			
			// Use dispatchEvent for better browser compatibility
			link.dispatchEvent(
				new MouseEvent('click', { 
					bubbles: true, 
					cancelable: true, 
					view: window 
				})
			);
			
			document.body.removeChild(link);
			console.log('Download triggered successfully');
			
			// Show preview option
			setShowPreview(true);
			
			// Auto-cleanup after 5 minutes to prevent memory leaks
			setTimeout(() => {
				if (objectUrl) {
					URL.revokeObjectURL(objectUrl);
					setDownloadedUrl(null);
					setDownloadedBlob(null);
					setShowPreview(false);
				}
			}, 300000); // 5 minutes
			
		} catch (error) {
			console.error('Download failed:', error);
			alert(`Download failed: ${error.message}. Please try again.`);
		} finally {
			setDownloading(false);
		}
	};

	// Handle preview of downloaded content
	const handlePreview = () => {
		if (!downloadedUrl) return;
		
		console.log('Opening preview for:', downloadedUrl);
		if (messageType === 'image') {
			setShowFullScreen(true);
		} else {
			// For other file types, open in new tab
			window.open(downloadedUrl, '_blank');
		}
	};

	// Handle image preview with debugging
	const handleImagePreview = (e) => {
		console.log('Image clicked for preview');
		e?.stopPropagation();
		setShowFullScreen(true);
	};

	const closeFullScreen = () => {
		console.log('Closing full screen');
		setShowFullScreen(false);
	};

	const handleKeyDown = (e) => {
		if (e.key === 'Escape') {
			closeFullScreen();
		}
	};

	// Fixed Download icon overlay component with proper event handling
	const DownloadOverlay = ({ className = "" }) => (
		<div className={`absolute top-2 right-2 z-20 ${className}`}>
			<button
				onClick={(e) => {
					console.log('Download button clicked');
					e.stopPropagation();
					e.preventDefault();
					handleDownloadWithPreview();
				}}
				className="bg-black bg-opacity-70 hover:bg-opacity-90 text-white p-2 rounded-full transition-all duration-200 shadow-lg backdrop-blur-sm"
				title="Download and preview"
				disabled={downloading}
			>
				{downloading ? (
					<div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
				) : (
					<FaDownload size={14} />
				)}
			</button>
			
		</div>
	);

	// Enhanced full screen modal with better debugging
	const FullScreenImageModal = () => {
		if (!showFullScreen) return null;

		// Use downloaded URL if available, otherwise use original
		const displayUrl = downloadedUrl || fileUrl;
		console.log('Modal displaying URL:', displayUrl);

		const modalContent = (
			<div 
				className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4"
				style={{ zIndex: 9999 }}
				onClick={(e) => {
					console.log('Modal background clicked');
					closeFullScreen();
				}}
				onKeyDown={handleKeyDown}
				tabIndex={0}
			>
				{/* Close button */}
				<button
					className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors duration-200 z-10"
					onClick={(e) => {
						e.stopPropagation();
						closeFullScreen();
					}}
					title="Close (Esc)"
				>
					<FaTimes size={24} />
				</button>

				{/* Download button */}
				<button
					className="absolute top-4 left-4 text-white hover:text-gray-300 transition-colors duration-200 z-10 flex items-center gap-2 bg-black bg-opacity-50 px-3 py-2 rounded-lg"
					onClick={(e) => {
						e.stopPropagation();
						handleDownloadWithPreview();
					}}
					title="Download image"
					disabled={downloading}
				>
					{downloading ? (
						<div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
					) : (
						<FaDownload size={16} />
					)}
					<span className="text-sm">Download</span>
				</button>

				{/* Image */}
				<img
					src={displayUrl}
					alt={originalName || 'Full size image'}
					className="max-w-full max-h-full object-contain"
					onClick={(e) => {
						console.log('Modal image clicked');
						e.stopPropagation();
					}}
					onLoad={() => console.log('Modal image loaded')}
					onError={(e) => console.error('Modal image failed to load:', e)}
				/>

				{/* Image info */}
				<div className="absolute bottom-4 left-4 right-4 text-white text-center bg-black bg-opacity-50 p-3 rounded-lg">
					<div className="text-sm font-medium">
						{originalName || fileName || 'Image'}
						{downloadedBlob && <span className="ml-2 text-green-400">(Downloaded)</span>}
					</div>
					{fileSize && (
						<div className="text-xs opacity-75 mt-1">
							{formatFileSize(fileSize)}
						</div>
					)}
				</div>
			</div>
		);

		return createPortal(modalContent, document.body);
	};

	// Fixed image message with proper event handling
	const renderImageMessage = () => {
		if (!fileUrl) {
			return (
				<div className="max-w-sm p-4 bg-red-50 border border-red-200 rounded-lg">
					<p className="text-red-600 text-sm">❌ Image URL not found</p>
					<p className="text-xs text-text-secondary mt-1">Content: {JSON.stringify(content)}</p>
				</div>
			);
		}

		return (
			<>
				<div className="max-w-sm">
					<div className="relative group">
						{!imageLoaded && !imageError && (
							<div className="flex items-center justify-center h-48 bg-surface rounded-lg animate-pulse">
								<FaImage className="text-text-secondary" size={24} />
								<span className="ml-2 text-sm text-text-secondary">Loading...</span>
							</div>
						)}
						{imageError && (
							<div className="flex flex-col items-center justify-center h-48 bg-red-50 border border-red-200 rounded-lg">
								<FaImage className="text-red-500" size={24} />
								<span className="mt-2 text-sm text-red-600">Failed to load image</span>
								<span className="text-xs text-text-secondary">URL: {fileUrl}</span>
							</div>
						)}
						
						{/* Main image with click handler */}
						<div 
							className="relative cursor-pointer"
							onClick={(e) => {
								// Only handle click if it's not on the download overlay
								if (!e.target.closest('.download-overlay')) {
									console.log('Image container clicked');
									handleImagePreview(e);
								}
							}}
						>
							<img
								src={thumbnail || fileUrl}
								alt={originalName || 'Image'}
								className={`rounded-lg max-w-full h-auto transition-all duration-200 hover:opacity-90 ${
									imageLoaded && !imageError ? 'opacity-100' : 'opacity-0 absolute'
								}`}
								style={{ maxHeight: '300px' }}
								onLoad={() => {
									console.log('Image loaded successfully');
									setImageLoaded(true);
								}}
								onError={(e) => {
									console.error('Image failed to load:', fileUrl, e);
									setImageError(true);
								}}
							/>
							
							{/* Download overlay with proper class for event delegation */}
							{imageLoaded && !imageError && (
								<div className="download-overlay">
									<DownloadOverlay className="opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
								</div>
							)}
							
							{/* Expand icon overlay - positioned to not interfere */}
							{imageLoaded && !imageError && (
								<div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
									<div className="bg-black bg-opacity-50 p-2 rounded-full">
										<FaExpand className="text-white" size={16} />
									</div>
								</div>
							)}
						</div>
					</div>
					<div className="mt-2 text-xs text-text-secondary">
						<span>{truncateFilename(originalName || fileName || 'Unknown', 25)}</span>
						{fileSize && <span className="ml-2">({formatFileSize(fileSize)})</span>}
						{downloadedBlob && <span className="ml-2 text-green-600">✓ Downloaded</span>}
					</div>
				</div>
				<FullScreenImageModal />
			</>
		);
	};

	// Enhanced video message with download overlay
	const renderVideoMessage = () => (
		<div className="max-w-sm">
			<div className="relative group">
				<video
					controls
					className="rounded-lg max-w-full h-auto"
					style={{ maxHeight: '300px' }}
					poster={thumbnail}
				>
					<source src={downloadedUrl || fileUrl} type={mimeType} />
					Your browser does not support the video tag.
				</video>
				<DownloadOverlay className="opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
			</div>
			<div className="mt-2 text-xs text-text-secondary">
				<span>{truncateFilename(originalName, 25)}</span>
				{fileSize && <span className="ml-2">({formatFileSize(fileSize)})</span>}
				{downloadedBlob && <span className="ml-2 text-green-600">✓ Downloaded</span>}
			</div>
		</div>
	);

	const renderAudioMessage = () => (
		<div className="flex items-center space-x-3 p-3 bg-surface rounded-lg min-w-64 border border-border relative group">
			<div className="flex-shrink-0">
				<FaMusic className="text-whatsapp-primary" size={20} />
			</div>
			<div className="flex-1 min-w-0">
				<div className="text-sm font-medium truncate text-text-primary">
					{truncateFilename(originalName, 20)}
					{downloadedBlob && <span className="ml-2 text-green-600 text-xs">✓ Downloaded</span>}
				</div>
				{fileSize && (
					<div className="text-xs text-text-secondary">
						{formatFileSize(fileSize)}
					</div>
				)}
				<audio
					controls
					className="w-full mt-2"
				>
					<source src={downloadedUrl || fileUrl} type={mimeType} />
					Your browser does not support the audio tag.
				</audio>
			</div>
			<DownloadOverlay className="opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
		</div>
	);

	const renderFileMessage = () => {
		const getFileIcon = () => {
			if (mimeType === 'application/pdf') return <FaFilePdf className="text-red-500" size={24} />;
			return <FaFile className="text-text-secondary" size={24} />;
		};

		return (
			<div className="flex items-center space-x-3 p-3 bg-surface rounded-lg min-w-64 max-w-sm border border-border relative group">
				<div className="flex-shrink-0">
					{getFileIcon()}
				</div>
				<div className="flex-1 min-w-0">
					<div className="text-sm font-medium truncate text-text-primary">
						{truncateFilename(originalName, 25)}
					</div>
					{fileSize && (
						<div className="text-xs text-text-secondary">
							{formatFileSize(fileSize)}
							{downloadedBlob && <span className="ml-2 text-green-600">✓ Downloaded</span>}
						</div>
					)}
				</div>
				<button
					onClick={handleDownloadWithPreview}
					className="flex-shrink-0 p-2 hover:bg-surface-elevated rounded-full transition-colors duration-200 text-text-secondary hover:text-whatsapp-primary"
					title="Download and preview file"
					disabled={downloading}
				>
					{downloading ? (
						<div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
					) : (
						<FaDownload size={16} />
					)}
				</button>
				{showPreview && downloadedUrl && (
					<button
						onClick={handlePreview}
						className="flex-shrink-0 p-2 hover:bg-surface-elevated rounded-full transition-colors duration-200 text-blue-600 hover:text-blue-700 ml-1"
						title="Preview downloaded file"
					>
						<FaEye size={16} />
					</button>
				)}
			</div>
		);
	};

	const renderContent = () => {
		switch (messageType) {
			case 'image':
				return renderImageMessage();
			case 'video':
				return renderVideoMessage();
			case 'audio':
				return renderAudioMessage();
			case 'file':
			default:
				return renderFileMessage();
		}
	};

	return (
		<div className={`media-message ${isOwn ? 'own' : 'other'}`}>
			{renderContent()}
		</div>
	);
};

MediaMessage.propTypes = {
	message: PropTypes.object.isRequired,
	isOwn: PropTypes.bool.isRequired
};

export default MediaMessage;
