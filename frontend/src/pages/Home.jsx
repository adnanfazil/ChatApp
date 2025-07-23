import { useEffect } from "react";
import { MdChat } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import UserSearch from "../components/chatComponents/UserSearch";
import MyChat from "../components/chatComponents/MyChat";
import MessageBox from "../components/messageComponents/MessageBox";
import ChatNotSelected from "../components/chatComponents/ChatNotSelected";
import {
	setChatDetailsBox,
	setSocketConnected,
	setUserSearchBox,
} from "../redux/slices/conditionSlice";
import { initializeSocket, getSocket } from "../socket/socket";
import { addAllMessages, addNewMessage } from "../redux/slices/messageSlice";
import {
	addNewChat,
	addNewMessageRecieved,
	deleteSelectedChat,
} from "../redux/slices/myChatSlice";
import { toast } from "react-toastify";
import { receivedSound } from "../utils/notificationSound";

let selectedChatCompare;

const Home = () => {
	const selectedChat = useSelector((store) => store?.myChat?.selectedChat);
	const dispatch = useDispatch();
	const isUserSearchBox = useSelector(
		(store) => store?.condition?.isUserSearchBox
	);
	const authUserId = useSelector((store) => store?.auth?._id);

	// socket connection
	useEffect(() => {
		if (!authUserId) return;
		
		// Initialize socket connection
		const socket = initializeSocket();
		if (!socket) return;
		
		// Setup socket connection
		socket.emit("setup", authUserId);
		
		// Handle connection confirmation
		const handleConnected = () => {
			console.log("Socket setup complete");
			dispatch(setSocketConnected(true));
		};
		
		socket.on("connected", handleConnected);
		
		return () => {
			if (socket) {
				socket.off("connected", handleConnected);
			}
		};
	}, [authUserId, dispatch]);

	// socket message received
	useEffect(() => {
		const socket = getSocket();
		if (!socket) return;
		
		selectedChatCompare = selectedChat;
		const messageHandler = (newMessageReceived) => {
			if (
				selectedChatCompare &&
				selectedChatCompare._id === newMessageReceived.chat._id
			) {
				dispatch(addNewMessage(newMessageReceived));
			} else {
				receivedSound();
				dispatch(addNewMessageRecieved(newMessageReceived));
			}
		};
		socket.on("message received", messageHandler);

		return () => {
			if (socket) {
				socket.off("message received", messageHandler);
			}
		};
	}, [selectedChat, dispatch]);

	// socket clear chat messages
	useEffect(() => {
		const socket = getSocket();
		if (!socket) return;
		
		const clearChatHandler = (chatId) => {
			if (chatId === selectedChat?._id) {
				dispatch(addAllMessages([]));
				toast.success("Cleared all messages");
			}
		};
		socket.on("clear chat", clearChatHandler);
		return () => {
			if (socket) {
				socket.off("clear chat", clearChatHandler);
			}
		};
	}, [selectedChat, dispatch]);
	
	// socket delete chat messages
	useEffect(() => {
		const socket = getSocket();
		if (!socket) return;
		
		const deleteChatHandler = (chatId) => {
			dispatch(setChatDetailsBox(false));
			if (selectedChat && chatId === selectedChat._id) {
				dispatch(addAllMessages([]));
			}
			dispatch(deleteSelectedChat(chatId));
			toast.success("Chat deleted successfully");
		};
		socket.on("delete chat", deleteChatHandler);
		return () => {
			if (socket) {
				socket.off("delete chat", deleteChatHandler);
			}
		};
	}, [selectedChat, dispatch]);

	// socket chat created
	useEffect(() => {
		const socket = getSocket();
		if (!socket) return;
		
		const chatCreatedHandler = (chat) => {
			dispatch(addNewChat(chat));
			toast.success("Created & Selected chat");
		};
		socket.on("chat created", chatCreatedHandler);
		return () => {
			if (socket) {
				socket.off("chat created", chatCreatedHandler);
			}
		};
	}, [dispatch]);

	return (
		<div className="flex w-full bg-white border border-border-dark rounded-lg shadow-whatsapp relative overflow-hidden">
			<div
				className={`${
					selectedChat && "hidden"
				} sm:block sm:w-[40%] w-full h-[80vh] bg-background-dark/5 border-r border-border-dark relative`}
			>
				<div className="absolute bottom-4 right-4 z-10">
					<button
						title="New Chat"
						className="whatsapp-fab flex items-center justify-center"
						onClick={() => dispatch(setUserSearchBox())}
					>
						<MdChat fontSize={24} />
					</button>
				</div>
				{isUserSearchBox ? <UserSearch /> : <MyChat />}
			</div>
			<div
				className={`${
					!selectedChat && "hidden"
				} sm:block sm:w-[60%] w-full h-[80vh] bg-background-light relative overflow-hidden`}
			>
				{selectedChat ? (
					<MessageBox chatId={selectedChat?._id} />
				) : (
					<ChatNotSelected />
				)}
			</div>
		</div>
	);
};

export default Home;
