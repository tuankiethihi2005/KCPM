const Notification = require("../models/NotificationModel");

class NotificationService {
  /**
   * Tạo thông báo mới
   */
  static async createNotification({ user_id, type, title, message, target_type, target_id }) {
    const notification = await Notification.create({
      user_id,
      type,
      title,
      message,
      target_type: target_type || null,
      target_id: target_id || null,
    });
    return notification;
  }

  /**
   * Lấy danh sách thông báo của user (phân trang + filter)
   */
  static async getNotifications(user_id, query = {}) {
    const { page = 1, limit = 20, type, is_read } = query;

    const filter = { user_id };
    if (type) filter.type = type;
    if (is_read !== undefined && is_read !== "") filter.is_read = is_read === "true";

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      Notification.countDocuments(filter),
    ]);

    return {
      data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Đếm số thông báo chưa đọc của user
   */
  static async getUnreadCount(user_id) {
    const count = await Notification.countDocuments({ user_id, is_read: false });
    return count;
  }

  /**
   * Đánh dấu 1 thông báo đã đọc
   */
  static async markAsRead(notification_id, user_id) {
    const result = await Notification.findOneAndUpdate(
      { _id: notification_id, user_id },
      { is_read: true },
      { new: true },
    );
    return result;
  }

  /**
   * Đánh dấu tất cả thông báo đã đọc
   */
  static async markAllAsRead(user_id) {
    const result = await Notification.updateMany(
      { user_id, is_read: false },
      { is_read: true },
    );
    return result;
  }

  /**
   * Xóa 1 thông báo
   */
  static async deleteNotification(notification_id, user_id) {
    const result = await Notification.findOneAndDelete({ _id: notification_id, user_id });
    return result;
  }
}

module.exports = NotificationService;
