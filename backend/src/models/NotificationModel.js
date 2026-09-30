const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    target_type: {
      type: String,
    }, // Tên của bảng mà thông báo này nhắc tới (vd: 'Task', 'Series', 'Chapter')
    target_id: {
      type: mongoose.Schema.Types.ObjectId,
    }, // ID cụ thể của Task/Series/Chapter đó
    title: {
      type: String,
      required: true,
    }, // Tiêu đề thông báo
    message: {
      type: String,
      required: true,
    }, // Nội dung thông báo
    type: {
      type: String,
      enum: ["System", "Task_Update", "Warning", "Payment"],
      required: true,
    }, // Phân loại: 'System', 'Task_Update', 'Warning'...
    is_read: {
      type: Boolean,
      default: false,
    }, // Trạng thái đã đọc hay chưa
  },
  { timestamps: true },
);

notificationSchema.index({ user_id: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
