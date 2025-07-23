import { useEffect, useState } from "react";
import { FaSearch, FaTimes } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import {
	setChatLoading,
	setLoading,
	setUserSearchBox,
} from "../../redux/slices/conditionSlice";
import { toast } from "react-toastify";
import ChatShimmer from "../loading/ChatShimmer";
import { addSelectedChat } from "../../redux/slices/myChatSlice";
import { SimpleDateAndTime } from "../../utils/formateDateTime";
import { socket } from "../../socket/socket";
import OnlineStatus from "../OnlineStatus";

const UserSearch = () => {
	const dispatch = useDispatch();
	const isChatLoading = useSelector(
		(store) => store?.condition?.isChatLoading
	);
	const [users, setUsers] = useState([]);
	const [selectedUsers, setSelectedUsers] = useState([]);
	const [inputUserName, setInputUserName] = useState("");
	const authUserId = useSelector((store) => store?.auth?._id);

	// All Users Api Call
	useEffect(() => {
		const getAllUsers = () => {
			dispatch(setChatLoading(true));
			const token = localStorage.getItem("token");
			fetch(`${import.meta.env.VITE_BACKEND_URL}/api/user/users`, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
			})
				.then((res) => res.json())
				.then((json) => {
					setUsers(json.data || []);
					setSelectedUsers(json.data || []);
					dispatch(setChatLoading(false));
				})
				.catch((err) => {
					console.log(err);
					dispatch(setChatLoading(false));
				});
		};
		getAllUsers();
	}, []);

	useEffect(() => {
		setSelectedUsers(
			users.filter((user) => {
				return (
					user.firstName
						.toLowerCase()
						.includes(inputUserName?.toLowerCase()) ||
					user.lastName
						.toLowerCase()
						.includes(inputUserName?.toLowerCase()) ||
					user.email
						.toLowerCase()
						.includes(inputUserName?.toLowerCase())
				);
			})
		);
	}, [inputUserName]);
	
	const handleCreateChat = async (userId) => {
		dispatch(setLoading(true));
		const token = localStorage.getItem("token");
		fetch(`${import.meta.env.VITE_BACKEND_URL}/api/chat`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({
				userId: userId,
			}),
		})
			.then((res) => res.json())
			.then((json) => {
				dispatch(addSelectedChat(json?.data));
				dispatch(setLoading(false));
				if (socket) {
					socket.emit("chat created", json?.data, authUserId);
				}
				toast.success("Created & Selected chat");
				dispatch(setUserSearchBox());
			})
			.catch((err) => {
				console.log(err);
				toast.error(err.message);
				dispatch(setLoading(false));
			});
	};
	
	return (
		<>
			{/* Header */}
			<div className="px-4 py-3 h-[70px] flex justify-between items-center bg-background-light border-r border-border">
				<h1 className="text-xl font-medium text-text-primary">New Chat</h1>
				<button
					className="p-2 rounded-lg hover:bg-background-hover transition-colors duration-200"
					onClick={() => dispatch(setUserSearchBox())}
					title="Close"
				>
					<FaTimes className="w-5 h-5 text-icon-secondary" />
				</button>
			</div>

			{/* Search Bar */}
			<div className="px-4 py-3 bg-background-light border-r border-border">
				<div className="relative">
					<FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-icon-secondary" />
					<input
						id="search"
						type="text"
						placeholder="Search users..."
						className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
						onChange={(e) => setInputUserName(e.target?.value)}
					/>
				</div>
			</div>

			{/* User List */}
			<div className="flex flex-col overflow-y-auto scroll-style h-[calc(100vh-140px)] bg-white">
				{selectedUsers.length == 0 && isChatLoading ? (
					<ChatShimmer />
				) : (
					<>
						{selectedUsers?.length === 0 && (
							<div className="flex-1 flex items-center justify-center p-8">
								<div className="text-center">
									<div className="w-16 h-16 mx-auto mb-4 rounded-full bg-background-secondary flex items-center justify-center">
										<FaSearch className="w-6 h-6 text-icon-secondary" />
									</div>
									<h3 className="text-lg font-medium text-text-primary mb-2">
										No users found
									</h3>
									<p className="text-text-secondary text-sm">
										Try searching with a different name or email
									</p>
								</div>
							</div>
						)}
						{selectedUsers?.map((user) => {
							return (
								<div
									key={user?._id}
									className="px-4 py-3 flex items-center gap-3 cursor-pointer transition-all duration-200 animate-fade-in whatsapp-hover hover:bg-background-hover"
									onClick={() => handleCreateChat(user._id)}
								>
									{/* Avatar with online status */}
									<div className="relative flex-shrink-0">
										<img
											className="w-12 h-12 rounded-full object-cover"
											src={user?.image}
											alt="User avatar"
										/>
										<div className="absolute -bottom-0.5 -right-0.5">
											<OnlineStatus userId={user._id} size="sm" />
										</div>
									</div>

									{/* User info */}
									<div className="flex-1 min-w-0">
										<div className="flex items-center justify-between mb-1">
											<h3 className="font-medium text-text-primary truncate capitalize">
												{user?.firstName} {user?.lastName}
											</h3>
											<OnlineStatus userId={user._id} showText={true} size="xs" />
										</div>
										<div className="flex items-center justify-between">
											<span className="text-sm text-text-secondary truncate">
												{user?.email}
											</span>
											<span className="text-xs text-text-muted ml-2 flex-shrink-0">
												{SimpleDateAndTime(user?.createdAt)}
											</span>
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

export default UserSearch;
