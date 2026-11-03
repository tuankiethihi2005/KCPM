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
      trim: true,
      minlength: [10, "Mô tả series phải có ít nhất 10 ký tự"],
      maxlength: [2000, "Mô tả series không được vượt quá 2000 ký tự"],
    },
    genre: {
      type: String,
      trim: true,
      minlength: [2, "Thể loại phải có ít nhất 2 ký tự"],
      maxlength: [100, "Thể loại không được vượt quá 100 ký tự"],
    },
    target_audience: {
      type: String,
      trim: true,
      minlength: [2, "Đối tượng mục tiêu phải có ít nhất 2 ký tự"],
      maxlength: [100, "Đối tượng mục tiêu không được vượt quá 100 ký tự"],
    },
    author_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    editor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
);

module.exports = mongoose.model("Series", seriesSchema);