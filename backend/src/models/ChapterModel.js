const mongoose = require("mongoose");

const chapterSchema = new mongoose.Schema(
  {
    series_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Series",
      required: true,
    },
    release_issue_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ReleaseIssue", // Sẽ liên kết với bảng ReleaseIssue (Kỳ phát hành) tạo sau
    },
    chapter_number: {
      type: Number,
      required: true,
    },
    title: {
      type: String,
      required: [true, "Tiêu đề chapter là bắt buộc"],
      trim: true,
      minlength: [2, "Tiêu đề chapter phải có ít nhất 2 ký tự"],
      maxlength: [255, "Tiêu đề chapter không được vượt quá 255 ký tự"],
    },
    status: {
      type: String,
      enum: [
        "Draft",
        "In Production",
        "Waiting Review",
        "Approved",
        "Published",
      ],
      default: "Draft",
    },
    deadline: {
      type: Date,
      required: true,
    },
    published_at: {
      type: Date,
      default: null,
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
); // Tự động tạo created_at và updated_at

module.exports = mongoose.model("Chapter", chapterSchema);
