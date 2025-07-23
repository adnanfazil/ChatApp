import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import socket from '../socket/socket';

const OnlineStatus = ({ userId, showText = false, size = 'sm' }) => {
	const [isOnline, setIsOnline] = useState(false);
	const [lastSeen, setLastSeen] = useState(null);
	const currentUserId = useSelector((store) => store.auth?._id);

	// Size configurations
	const sizeClasses = {
		xs: 'w-2 h-2',
		sm: 'w-3 h-3',
		md: 'w-4 h-4',
		lg: 'w-5 h-5'
	};

	const textSizeClasses = {
		xs: 'text-xs',
		sm: 'text-sm',
		md: 'text-base',
		lg: 'text-lg'
	};

	useEffect(() => {
		// Don't show status for current user
		if (userId === currentUserId || !socket) return;

		// Request initial status
		socket.emit('get online status', [userId]);

		// Listen for status updates
		const handleStatusChange = (data) => {
			if (data.userId === userId) {
				setIsOnline(data.isOnline);
				setLastSeen(data.lastSeen ? new Date(data.lastSeen) : null);
			}
		};

		const handleStatusResponse = (statusMap) => {
			if (statusMap[userId]) {
				setIsOnline(statusMap[userId].isOnline);
				setLastSeen(statusMap[userId].lastSeen ? new Date(statusMap[userId].lastSeen) : null);
			}
		};

		// Listen for custom events from socket.js
		const handleUserStatusChange = (event) => {
			const data = event.detail;
			if (data.userId === userId) {
				setIsOnline(data.isOnline);
				setLastSeen(data.lastSeen ? new Date(data.lastSeen) : null);
			}
		};

		socket.on('user_status_change', handleStatusChange);
		socket.on('online status response', handleStatusResponse);
		window.addEventListener('userStatusChange', handleUserStatusChange);

		return () => {
			if (socket) {
				socket.off('user_status_change', handleStatusChange);
				socket.off('online status response', handleStatusResponse);
			}
			window.removeEventListener('userStatusChange', handleUserStatusChange);
		};
	}, [userId, currentUserId]);

	// Don't render for current user
	if (userId === currentUserId) return null;

	const formatLastSeen = (date) => {
		if (!date) return '';
		
		const now = new Date();
		const diffInMinutes = Math.floor((now - date) / (1000 * 60));
		
		if (diffInMinutes < 1) return 'Just now';
		if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
		
		const diffInHours = Math.floor(diffInMinutes / 60);
		if (diffInHours < 24) return `${diffInHours}h ago`;
		
		const diffInDays = Math.floor(diffInHours / 24);
		if (diffInDays < 7) return `${diffInDays}d ago`;
		
		return date.toLocaleDateString();
	};

	if (showText) {
		return (
			<div className={`flex items-center space-x-2 ${textSizeClasses[size]}`}>
				<div
					className={`${sizeClasses[size]} rounded-full border border-surface-elevated ${
						isOnline ? 'bg-whatsapp-primary shadow-sm' : 'bg-text-secondary'
					}`}
				/>
				<span className={`${
					isOnline ? 'text-whatsapp-primary font-medium' : 'text-text-secondary'
				}`}>
					{isOnline ? 'Online' : formatLastSeen(lastSeen)}
				</span>
			</div>
		);
	}

	return (
		<div
			className={`${sizeClasses[size]} rounded-full border-2 border-surface-elevated ${
				isOnline ? 'bg-whatsapp-primary shadow-sm' : 'bg-text-secondary'
			}`}
			title={isOnline ? 'Online' : formatLastSeen(lastSeen)}
		/>
	);
};

OnlineStatus.propTypes = {
	userId: PropTypes.string.isRequired,
	showText: PropTypes.bool,
	size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg'])
};

export default OnlineStatus;