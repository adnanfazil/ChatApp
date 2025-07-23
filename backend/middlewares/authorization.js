const { getUserIdFromToken } = require("../config/jwtProvider");
const User = require("../models/user");
const wrapAsync = require("./wrapAsync");

const authorization = wrapAsync(async (req, res, next) => {
	const token = req.headers.authorization?.split(" ")[1];
	if (!token) {
		return res.status(401).send({ message: "Token not found" });
	}
	
	const userId = getUserIdFromToken(token);
	if (!userId) {
		return res.status(401).send({ message: "Invalid or expired token" });
	}
	
	try {
		req.user = await User.findById(userId).select("-password");
		if (!req.user) {
			return res.status(401).send({ message: "User not found" });
		}
	} catch (error) {
		return res.status(500).send({ message: "Database error" });
	}
	
	next();
});

module.exports = { authorization };
