import { useEffect } from "react";
import { FaPenAlt, FaImage, FaVideo, FaMusic, FaFile } from "react-icons/fa";
import { addMyChat, addSelectedChat } from "../../redux/slices/myChatSlice";
import { useDispatch, useSelector } from "react-redux";
import {
    setChatLoading,
    setGroupChatBox,
} from "../../redux/slices/conditionSlice";
import ChatShimmer from "../loading/ChatShimmer";
import getChatName, { getChatImage } from "../../utils/getChatName";
import { VscCheckAll } from "react-icons/vsc";
import { SimpleDateAndTime, SimpleTime } from "../../utils/formateDateTime";
import OnlineStatus from "../OnlineStatus";

const MyChat = () => {
    const dispatch = useDispatch();
    const myChat = useSelector((store) => store.myChat.chat);
    const authUserId = useSelector((store) => store?.auth?._id);
    const selectedChat = useSelector((store) => store?.myChat?.selectedChat);
    const isChatLoading = useSelector(
        (store) => store?.condition?.isChatLoading
    );
    const newMessageId = useSelector((store) => store?.message?.newMessageId);
    const isGroupChatId = useSelector((store) => store.condition.isGroupChatId);

    useEffect(() => {
        const getMyChat = () => {
            dispatch(setChatLoading(true));
            const token = localStorage.getItem("token");
            fetch(`${import.meta.env.VITE_BACKEND_URL}/api/chat`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            })
                .then((res) => res.json())
                .then((json) => {
                    dispatch(addMyChat(json?.data || []));
                    dispatch(setChatLoading(false));
                })
                .catch((err) => {
                    console.log(err);
                    dispatch(setChatLoading(false));
                });
        };
        getMyChat();
    }, [newMessageId, isGroupChatId]);

    return (
        <>
            {/* Header */}
            <div className="px-4 py-3 h-[70px] flex justify-between items-center bg-background-light border-r border-border">
                <h1 className="text-xl font-medium text-text-primary">Chats</h1>
                {/* <button
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background-secondary hover:bg-background-hover transition-colors duration-200 text-text-primary whatsapp-button-secondary"
                    title="New Group"
                    onClick={() => dispatch(setGroupChatBox())}
                >
                    <span className="text-sm font-medium">New Group</span>
                    <FaPenAlt className="w-4 h-4" />
                </button> */}
            </div>

            {/* Chat List */}
            <div className="flex flex-col overflow-y-auto scroll-style h-[calc(100vh-70px)]">
                {myChat.length === 0 && isChatLoading ? (
                    <ChatShimmer />
                ) : (
                    <>
                        {myChat?.length === 0 && (
                            <div className="flex-1 flex items-center justify-center p-8">
                                <div className="text-center">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-background-secondary flex items-center justify-center">
                                        <FaPenAlt className="w-6 h-6 text-icon-secondary" />
                                    </div>
                                    <h3 className="text-lg font-medium text-text-primary mb-2">
                                        Start a conversation
                                    </h3>
                                    <p className="text-text-secondary text-sm">
                                        Select a contact to start messaging
                                    </p>
                                </div>
                            </div>
                        )}
                        {myChat?.map((chat) => {
                            const otherUser = !chat.isGroupChat
                                ? chat.users.find(user => user._id !== authUserId)
                                : null;

                            const getLatestMessagePreview = (latestMessage) => {
                                if (!latestMessage) return null;

                                const messageType = latestMessage.messageType || 'text';

                                switch (messageType) {
                                    case 'image':
                                        return (
                                            <div className="flex items-center gap-2">
                                                <FaImage className="w-3 h-3 text-icon-secondary" />
                                                <span>Photo</span>
                                            </div>
                                        );
                                    case 'video':
                                        return (
                                            <div className="flex items-center gap-2">
                                                <FaVideo className="w-3 h-3 text-icon-secondary" />
                                                <span>Video</span>
                                            </div>
                                        );
                                    case 'audio':
                                        return (
                                            <div className="flex items-center gap-2">
                                                <FaMusic className="w-3 h-3 text-icon-secondary" />
                                                <span>Audio</span>
                                            </div>
                                        );
                                    case 'file':
                                        return (
                                            <div className="flex items-center gap-2">
                                                <FaFile className="w-3 h-3 text-icon-secondary" />
                                                <span>Document</span>
                                            </div>
                                        );
                                    default:
                                        return latestMessage.content?.text || latestMessage.message || '';
                                }
                            };

                            return (
                                <div
                                    key={chat?._id}
                                    className={`px-4 py-3 flex items-center gap-3 cursor-pointer transition-all duration-200 animate-fade-in whatsapp-hover ${
                                        selectedChat?._id === chat?._id
                                            ? "bg-background-secondary border-r-4 border-primary-500"
                                            : "hover:bg-background-hover"
                                    }`}
                                    onClick={() => dispatch(addSelectedChat(chat))}
                                >
                                    {/* Avatar with online status */}
                                    <div className="relative flex-shrink-0">
                                        <img
                                            className="w-12 h-12 rounded-full object-cover"
                                            src={getChatImage(chat, authUserId)}
                                            alt="Chat avatar"
                                        />
                                        {otherUser && (
                                            <div className="absolute -bottom-0.5 -right-0.5">
                                                <OnlineStatus userId={otherUser._id} size="sm" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Chat info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <h3 className="font-medium text-text-primary truncate">
                                                {getChatName(chat, authUserId)}
                                            </h3>
                                            <span className="text-xs text-text-secondary ml-2 flex-shrink-0">
                                                {chat?.latestMessage &&
                                                    SimpleTime(chat?.latestMessage?.createdAt)}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1 min-w-0 flex-1">
                                                {chat?.latestMessage ? (
                                                    <>
                                                        {chat?.latestMessage?.sender?._id === authUserId && (
                                                            <VscCheckAll className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                                        )}
                                                        <span className="text-sm text-text-secondary truncate">
                                                            {getLatestMessagePreview(chat.latestMessage)}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span className="text-sm text-text-muted">
                                                        {SimpleDateAndTime(chat?.createdAt)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </>
                )}
            </div>
        </>
    );
};

export default MyChat;
