import { useEffect, useRef, useState } from "react";
import { FaArrowLeft } from "react-icons/fa";
import PropTypes from "prop-types";
import {
	setChatDetailsBox,
	setMessageLoading,
} from "../../redux/slices/conditionSlice";
import { useDispatch, useSelector } from "react-redux";
import AllMessages from "./AllMessages";
import MessageSend from "./MessageSend";
import { addAllMessages } from "../../redux/slices/messageSlice";
import MessageLoading from "../loading/MessageLoading";
import { addSelectedChat } from "../../redux/slices/myChatSlice";
import getChatName, { getChatImage } from "../../utils/getChatName";
import ChatDetailsBox from "../chatDetails/ChatDetailsBox";
import { CiMenuKebab } from "react-icons/ci";
import { toast } from "react-toastify";
import { socket } from "../../socket/socket";
import OnlineStatus from "../OnlineStatus";

const MessageBox = ({ chatId }) => {
	const dispatch = useDispatch();
	const chatDetailsBox = useRef(null);
	const [isExiting, setIsExiting] = useState(false);
	const isChatDetailsBox = useSelector(
		(store) => store?.condition?.isChatDetailsBox
	);
	const isMessageLoading = useSelector(
		(store) => store?.condition?.isMessageLoading
	);
	const allMessage = useSelector((store) => store?.message?.message);
	const selectedChat = useSelector((store) => store?.myChat?.selectedChat);
	const authUserId = useSelector((store) => store?.auth?._id);

	useEffect(() => {
		const getMessage = (chatId) => {
			dispatch(setMessageLoading(true));
			const token = localStorage.getItem("token");
			fetch(`${import.meta.env.VITE_BACKEND_URL}/api/message/${chatId}`, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
			})
				.then((res) => res.json())
				.then((json) => {
					dispatch(addAllMessages(json?.data || []));
					dispatch(setMessageLoading(false));
					if (socket) {
						socket.emit("join chat", selectedChat._id);
					}
				})
				.catch((err) => {
					console.log(err);
					dispatch(setMessageLoading(false));
					toast.error("Message Loading Failed");
				});
		};
		getMessage(chatId);
	}, [chatId]);

	// chatDetailsBox outside click handler
	const handleClickOutside = (event) => {
		if (
			chatDetailsBox.current &&
			!chatDetailsBox.current.contains(event.target)
		) {
			setIsExiting(true);
			setTimeout(() => {
				dispatch(setChatDetailsBox(false));
				setIsExiting(false);
			}, 500);
		}
	};

	// add && remove events according to isChatDetailsBox
	useEffect(() => {
		if (isChatDetailsBox) {
			document.addEventListener("mousedown", handleClickOutside);
		} else {
			document.removeEventListener("mousedown", handleClickOutside);
		}
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isChatDetailsBox]);

	// Get the other user for individual chats
	const getOtherUser = () => {
		if (selectedChat?.isGroupChat) return null;
		return selectedChat?.users?.find(user => user._id !== authUserId);
	};

	return (
		<>
			{/* Chat Header */}
			<div
				className="py-4 px-4 w-full h-[7vh] font-medium flex justify-between items-center bg-background-light border-b border-border cursor-pointer hover:bg-background-hover transition-colors duration-200"
				onClick={() => dispatch(setChatDetailsBox(true))}
			>
				<div className="flex items-center gap-3">
					{/* Back Button for Mobile */}
					<div
						onClick={(e) => {
							e.stopPropagation();
							dispatch(addSelectedChat(null));
						}}
						className="sm:hidden bg-background-secondary hover:bg-background p-2 rounded-full flex items-center justify-center cursor-pointer transition-colors duration-200"
					>
						<FaArrowLeft title="Back" fontSize={14} className="text-icon-primary" />
					</div>

					{/* Chat Avatar */}
					<div className="relative">
						<img
							src={getChatImage(selectedChat, authUserId)}
							alt="Chat Avatar"
							className="h-10 w-10 rounded-full border border-border"
						/>
						{/* Online Status for Individual Chats */}
						{!selectedChat?.isGroupChat && getOtherUser() && (
							<div className="absolute -bottom-1 -right-1">
								<OnlineStatus userId={getOtherUser()._id} size="sm" />
							</div>
						)}
					</div>

					{/* Chat Info */}
					<div className="flex flex-col">
						<h1 className="line-clamp-1 text-text-primary font-semibold">
							{getChatName(selectedChat, authUserId)}
						</h1>
						{selectedChat?.isGroupChat ? (
							<span className="text-xs text-text-secondary">
								{selectedChat?.users?.length} members
							</span>
						) : (
							getOtherUser() && (
								<OnlineStatus 
									userId={getOtherUser()._id} 
									showText={true} 
									size="xs" 
								/>
							)
						)}
					</div>
				</div>

				{/* Menu Button */}
				<CiMenuKebab
					fontSize={20}
					title="Menu"
					className="cursor-pointer text-icon hover:text-text-primary transition-colors duration-200 p-1 rounded-full hover:bg-surface"
				/>
			</div>

			{/* Chat Details Sidebar */}
			{isChatDetailsBox && (
				<div
					className={`h-[60vh] w-full max-w-96 absolute top-0 left-0 z-20 p-1 ${
						isExiting ? "box-exit" : "box-enter"
					}`}
				>
					<div
						ref={chatDetailsBox}
						className="flex border border-border bg-surface-elevated overflow-hidden rounded-lg shadow-whatsapp"
					>
						<ChatDetailsBox />
					</div>
				</div>
			)}

			{/* Messages Area */}
			{isMessageLoading ? (
				<MessageLoading />
			) : (
				<AllMessages allMessage={allMessage} />
			)}

			{/* Message Input */}
			<MessageSend chatId={chatId} />
		</>
	);
};

MessageBox.propTypes = {
	chatId: PropTypes.string.isRequired
};

export default MessageBox;
