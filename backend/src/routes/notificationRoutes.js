const express = require("express");
const { requireAuth } = require("../modules/auth/middlewares/requireAuth");
const notificationController = require("../controllers/notificationController");

const router = express.Router();

router.use(requireAuth);

router.get("/", notificationController.getNotifications);
router.get("/unread-count", notificationController.getUnreadCount);
router.put("/mark-all-read", notificationController.markAllAsRead);
router.put("/:id/read", notificationController.markAsRead);
router.delete("/:id", notificationController.deleteNotification);

module.exports = router;
