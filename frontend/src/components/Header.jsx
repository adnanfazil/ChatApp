import React, { useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Logo from "../../public/logo.jpeg";
import { useDispatch, useSelector } from "react-redux";
import { addAuth } from "../redux/slices/authSlice";
import handleScrollTop from "../utils/handleScrollTop";
import {
	MdKeyboardArrowDown,
	MdKeyboardArrowUp,
	MdNotificationsActive,
} from "react-icons/md";
import {
	setHeaderMenu,
	setLoading,
	setNotificationBox,
	setProfileDetail,
} from "../redux/slices/conditionSlice";
import { IoLogOutOutline } from "react-icons/io5";
import { PiUserCircleLight } from "react-icons/pi";

const Header = () => {
	const user = useSelector((store) => store.auth);
	const isHeaderMenu = useSelector((store) => store?.condition?.isHeaderMenu);
	const newMessageRecieved = useSelector(
		(store) => store?.myChat?.newMessageRecieved
	);
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const token = localStorage.getItem("token");
	
	const getAuthUser = (token) => {
		dispatch(setLoading(true));
		fetch(`${import.meta.env.VITE_BACKEND_URL}/api/user/profile`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
		})
			.then((res) => res.json())
			.then((json) => {
				dispatch(addAuth(json.data));
				dispatch(setLoading(false));
			})
			.catch((err) => {
				console.log(err);
				dispatch(setLoading(false));
			});
	};
	
	useEffect(() => {
		if (token) {
			getAuthUser(token);
			navigate("/");
		} else {
			navigate("/signin");
		}
		dispatch(setHeaderMenu(false));
	}, [token]);

	// Scroll to top of page && Redirect Auth change
	const { pathname } = useLocation();
	useEffect(() => {
		if (user) {
			navigate("/");
		} else if (pathname !== "/signin" && pathname !== "/signup") {
			navigate("/signin");
		}
		handleScrollTop();
	}, [pathname, user]);

	const handleLogout = () => {
		localStorage.removeItem("token");
		window.location.reload();
		navigate("/signin");
	};

	useEffect(() => {
		var prevScrollPos = window.pageYOffset;
		const handleScroll = () => {
			var currentScrollPos = window.pageYOffset;
			if (prevScrollPos < currentScrollPos && currentScrollPos > 80) {
				document.getElementById("header").classList.add("hiddenbox");
			} else {
				document.getElementById("header").classList.remove("hiddenbox");
			}
			prevScrollPos = currentScrollPos;
		};
		window.addEventListener("scroll", handleScroll);
		return () => {
			window.removeEventListener("scroll", handleScroll);
		};
	}, []);

	const headerMenuBox = useRef(null);
	const headerUserBox = useRef(null);
	
	// headerMenuBox outside click handler
	const handleClickOutside = (event) => {
		if (
			headerMenuBox.current &&
			!headerUserBox?.current?.contains(event.target) &&
			!headerMenuBox.current.contains(event.target)
		) {
			dispatch(setHeaderMenu(false));
		}
	};

	// add && remove events according to isHeaderMenu
	useEffect(() => {
		if (isHeaderMenu) {
			document.addEventListener("mousedown", handleClickOutside);
		} else {
			document.removeEventListener("mousedown", handleClickOutside);
		}
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isHeaderMenu]);
	
	return (
		<div
			id="header"
			className="w-full h-16 fixed top-0 z-50 md:h-20 bg-white border-b-rounded-xl flex justify-between items-center px-4 py-3 font-medium bg-surface-elevated border-b border-border text-text-primary"
		>
			{/* Logo and Brand */}
			<div className="flex items-center justify-start gap-3">
				<Link to={"/"} className="flex items-center gap-3 hover:opacity-80 transition-opacity duration-200">
					<img
						src={Logo}
						alt="ChatApp"
						className="h-10 w-10 md:h-12 md:w-12 rounded-full border border-border"
					/>
					<span className="text-lg md:text-xl font-semibold text-whatsapp-primary hidden sm:block">
						ChatApp
					</span>
				</Link>
			</div>

			{/* User Section */}
			{user ? (
				<div className="flex items-center gap-3">
					{/* Notifications */}
					<div className="relative">
						<button
							className={`p-2 rounded-full transition-all duration-200 hover:bg-surface ${
								newMessageRecieved.length > 0
									? "animate-bounce text-whatsapp-primary"
									: "text-icon hover:text-text-primary"
							}`}
							title={`You have ${newMessageRecieved.length} new notifications`}
							onClick={() => dispatch(setNotificationBox(true))}
						>
							<MdNotificationsActive size={24} />
							{newMessageRecieved.length > 0 && (
								<span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center min-w-5">
									{newMessageRecieved.length > 99 ? '99+' : newMessageRecieved.length}
								</span>
							)}
						</button>
					</div>

					{/* Welcome Text */}
					<span className="text-text-secondary hidden md:block">
						Hi, <span className="text-text-primary font-medium">{user.firstName}</span>
					</span>

					{/* User Menu */}
					<div className="relative">
						<div
							ref={headerUserBox}
							onClick={(e) => {
								e.preventDefault();
								dispatch(setHeaderMenu(!isHeaderMenu));
							}}
							className="flex items-center gap-2 p-1 border border-border rounded-full bg-surface hover:bg-surface-elevated transition-all duration-200 cursor-pointer"
						>
							<img
								src={user.image}
								alt="User Avatar"
								className="w-8 h-8 md:w-10 md:h-10 rounded-full"
							/>
							<span className="text-icon px-1">
								{isHeaderMenu ? (
									<MdKeyboardArrowUp size={20} />
								) : (
									<MdKeyboardArrowDown size={20} />
								)}
							</span>
						</div>

						{/* Dropdown Menu */}
						{isHeaderMenu && (
							<div
								ref={headerMenuBox}
								className="absolute top-full right-0 mt-2 w-48 border bg-white border-border bg-surface-elevated rounded-lg shadow-whatsapp py-2 z-50 animate-slide-down"
							>
								{/* Profile Option */}
								<button
									onClick={() => {
										dispatch(setHeaderMenu(false));
										dispatch(setProfileDetail());
									}}
									className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface transition-colors duration-200 text-text-primary"
								>
									<PiUserCircleLight size={20} className="text-icon" />
									<span>Profile</span>
								</button>

								{/* Divider */}
								<div className="h-px bg-border mx-2 my-1"></div>

								{/* Logout Option */}
								<button
									className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-red-50 hover:text-red-600 transition-colors duration-200 text-text-primary"
									onClick={handleLogout}
								>
									<IoLogOutOutline size={20} className="text-red-500" />
									<span>Logout</span>
								</button>
							</div>
						)}
					</div>
				</div>
			) : (
				/* Sign In Button */
				<Link to={"/signin"}>
					<button className="whatsapp-button-secondary px-4 py-2 rounded-full font-medium">
						Sign In
					</button>
				</Link>
			)}
		</div>
	);
};

export default Header;
