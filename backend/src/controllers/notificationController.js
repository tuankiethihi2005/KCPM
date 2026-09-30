const NotificationService = require("../services/notificationService");

const getNotifications = async (req, res) => {
  try {
    const { page, limit, type, is_read } = req.query;
    const result = await NotificationService.getNotifications(req.user.id, {
      page,
      limit,
      type,
      is_read,
    });
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Không thể tải danh sách thông báo",
      error: error.message,
    });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const count = await NotificationService.getUnreadCount(req.user.id);
    return res.status(200).json({ success: true, count });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Không thể đếm thông báo chưa đọc",
      error: error.message,
    });
  }
};

const markAsRead = async (req, res) => {
  try {
    const result = await NotificationService.markAsRead(req.params.id, req.user.id);
    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông báo",
      });
    }
    return res.status(200).json({ success: true, message: "Đã đánh dấu đã đọc" });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Không thể đánh dấu thông báo",
      error: error.message,
    });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    await NotificationService.markAllAsRead(req.user.id);
    return res.status(200).json({ success: true, message: "Đã đánh dấu tất cả đã đọc" });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Không thể đánh dấu tất cả thông báo",
      error: error.message,
    });
  }
};

const deleteNotification = async (req, res) => {
  try {
    const result = await NotificationService.deleteNotification(req.params.id, req.user.id);
    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông báo",
      });
    }
    return res.status(200).json({ success: true, message: "Đã xóa thông báo" });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Không thể xóa thông báo",
      error: error.message,
    });
  }
};

module.exports = { getNotifications, getUnreadCount, markAsRead, markAllAsRead, deleteNotification };
