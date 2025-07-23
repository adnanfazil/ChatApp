import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { checkValidSignUpFrom } from "../utils/validate";
import { PiEye, PiEyeClosedLight } from "react-icons/pi";

const SignUp = () => {
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [load, setLoad] = useState("");
	const [isShow, setIsShow] = useState(false);
	const navigate = useNavigate();

	const signUpUser = (e) => {
		// Signup ---
		toast.loading("Wait until you SignUp");
		e.target.disabled = true;
		fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/signup`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				firstName: firstName,
				lastName: lastName,
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
					navigate("/signin");
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
	const handleSignup = (e) => {
		if (firstName && lastName && email && password) {
			const validError = checkValidSignUpFrom(
				firstName,
				lastName,
				email,
				password
			);
			if (validError) {
				toast.error(validError);
				return;
			}
			setLoad("Loading...");
			signUpUser(e);
		} else {
			toast.error("Required: All Fields");
		}
	};
	return (
		<div className="flex flex-col items-center justify-center min-h-screen bg-primary-green-light px-4">
			<div className="w-full max-w-md bg-background-light border border-border-dark rounded-xl shadow-whatsapp p-8">
				<div className="text-center mb-8">
					<h1 className="text-3xl font-bold text-text-primary mb-2">Create Account</h1>
					<p className="text-text-secondary">Join ChatApp and start connecting</p>
				</div>
				<form className="space-y-6">
					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-text-primary mb-2">
								First Name
							</label>
							<input
									className="whatsapp-input w-full"
								type="text"
								placeholder="First name"
								name="firstName"
								value={firstName}
								onChange={(e) => setFirstName(e.target.value)}
								required
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-text-primary mb-2">
								Last Name
							</label>
							<input
								className="whatsapp-input w-full"
								type="text"
								placeholder="Last name"
								name="lastName"
								value={lastName}
								onChange={(e) => setLastName(e.target.value)}
								required
							/>
						</div>
					</div>
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
							required
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
								placeholder="Create a password"
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
							handleSignup(e);
							e.preventDefault();
						}}
						className="whatsapp-button-primary w-full py-3 text-lg font-semibold"
						disabled={load !== ""}
					>
						{load === "" ? "Create Account" : load}
					</button>
					<div className="text-center">
						<span className="text-text-secondary">Already have an account? </span>
						<Link 
							to="/signin" 
							className="text-primary-green hover:text-primary-green-dark font-medium transition-colors"
						>
							Sign In
						</Link>
					</div>
				</form>
			</div>
		</div>
	);
};

export default SignUp;
