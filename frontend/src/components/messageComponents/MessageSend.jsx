import { useEffect, useRef, useState, useCallback } from "react";
import PropTypes from "prop-types";
import { FaFolderOpen, FaPaperPlane } from "react-icons/fa";
import { BsEmojiSmile } from "react-icons/bs"; // Add emoji icon
import { useDispatch, useSelector } from "react-redux";
import { setSendLoading, setTyping } from "../../redux/slices/conditionSlice";
import {
	addNewMessage,
	addNewMessageId,
} from "../../redux/slices/messageSlice";
import { LuLoader } from "react-icons/lu";
import { toast } from "react-toastify";
import { socket } from "../../socket/socket";
import { useDropzone } from "react-dropzone";
import {
	validateFile,
	uploadFile
} from "../../utils/fileUpload";
import FileUploadProgress from "./FileUploadProgress";

// Common emojis for the picker
const COMMON_EMOJIS = [
	"😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇",
	"🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚",
	"😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩",
	"🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣",
	"😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬",
	"🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗",
	"🤔", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🙄", "😯",
	"😦", "😧", "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "🤐",
	"🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕", "🤑", "🤠", "😈",
	"👍", "👎", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙",
	"👈", "👉", "👆", "🖕", "👇", "☝️", "👋", "🤚", "🖐️", "✋",
	"🖖", "👏", "🙌", "🤝", "🙏", "✍️", "💪", "🦾", "🦿", "🦵",
	"❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔",
	"❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "☮️",
	"✨", "🌟", "💫", "⭐", "🌠", "☀️", "🌤️", "⛅", "🌦️", "🌧️",
	"⛈️", "🌩️", "🌨️", "❄️", "☃️", "⛄", "🌬️", "💨", "🌪️", "🌈",
	"🔥", "💯", "💢", "💥", "💫", "💦", "💨", "🕳️", "💣", "💬",
	"👁️‍🗨️", "🗨️", "🗯️", "💭", "💤", "👋", "🤚", "🖐️", "✋", "🖖"
];

let lastTypingTime;
const MessageSend = ({ chatId }) => {
	const mediaFile = useRef();
	const emojiPickerRef = useRef();
	const [newMessage, setMessage] = useState("");
	const [showEmojiPicker, setShowEmojiPicker] = useState(false);
	const [uploadingFile, setUploadingFile] = useState(null);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [uploadError, setUploadError] = useState(null);
	const [isUploading, setIsUploading] = useState(false);
	const [dragActive, setDragActive] = useState(false);

	const dispatch = useDispatch();
	const isSendLoading = useSelector(
		(store) => store?.condition?.isSendLoading
	);
	const isSocketConnected = useSelector(
		(store) => store?.condition?.isSocketConnected
	);
	const selectedChat = useSelector((store) => store?.myChat?.selectedChat);
	const isTyping = useSelector((store) => store?.condition?.isTyping);

	// Close emoji picker when clicking outside
	useEffect(() => {
		const handleClickOutside = (event) => {
			if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
				setShowEmojiPicker(false);
			}
		};

		if (showEmojiPicker) {
			document.addEventListener('mousedown', handleClickOutside);
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [showEmojiPicker]);

	useEffect(() => {
		if (!socket) return;

		socket.on("typing", (data) => {
			if (data.userId !== localStorage.getItem("userId")) {
				dispatch(setTyping(true));
			}
		});
		socket.on("stop typing", (data) => {
			if (data.userId !== localStorage.getItem("userId")) {
				dispatch(setTyping(false));
			}
		});

		return () => {
			if (socket) {
				socket.off("typing");
				socket.off("stop typing");
			}
		};
	}, [dispatch]);

	// Handle file drop
	const onDrop = useCallback((acceptedFiles) => {
		if (acceptedFiles.length > 0) {
			handleFileSelect(acceptedFiles[0]);
		}
	}, []);

	// Configure dropzone
	const { getRootProps, getInputProps } = useDropzone({
		onDrop,
		accept: {
			'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
			'video/*': ['.mp4', '.webm'],
			'audio/*': ['.mp3', '.wav', '.mpeg'],
			'application/pdf': ['.pdf'],
			'text/plain': ['.txt']
		},
		maxFiles: 1,
		multiple: false,
		noClick: true,
		onDragEnter: () => setDragActive(true),
		onDragLeave: () => setDragActive(false),
		onDropAccepted: () => setDragActive(false),
		onDropRejected: () => setDragActive(false)
	});

	// Handle file selection
	const handleFileSelect = async (file) => {
		const validation = validateFile(file);
		
		if (!validation.isValid) {
			toast.error(validation.errors.join(', '));
			return;
		}

		setUploadingFile(file);
		setUploadProgress(0);
		setUploadError(null);
		setIsUploading(true);

		try {
			const response = await uploadFile(file, chatId, (progress) => {
				setUploadProgress(progress);
			});

			if (response.success) {
				dispatch(addNewMessageId(response.data._id));
				dispatch(addNewMessage(response.data));
				if (socket) {
					socket.emit("new message", response.data);
				}
				toast.success("File uploaded successfully!");
			}
		} catch (error) {
			console.error("Upload error:", error);
			setUploadError(error.message);
			toast.error(`Upload failed: ${error.message}`);
		} finally {
			setIsUploading(false);
			setTimeout(() => {
				setUploadingFile(null);
				setUploadProgress(0);
				setUploadError(null);
			}, 2000);
		}
	};

	// Handle file input change
	const handleMediaBox = () => {
		if (mediaFile.current?.files[0]) {
			handleFileSelect(mediaFile.current.files[0]);
			mediaFile.current.value = ""; // Reset input
		}
	};

	// Cancel upload
	const handleCancelUpload = () => {
		setUploadingFile(null);
		setUploadProgress(0);
		setUploadError(null);
		setIsUploading(false);
	};

	// Send Message Api call
	const handleSendMessage = async () => {
		if (newMessage?.trim()) {
			const message = newMessage?.trim();
			setMessage("");
			if (socket) {
				socket.emit("stop typing", selectedChat._id);
			}
			dispatch(setSendLoading(true));
			const token = localStorage.getItem("token");
			fetch(`${import.meta.env.VITE_BACKEND_URL}/api/message`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					message: message,
					chatId: chatId,
					messageType: "text"
				}),
			})
				.then((res) => res.json())
				.then((json) => {
					if (json.success) {
						dispatch(addNewMessageId(json?.data?._id));
						dispatch(addNewMessage(json?.data));
						if (socket) {
							socket.emit("new message", json.data);
						}
					} else {
						toast.error(json.message || "Message sending failed");
					}
					dispatch(setSendLoading(false));
				})
				.catch((err) => {
					console.log(err);
					dispatch(setSendLoading(false));
					toast.error("Message Sending Failed");
				});
		}
	};

	const handleTyping = (e) => {
		setMessage(e.target?.value);
		if (!isSocketConnected || !socket) return;
		if (!isTyping) {
			socket.emit("typing", selectedChat._id);
		}
		lastTypingTime = new Date().getTime();
		let timerLength = 3000;
		let stopTyping = setTimeout(() => {
			let timeNow = new Date().getTime();
			let timeDiff = timeNow - lastTypingTime;
			if (timeDiff > timerLength && socket) {
				socket.emit("stop typing", selectedChat._id);
			}
		}, timerLength);
		return () => clearTimeout(stopTyping);
	};

	// Handle Enter key press
	const handleKeyPress = (e) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSendMessage();
		}
	};

	// Handle emoji selection
	const handleEmojiSelect = (emoji) => {
		setMessage(prev => prev + emoji);
		setShowEmojiPicker(false);
	};

	// Toggle emoji picker
	const toggleEmojiPicker = () => {
		setShowEmojiPicker(prev => !prev);
	};

	return (
		<div className="relative">
			{/* File Upload Progress */}
			{uploadingFile && (
				<FileUploadProgress
					file={uploadingFile}
					progress={uploadProgress}
					isUploading={isUploading}
					error={uploadError}
					onCancel={handleCancelUpload}
					messageType={validateFile(uploadingFile).messageType}
				/>
			)}

			{/* Emoji Picker */}
			{showEmojiPicker && (
				<div 
					ref={emojiPickerRef}
					className="absolute bottom-full left-0 mb-2 bg-surface-elevated border border-border rounded-lg shadow-lg p-4 w-80 max-h-60 overflow-y-auto z-20 animate-fade-in"
				>
					<div className="grid grid-cols-8 gap-2">
						{COMMON_EMOJIS.map((emoji, index) => (
							<button
								key={index}
								className="text-2xl p-2 rounded hover:bg-background-hover transition-colors duration-200 active:scale-95"
								onClick={() => handleEmojiSelect(emoji)}
								title={emoji}
							>
								{emoji}
							</button>
						))}
					</div>
				</div>
			)}

			{/* Drag and Drop Overlay */}
			{dragActive && (
				<div className="absolute inset-0 bg-whatsapp-primary bg-opacity-20 border-2 border-dashed border-whatsapp-primary rounded-lg flex items-center justify-center z-10 animate-fade-in">
					<div className="text-center text-whatsapp-primary">
						<FaFolderOpen size={48} className="mx-auto mb-2" />
						<p className="text-lg font-semibold">Drop file here to upload</p>
						<p className="text-sm">Images, videos, audio, and documents supported</p>
					</div>
				</div>
			)}

			{/* Message Input Form */}
			<div {...getRootProps()}>
				<form
					className="w-full flex items-center gap-3 h-[7vh] p-3 bg-surface-elevated border-t border-border"
					onSubmit={(e) => e.preventDefault()}
				>
					<label htmlFor="media" className="cursor-pointer">
						<FaFolderOpen
							title="Upload File"
							size={22}
							className="text-icon hover:text-whatsapp-primary transition-colors duration-200 active:scale-95"
						/>
					</label>
					<input
						{...getInputProps()}
						ref={mediaFile}
						type="file"
						name="file"
						accept="image/*,video/*,audio/*,.pdf,.txt"
						id="media"
						className="hidden"
						onChange={handleMediaBox}
					/>
					
					{/* Emoji Picker Button */}
					<button
						type="button"
						onClick={toggleEmojiPicker}
						className="cursor-pointer"
						title="Add Emoji"
					>
						<BsEmojiSmile
							size={22}
							className={`transition-colors duration-200 active:scale-95 ${
								showEmojiPicker 
									? 'text-whatsapp-primary' 
									: 'text-icon hover:text-whatsapp-primary'
							}`}
						/>
					</button>

					<input
						type="text"
						className="outline-none p-3 w-full bg-surface rounded-full text-text-primary placeholder-text-secondary border border-border focus:border-whatsapp-primary transition-colors duration-200"
						placeholder="Type a message or drag and drop a file..."
						value={newMessage}
						onChange={(e) => handleTyping(e)}
						onKeyPress={handleKeyPress}
						disabled={isUploading}
					/>
					<div className="flex justify-center items-center">
						{newMessage?.trim() && !isSendLoading && !isUploading && (
							<button
								className="whatsapp-button-primary p-3 rounded-full"
								onClick={handleSendMessage}
							>
								<FaPaperPlane
									title="Send"
									size={18}
									className="text-white"
								/>
							</button>
						)}
						{(isSendLoading || isUploading) && (
							<button className="p-3 rounded-full bg-surface border border-border">
								<LuLoader
									title="loading..."
									fontSize={18}
									className="animate-spin text-text-secondary"
								/>
							</button>
						)}
					</div>
				</form>
			</div>
		</div>
	);
};

MessageSend.propTypes = {
	chatId: PropTypes.string.isRequired
};

export default MessageSend;
