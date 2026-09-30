const mongoose = require("mongoose");

const releaseIssueSchema = new mongoose.Schema(
  {
    custom_id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    }, // Mã kỳ phát hành từ frontend (vd: ISSUE-2026-01)
    title: {
      type: String,
      required: true,
      trim: true,
    }, // Tên kỳ phát hành (vd: Weekly Shonen Jump Issue 12 - 2024)
    release_date: {
      type: Date,
      required: true,
    }, // Ngày phát hành chính thức
    type: {
      type: String,
      enum: ["Weekly", "Monthly", "One-shot", "Online only"],
      required: true,
    }, // Loại kỳ phát hành
    series_list: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Series",
      }
    ], // Danh sách truyện trong kỳ
    status: {
      type: String,
      enum: ["Planned", "Published", "Archived"],
      default: "Planned",
    },
  },
  { timestamps: true },
); // Tự động tạo created_at và updated_at

module.exports = mongoose.model("ReleaseIssue", releaseIssueSchema);
