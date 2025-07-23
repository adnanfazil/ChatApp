const Chat = require("../models/chat");
const Message = require("../models/message");

const postChat = async (req, res) => {
	const { userId } = req.body;
	if (!userId) {
		return res.status(200).json({ message: "userId not provide" });
	}
	const existingChat = await Chat.find({
		$and: [
			{ users: { $elemMatch: { $eq: req.user._id } } },
			{ users: { $elemMatch: { $eq: userId } } },
		],
	})
		.populate("users", "-password")
		.populate({
			path: "latestMessage",
			populate: {
				path: "sender",
				select: "-password",
			},
		});

	if (existingChat.length == 0) {
		const chatName = "Messenger";
		const users = [req.user._id, userId];
		const chat = await Chat.create({
			chatName,
			users,
		});
		const chatAll = await Chat.findOne({ _id: chat._id }).populate(
			"users",
			"-password"
		);
		return res.status(200).json({ data: chatAll });
	} else {
		const chat = existingChat[0];
		return res.status(200).json({ data: chat });
	}
};

const getChat = async (req, res) => {
	const chat = await Chat.find({
		users: { $elemMatch: { $eq: req.user._id } },
	})
		.sort({ updatedAt: -1 })
		.populate("users", "-password")
		.populate({
			path: "latestMessage",
			populate: {
				path: "sender",
				select: "-password",
			},
		});
	return res.status(200).json({ data: chat });
};

module.exports = {
	postChat,
	getChat,
};
