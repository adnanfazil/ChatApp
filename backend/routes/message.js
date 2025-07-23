const express = require("express");
const router = express.Router();
const wrapAsync = require("../middlewares/wrapAsync");
const { authorization } = require("../middlewares/authorization");
const messageController = require("../controllers/message");

// Create a new message (text)
router.post("/", authorization, wrapAsync(messageController.createMessage));

// Get all messages for a chat (with pagination)
router.get("/:chatId", authorization, wrapAsync(messageController.allMessage));

// Clear all messages in a chat
router.delete("/clear/:chatId", authorization, wrapAsync(messageController.clearChat));

// Delete a specific message
router.delete("/:messageId", authorization, wrapAsync(messageController.deleteMessage));

// Edit a message (text only)
router.put("/:messageId", authorization, wrapAsync(messageController.editMessage));

// Legacy route for backward compatibility
router.get("/clearChat/:chatId", authorization, wrapAsync(messageController.clearChat));

module.exports = router;
