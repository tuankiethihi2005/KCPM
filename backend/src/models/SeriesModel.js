const mongoose = require("mongoose");

const seriesSchema = new mongoose.Schema(
  {
    title: {
    type: String,
    required: [true, "Vui lòng nhập tên series"],
    minlength: [2, "Tên series phải có ít nhất 2 ký tự"],
    maxlength: [100, "Tên series không được vượt quá 100 ký tự"],
    trim: true,
    unique: true,
  },
    description: {
      type: String,
    },
    genre: {
      type: String,
      minlength: 2,
      maxlength: 50,
    },
    target_audience: {
      type: String,
      minlength: 2,
      maxlength: 50,
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
