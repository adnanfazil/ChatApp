import PropTypes from 'prop-types';
import { MdOutlineClose } from 'react-icons/md';
import { FaImage, FaVideo, FaMusic, FaFile } from 'react-icons/fa';
import { formatFileSize, truncateFilename } from '../../utils/fileUpload';

const FileUploadProgress = ({ 
	file, 
	progress, 
	isUploading, 
	error, 
	onCancel,
	messageType 
}) => {
	const getFileIcon = () => {
		switch (messageType) {
			case 'image':
				return <FaImage className="text-primary-500" size={20} />;
			case 'video':
				return <FaVideo className="text-purple-500" size={20} />;
			case 'audio':
				return <FaMusic className="text-primary-500" size={20} />;
			default:
				return <FaFile className="text-text-secondary" size={20} />;
		}
	};

	const getStatusColor = () => {
		if (error) return 'bg-red-500';
		if (progress === 100) return 'bg-primary-500';
		return 'bg-blue-500';
	};

	const getStatusText = () => {
		if (error) return 'Upload failed';
		if (progress === 100) return 'Upload complete';
		if (isUploading) return `Uploading... ${Math.round(progress)}%`;
		return 'Preparing upload...';
	};

	return (
		<div className="border-border border rounded-lg absolute bottom-[7vh] mb-1 left-2 bg-background-light w-80 p-3 shadow-whatsapp animate-slide-up">
			<div className="flex items-start space-x-3">
				{/* File Icon */}
				<div className="flex-shrink-0 mt-1">
					{getFileIcon()}
				</div>

				{/* File Info */}
				<div className="flex-1 min-w-0">
					<div className="text-text-primary text-sm font-medium truncate">
						{truncateFilename(file.name, 30)}
					</div>
					<div className="text-text-secondary text-xs">
						{formatFileSize(file.size)}
					</div>

					{/* Progress Bar */}
					<div className="mt-2">
						<div className="flex justify-between items-center mb-1">
							<span className="text-xs text-text-secondary">
								{getStatusText()}
							</span>
						</div>
						<div className="w-full bg-background-secondary rounded-full h-2">
							<div
								className={`h-2 rounded-full transition-all duration-300 ${getStatusColor()}`}
								style={{ width: `${progress}%` }}
							></div>
						</div>
					</div>

					{/* Error Message */}
					{error && (
						<div className="mt-2 text-red-500 text-xs">
							{error}
						</div>
					)}
				</div>

				{/* Cancel Button */}
				<button
					onClick={onCancel}
					className="flex-shrink-0 text-text-secondary hover:text-text-primary transition-colors p-1 rounded-full hover:bg-background-secondary"
					title="Cancel upload"
				>
					<MdOutlineClose size={20} />
				</button>
			</div>
		</div>
	);
};

FileUploadProgress.propTypes = {
	file: PropTypes.object.isRequired,
	progress: PropTypes.number.isRequired,
	isUploading: PropTypes.bool.isRequired,
	error: PropTypes.string,
	onCancel: PropTypes.func.isRequired,
	messageType: PropTypes.string.isRequired
};

export default FileUploadProgress;