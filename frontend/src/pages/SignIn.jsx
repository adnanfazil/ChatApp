import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { addAuth } from "../redux/slices/authSlice";
import { checkValidSignInFrom } from "../utils/validate";
import { PiEye, PiEyeClosedLight } from "react-icons/pi";

const SignIn = () => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [load, setLoad] = useState("");
	const [isShow, setIsShow] = useState(false);
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const logInUser = (e) => {
		// SignIn ---
		toast.loading("Wait until you SignIn");
		e.target.disabled = true;
		fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/signin`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				email: email,
				password: password,
			}),
		})
			.then((response) => response.json())
			.then((json) => {
				setLoad("");
				e.target.disabled = false;
				toast.dismiss();
				if (json.token) {
					localStorage.setItem("token", json.token);
					dispatch(addAuth(json.data));
					navigate("/");
					toast.success(json?.message);
				} else {
					toast.error(json?.message);
				}
			})
			.catch((error) => {
				console.error("Error:", error);
				setLoad("");
				toast.dismiss();
				toast.error("Error : " + error.code);
				e.target.disabled = false;
			});
	};
	const handleLogin = (e) => {
		if (email && password) {
			const validError = checkValidSignInFrom(email, password);
			if (validError) {
				toast.error(validError);
				return;
			}
			setLoad("Loading...");
			logInUser(e);
		} else {
			toast.error("Required: All Fields");
		}
	};
	return (
		<div className="flex flex-col items-center justify-center min-h-screen bg-primary-green-light px-4">
			<div className="w-full max-w-md bg-background-light border border-border-dark rounded-xl shadow-whatsapp p-8">
				<div className="text-center mb-8">
					<h1 className="text-3xl font-bold text-text-primary mb-2">Welcome Back</h1>
					<p className="text-text-secondary">Sign in to your ChatApp account</p>
				</div>
				<form className="space-y-6">
					<div>
						<label className="block text-sm font-medium text-text-primary mb-2">
							Email Address
						</label>
						<input
							className="whatsapp-input w-full"
							type="email"
							placeholder="Enter your email"
							name="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-text-primary mb-2">
							Password
						</label>
						<div className="relative">
							<input
								className="whatsapp-input pr-12 w-full"
								type={isShow ? "text" : "password"}
								placeholder="Enter your password"
								name="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
							/>
							<button
								type="button"
								onClick={() => setIsShow(!isShow)}
								className="absolute right-3 top-1/2 transform -translate-y-1/2 text-icon-secondary hover:text-icon-primary transition-colors"
							>
								{isShow ? (
									<PiEyeClosedLight fontSize={20} />
								) : (
									<PiEye fontSize={20} />
								)}
							</button>
						</div>
					</div>
					<button
						onClick={(e) => {
							e.preventDefault();
							handleLogin(e);
						}}
						className="whatsapp-button-primary w-full py-3 text-lg font-semibold"
						disabled={load !== ""}
					>
						{load === "" ? "Sign In" : load}
					</button>
					<div className="text-center">
						<Link 
							to="#" 
							className="text-sm text-primary-green hover:text-primary-green-dark transition-colors"
						>
							Forgot Password?
						</Link>
					</div>
					<div className="relative">
						<div className="absolute inset-0 flex items-center">
							<div className="w-full border-t border-border-dark"></div>
						</div>
						<div className="relative flex justify-center text-sm">
							<span className="px-4 bg-background-light text-text-secondary">or</span>
						</div>
					</div>
					<div className="text-center">
						<span className="text-text-secondary">Don't have an account? </span>
						<Link 
							to="/signup" 
							className="text-primary-green hover:text-primary-green-dark font-medium transition-colors"
						>
							Sign Up
						</Link>
					</div>
				</form>
			</div>
		</div>
	);
};

export default SignIn;
