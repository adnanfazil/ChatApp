import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import getChatName, { getChatImage } from "../../utils/getChatName";
import { SimpleDateAndTime } from "../../utils/formateDateTime";
import { CiCircleInfo } from "react-icons/ci";
import { toast } from "react-toastify";
import { RxUpdate } from "react-icons/rx";
import { addSelectedChat } from "../../redux/slices/myChatSlice";
import { setLoading } from "../../redux/slices/conditionSlice";

const Overview = () => {
	const dispatch = useDispatch();
	const authUserId = useSelector((store) => store?.auth?._id);
	const selectedChat = useSelector((store) => store?.myChat?.selectedChat);
	const [changeNameBox, setChangeNameBox] = useState(false);
	const [changeName, setChangeName] = useState(selectedChat?.chatName);
	
	const handleShowNameChange = () => {
		if (authUserId === selectedChat?.groupAdmin?._id) {
			setChangeNameBox(!changeNameBox);
			setChangeName(selectedChat?.chatName);
		} else {
			toast.warn("You're not admin");
		}
	};
	
	const handleChangeName = () => {
		setChangeNameBox(false);
		if (selectedChat?.chatName === changeName.trim()) {
			toast.warn("Name already taken");
			return;
		} else if (!changeName.trim()) {
			toast.warn("Please enter group name");
			return;
		}
		dispatch(setLoading(true));
		const token = localStorage.getItem("token");
		fetch(`${import.meta.env.VITE_BACKEND_URL}/api/chat/rename`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({
				name: changeName.trim(),
				chatId: selectedChat?._id,
			}),
		})
			.then((res) => res.json())
			.then((json) => {
				dispatch(addSelectedChat(json?.data));
				dispatch(setLoading(false));
				toast.success("Group name changed");
			})
			.catch((err) => {
				console.log(err);
				toast.error(err.message);
				dispatch(setLoading(false));
			});
	};

	return (
		<div className="flex flex-col gap-4 text-text-primary p-4 bg-surface-elevated rounded-lg">
			{/* Chat Header */}
			<div className="flex flex-col items-center justify-center gap-3 py-4">
				<div className="relative">
					<img
						src={getChatImage(selectedChat, authUserId)}
						alt="Chat Avatar"
						className="h-20 w-20 rounded-full border-2 border-border shadow-md"
					/>
					{/* Online status indicator for individual chats */}
					{!selectedChat?.isGroupChat && (
						<div className="absolute bottom-1 right-1 h-4 w-4 bg-whatsapp-primary border-2 border-surface-elevated rounded-full"></div>
					)}
				</div>
				<div className="text-center leading-5">
					<div className="flex items-center gap-2 justify-center">
						<h1 className="font-semibold text-lg text-text-primary">
							{getChatName(selectedChat, authUserId)}
						</h1>
						{selectedChat?.isGroupChat && (
							<CiCircleInfo
								fontSize={18}
								title="Change Name"
								className="cursor-pointer text-icon hover:text-whatsapp-primary transition-colors duration-200"
								onClick={handleShowNameChange}
							/>
						)}
					</div>
					{selectedChat?.isGroupChat && (
						<p className="text-sm text-text-secondary mt-1">
							{selectedChat?.users?.length} members
						</p>
					)}
				</div>
			</div>

			{/* Rename Group Input */}
			{changeNameBox && (
				<div className="bg-surface p-4 rounded-lg border border-border animate-slide-down">
					<h3 className="text-sm font-medium text-text-primary mb-3">Rename Group Chat</h3>
					<div className="flex gap-2">
						<input
							type="text"
							className="flex-1 border border-border py-2 px-3 font-normal outline-none rounded-lg bg-background text-text-primary placeholder-text-secondary focus:border-whatsapp-primary transition-colors duration-200"
							placeholder="Enter new group name"
							value={changeName}
							onChange={(e) => setChangeName(e.target.value)}
							onKeyPress={(e) => e.key === 'Enter' && handleChangeName()}
						/>
						<button
							title="Update Name"
							className="whatsapp-button-primary p-2 rounded-lg"
							onClick={handleChangeName}
						>
							<RxUpdate fontSize={18} className="text-white" />
						</button>
					</div>
				</div>
			)}

			{/* Divider */}
			<div className="h-px w-full bg-border"></div>

			{/* Chat Information */}
			<div className="space-y-4">
				<div className="flex flex-col gap-1">
					<h3 className="text-sm font-medium text-text-primary flex items-center gap-2">
						📅 Created
					</h3>
					<p className="text-sm text-text-secondary pl-6">
						{SimpleDateAndTime(selectedChat?.createdAt)}
					</p>
				</div>

				<div className="flex flex-col gap-1">
					<h3 className="text-sm font-medium text-text-primary flex items-center gap-2">
						🔄 Last Updated
					</h3>
					<p className="text-sm text-text-secondary pl-6">
						{SimpleDateAndTime(selectedChat?.updatedAt)}
					</p>
				</div>

				{selectedChat?.latestMessage && (
					<div className="flex flex-col gap-1">
						<h3 className="text-sm font-medium text-text-primary flex items-center gap-2">
							💬 Last Message
						</h3>
						<p className="text-sm text-text-secondary pl-6">
							{SimpleDateAndTime(selectedChat?.latestMessage?.updatedAt)}
						</p>
					</div>
				)}
			</div>
		</div>
	);
};

export default Overview;
