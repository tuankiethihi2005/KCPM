const mongoose = require("mongoose");

const seriesSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
    },
    genre: {
      type: String, // Bạn có thể đổi thành [String] nếu 1 truyện có nhiều thể loại
    },
    target_audience: {
      type: String,
    },
    author_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    editor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      // Không bắt buộc ngay từ đầu vì có thể lúc tạo series chưa có editor
    },
    status: {
      type: String,
      enum: [
        "Draft",
        "Active",
        "At Risk",
        "Hiatus",
        "Cancelled",
        "Completed",
        "Changed Schedule",
      ],
      default: "Draft",
    },
    approved_schedule: {
      type: String,
      enum: ["weekly", "monthly", "one-shot", "online only", "none"],
      default: "none",
    },
    risk_status: {
      type: String,
      enum: ["Safe", "Warning", "Critical"],
      default: "Safe",
    },
  },
  { timestamps: true },
); // Tự động tạo created_at và updated_at

module.exports = mongoose.model("Series", seriesSchema);
