import React, { useState } from "react";
import MemberAdd from "./MemberAdd";
import MemberRemove from "./MemberRemove";
import { useSelector } from "react-redux";
import { HiOutlineUsers } from "react-icons/hi2";

const Member = () => {
	const selectedChat = useSelector((store) => store?.myChat?.selectedChat);
	const [memberAddBox, setMemberAddBox] = useState(false);

	return (
		<div className="flex flex-col p-4 gap-4 text-text-primary relative h-full z-10 overflow-auto scroll-style bg-background-primary">
			<div className="flex items-center justify-center gap-3 mb-4">
				<HiOutlineUsers className="w-6 h-6 text-primary-500" />
				<h1 className="text-xl font-semibold text-center">
					Members ({selectedChat?.users?.length})
				</h1>
			</div>
			{memberAddBox ? (
				<MemberAdd setMemberAddBox={setMemberAddBox} />
			) : (
				<MemberRemove setMemberAddBox={setMemberAddBox} />
			)}
		</div>
	);
};

export default Member;
