import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
	addSelectedChat,
	removeNewMessageRecieved,
} from "../redux/slices/myChatSlice";
import { setNotificationBox } from "../redux/slices/conditionSlice";
import { MdOutlineClose } from "react-icons/md";
import { SimpleDateAndTime } from "../utils/formateDateTime";
import getChatName from "../utils/getChatName";
import { FaBell, FaComments } from "react-icons/fa";

const NotificationBox = () => {
	const authUserId = useSelector((store) => store?.auth?._id);
	const dispatch = useDispatch();
	const newMessageRecieved = useSelector(
		(store) => store?.myChat?.newMessageRecieved
	);

	return (
		<div className="flex -m-2 sm:-m-4 flex-col items-center my-6 min-h-screen w-full fixed top-0 justify-center z-50 bg-black bg-opacity-50 backdrop-blur-sm">
			<div className="p-6 w-[90%] sm:w-[70%] md:w-[60%] lg:w-[50%] xl:w-[40%] min-w-80 max-w-2xl border border-border bg-surface-elevated rounded-xl shadow-whatsapp transition-all relative animate-modal-enter">
				{/* Header */}
				<div className="flex items-center justify-between mb-6">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-whatsapp-primary rounded-full">
							<FaBell className="text-white" size={20} />
						</div>
						<h2 className="text-xl font-semibold text-text-primary">
							Notifications
						</h2>
					</div>
					<button
						title="Close"
						onClick={() => dispatch(setNotificationBox(false))}
						className="p-2 hover:bg-surface rounded-full transition-colors duration-200 text-text-secondary hover:text-text-primary"
					>
						<MdOutlineClose size={22} />
					</button>
				</div>

				{/* Notification Count */}
				{newMessageRecieved.length > 0 && (
					<div className="mb-4 p-3 bg-whatsapp-primary bg-opacity-10 border border-whatsapp-primary border-opacity-20 rounded-lg">
						<p className="text-sm text-text-primary flex items-center gap-2">
							<FaComments className="text-whatsapp-primary" />
							You have <span className="font-semibold text-whatsapp-primary">{newMessageRecieved.length}</span> new notifications
						</p>
					</div>
				)}

				{/* Notifications List */}
				<div className="w-full">
					<div className="flex flex-col w-full gap-2 py-2 overflow-y-auto overflow-hidden scroll-style max-h-[50vh]">
						{newMessageRecieved?.length === 0 ? (
							<div className="w-full h-40 flex flex-col justify-center items-center text-text-secondary">
								<FaBell size={48} className="mb-4 opacity-50" />
								<h3 className="text-lg font-medium mb-2">No new notifications</h3>
								<p className="text-sm text-center">You're all caught up! New messages will appear here.</p>
							</div>
						) : (
							newMessageRecieved?.map((message) => {
								const isGroupMessage = message?.chat?.isGroupChat;
								const chatName = getChatName(message?.chat, authUserId);
								const senderName = message?.sender?.firstName;
								
								return (
									<div
										key={message?._id}
										className="w-full border border-border rounded-lg flex justify-start items-start p-4 font-normal gap-3 hover:bg-surface transition-all duration-200 cursor-pointer group"
										onClick={() => {
											dispatch(removeNewMessageRecieved(message));
											dispatch(addSelectedChat(message?.chat));
											dispatch(setNotificationBox(false));
										}}
									>
										{/* Message Icon */}
										<div className="flex-shrink-0 mt-1">
											<div className="p-2 bg-whatsapp-primary bg-opacity-10 rounded-full group-hover:bg-opacity-20 transition-colors duration-200">
												<FaComments className="text-whatsapp-primary" size={16} />
											</div>
										</div>

										{/* Message Content */}
										<div className="flex-1 min-w-0">
											<div className="flex flex-col gap-1">
												<div className="flex items-start justify-between gap-2">
													<h4 className="font-medium text-text-primary text-sm truncate">
														{isGroupMessage ? `${chatName}` : `${senderName}`}
													</h4>
													<span className="text-xs text-text-secondary whitespace-nowrap">
														{SimpleDateAndTime(message?.createdAt)}
													</span>
												</div>
												
												<p className="text-sm text-text-secondary line-clamp-2">
													{isGroupMessage && (
														<span className="text-whatsapp-primary font-medium">
															{senderName}:{" "}
														</span>
													)}
													<span className="text-text-primary">
														{message?.message || message?.content?.text || 'New message'}
													</span>
												</p>
											</div>
										</div>
									</div>
								);
							})
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default NotificationBox;
