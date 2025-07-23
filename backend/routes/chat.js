const express = require("express");
const router = express.Router();
const wrapAsync = require("../middlewares/wrapAsync");
const { authorization } = require("../middlewares/authorization");
const chatController = require("../controllers/chat");

router.post("/", authorization, wrapAsync(chatController.postChat));
router.get("/", authorization, wrapAsync(chatController.getChat));

module.exports = router;
