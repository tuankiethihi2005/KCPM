const mongoose = require("mongoose");

const taskSubmissionSchema = new mongoose.Schema(
  {
    task_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },
    submitted_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Tài khoản Assistant nộp bài
      required: true,
    },
    file_url: {
      type: String,
      required: true,
    }, // URL file kết quả upload lên (ví dụ: Cloudinary)
    primary_preview_url: {
      type: String,
    }, // URL ảnh preview chính (ví dụ: Cloudinary)
    note: {
      type: String,
    }, // Ghi chú của Assistant gửi kèm lúc nộp bài
    status: {
      type: String,
      enum: ["Submitted", "Approved", "Revision Requested", "Rejected"],
      default: "Submitted",
    },
    submitted_at: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("TaskSubmission", taskSubmissionSchema);
