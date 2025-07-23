import React from "react";
import { FaComments } from "react-icons/fa";

const ChatNotSelected = () => {
	return (
		<div className="h-full w-full flex flex-col justify-center items-center bg-background-primary p-8">
			<div className="text-center animate-fade-in">
				<div className="w-24 h-24 mx-auto mb-6 rounded-full bg-background-tertiary flex items-center justify-center">
					<FaComments className="w-10 h-10 text-icon-secondary" />
				</div>
				<h1 className="text-2xl font-medium text-text-primary mb-3">
					Welcome to Chat
				</h1>
				<p className="text-text-secondary text-lg">
					Select a chat to start messaging
				</p>
				<p className="text-text-muted text-sm mt-2">
					Choose from your existing conversations or start a new one
				</p>
			</div>
		</div>
	);
};

export default ChatNotSelected;
