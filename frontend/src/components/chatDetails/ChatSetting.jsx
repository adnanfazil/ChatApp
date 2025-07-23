import { useState } from "react";
import { CiCircleInfo } from "react-icons/ci";
import { IoCheckmarkCircleOutline, IoTrashOutline } from "react-icons/io5";
import { VscError } from "react-icons/vsc";
import { MdClearAll } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
	setChatDetailsBox,
	setLoading,
} from "../../redux/slices/conditionSlice";
import { addAllMessages } from "../../redux/slices/messageSlice";
import { deleteSelectedChat } from "../../redux/slices/myChatSlice";
import { socket } from "../../socket/socket";

const ChatSetting = () => {
	const dispatch = useDispatch();
	const authUserId = useSelector((store) => store?.auth?._id);
	const selectedChat = useSelector((store) => store?.myChat?.selectedChat);
	const [isConfirm, setConfirm] = useState("");
	
	const handleClearChat = () => {
		if (
			authUserId === selectedChat?.groupAdmin?._id ||
			!selectedChat?.isGroupChat
		) {
			setConfirm("clear-chat");
		} else {
			toast.warn("You're not admin");
		}
	};
	
	const handleDeleteGroup = () => {
		if (authUserId === selectedChat?.groupAdmin?._id) {
			setConfirm("delete-group");
		} else {
			toast.warn("You're not admin");
		}
	};
	
	const handleDeleteChat = () => {
		if (!selectedChat?.isGroupChat) {
			setConfirm("delete-chat");
		}
	};

	//  handle Clear Chat Call
	const handleClearChatCall = () => {
		dispatch(setLoading(true));
		const token = localStorage.getItem("token");
		fetch(
			`${import.meta.env.VITE_BACKEND_URL}/api/message/clearChat/${
				selectedChat?._id
			}`,
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
			}
		)
			.then((res) => res.json())
			.then((json) => {
				setConfirm("");
				dispatch(setLoading(false));
				if (json?.message === "success") {
					dispatch(addAllMessages([]));
					if (socket) {
						socket.emit("clear chat", selectedChat._id);
					}
					toast.success("Cleared all messages");
				} else {
					toast.error("Failed to clear chat");
				}
			})
			.catch((err) => {
				console.log(err);
				setConfirm("");
				dispatch(setLoading(false));
				toast.error("Failed to clear chat");
			});
	};
	// handle Delete Chat Call
	const handleDeleteChatCall = () => {
		dispatch(setLoading(true));
		const token = localStorage.getItem("token");
		fetch(
			`${import.meta.env.VITE_BACKEND_URL}/api/chat/deleteGroup/${
				selectedChat?._id
			}`,
			{
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
			}
		)
			.then((res) => res.json())
			.then((json) => {
				dispatch(setLoading(false));
				if (json?.message === "success") {
					let chat = selectedChat;
					dispatch(setChatDetailsBox(false));
					dispatch(addAllMessages([]));
					dispatch(deleteSelectedChat(chat._id));
					if (socket) {
						socket.emit("delete chat", chat, authUserId);
					}

					toast.success("Chat deleted successfully");
				} else {
					toast.error("Failed to delete chat");
				}
			})
			.catch((err) => {
				console.log(err);
				dispatch(setLoading(false));
				toast.error("Failed to delete chat");
			});
	};

	return (
		<div className="flex flex-col p-4 gap-4 text-text-primary relative h-full z-10 overflow-auto scroll-style bg-background">
			<h1 className="text-xl font-semibold text-center mb-4">
				Chat Settings
			</h1>
			
			{/* Clear Chat Option */}
			<div
				onClick={handleClearChat}
				className="flex items-center justify-between p-4 bg-background-light border border-border rounded-lg cursor-pointer hover:bg-background-hover transition-all duration-200 whatsapp-hover"
			>
				<div className="flex items-center gap-3">
					<MdClearAll className="w-5 h-5 text-icon-secondary" />
					<span className="font-medium">Clear Chat</span>
				</div>
				<CiCircleInfo
					className="w-5 h-5 text-icon-secondary cursor-pointer"
					title={
						selectedChat?.isGroupChat
							? "Admin access only"
							: "Clear Chat"
					}
				/>
			</div>

			{/* Delete Chat/Group Option */}
			{selectedChat?.isGroupChat ? (
				<div
					onClick={handleDeleteGroup}
					className="flex items-center justify-between p-4 bg-background-light border border-border rounded-lg cursor-pointer hover:bg-red-50 transition-all duration-200 whatsapp-hover"
				>
					<div className="flex items-center gap-3">
						<IoTrashOutline className="w-5 h-5 text-red-500" />
						<span className="font-medium text-red-500">Delete Group</span>
					</div>
					<CiCircleInfo
						className="w-5 h-5 text-icon-secondary cursor-pointer"
						title="Admin access only"
					/>
				</div>
			) : (
				<div
					onClick={handleDeleteChat}
					className="flex items-center justify-between p-4 bg-background-light border border-border rounded-lg cursor-pointer hover:bg-red-50 transition-all duration-200 whatsapp-hover"
				>
					<div className="flex items-center gap-3">
						<IoTrashOutline className="w-5 h-5 text-red-500" />
						<span className="font-medium text-red-500">Delete Chat</span>
					</div>
					<CiCircleInfo
						className="w-5 h-5 text-icon-secondary cursor-pointer"
						title="Delete Chat"
					/>
				</div>
			)}

			{/* Confirmation Modal */}
			{isConfirm && (
				<div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 modal-overlay">
					<div className="w-full max-w-md mx-4 mb-4 bg-background-light border border-border rounded-lg p-4 animate-slide-up">
						<h2 className="text-lg font-semibold mb-4 text-center">
							{isConfirm === "clear-chat"
								? "Clear chat history?"
								: isConfirm === "delete-group"
								? "Delete group permanently?"
								: "Delete chat permanently?"}
						</h2>
						<p className="text-text-secondary text-sm text-center mb-6">
							{isConfirm === "clear-chat"
								? "This will remove all messages from this chat. This action cannot be undone."
								: "This action cannot be undone."}
						</p>
						<div className="flex gap-3 justify-end">
							<button
								onClick={() => setConfirm("")}
								className="px-4 py-2 bg-background-secondary text-text-primary rounded-lg hover:bg-background-hover transition-colors duration-200 whatsapp-button-secondary"
							>
								Cancel
							</button>
							<button
								onClick={
									isConfirm === "clear-chat"
										? handleClearChatCall
										: handleDeleteChatCall
								}
								className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
									isConfirm === "clear-chat"
										? "bg-primary-500 hover:bg-primary-600 text-white whatsapp-button-primary"
										: "bg-red-500 hover:bg-red-600 text-white"
								}`}
							>
								{isConfirm === "clear-chat" ? "Clear" : "Delete"}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default ChatSetting;
