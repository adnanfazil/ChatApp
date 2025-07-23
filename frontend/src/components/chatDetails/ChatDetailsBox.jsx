import React, { useState } from "react";
import { CiCircleInfo } from "react-icons/ci";
import { HiOutlineUsers } from "react-icons/hi2";
import Overview from "./Overview";
import Member from "./Member";
import { IoSettingsOutline } from "react-icons/io5";
import ChatSetting from "./ChatSetting";
import { useSelector } from "react-redux";

const ChatDetailsBox = () => {
	const selectedChat = useSelector((store) => store?.myChat?.selectedChat);
	const [detailView, setDetailView] = useState("overview");
	
	return (
		<>
			{/* Navigation Sidebar */}
			<div className="w-fit h-[60vh] p-3 flex flex-col gap-2 bg-background-light border-r border-border">
				<div
					className={`flex gap-3 items-center p-3 rounded-lg px-4 cursor-pointer transition-all duration-200 ${
						detailView === "overview"
							? "bg-primary-500 text-white"
							: "bg-background-secondary text-text-primary hover:bg-background-hover"
					}`}
					onClick={() => setDetailView("overview")}
					title="Overview"
				>
					<CiCircleInfo fontSize={18} />
					<span className="hidden sm:block font-medium">Overview</span>
				</div>
				{selectedChat?.isGroupChat && (
					<div
						className={`flex gap-3 items-center p-3 rounded-lg px-4 cursor-pointer transition-all duration-200 ${
							detailView === "members"
								? "bg-primary-500 text-white"
								: "bg-background-secondary text-text-primary hover:bg-background-hover"
						}`}
						onClick={() => setDetailView("members")}
						title="Members"
					>
						<HiOutlineUsers fontSize={18} />
						<span className="hidden sm:block font-medium">Members</span>
					</div>
				)}
				<div
					className={`flex gap-3 items-center p-3 rounded-lg px-4 cursor-pointer transition-all duration-200 ${
						detailView === "setting"
							? "bg-primary-500 text-white"
							: "bg-background-secondary text-text-primary hover:bg-background-hover"
					}`}
					onClick={() => setDetailView("setting")}
					title="Settings"
				>
					<IoSettingsOutline fontSize={18} />
					<span className="hidden sm:block font-medium">Settings</span>
				</div>
			</div>
			
			{/* Content Area */}
			<div className="w-full h-[60vh] bg-background">
				{detailView === "overview" && <Overview />}
				{detailView === "members" && <Member />}
				{detailView === "setting" && <ChatSetting />}
			</div>
		</>
	);
};

export default ChatDetailsBox;
