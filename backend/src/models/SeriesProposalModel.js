const mongoose = require("mongoose");

const seriesProposalSchema = new mongoose.Schema(
  {
    series_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Series",
      required: true,
    },
    summary: {
      type: String,
      required: [true, "Vui lòng nhập summary"],
      minlength: [20, "Summary phải có ít nhất 20 ký tự"],
      maxlength: [2000, "Summary không được vượt quá 2000 ký tự"],
      trim: true,
    },
    characters: {
      type: String, // Mô tả thông tin các nhân vật
      maxlength: [2000, "Characters không được vượt quá 2000 ký tự"],
    },
    art_style: {
      type: String, // Mô tả phong cách hình ảnh
      maxlength: [500, "Art style không được vượt quá 500 ký tự"],
    },
    manuscript_file: {
      type: String, // URL lưu file bản thảo sơ bộ (PDF/Zip)
    },
    cover_image: {
      type: String, // URL ảnh bìa (Concept art)
    },
    status: {
      type: String,
      enum: [
        "Draft",
        "Submitted",
        "Under Review",
        "Approved",
        "Rejected",
        "Need Revision",
      ],
      default: "Draft",
    },
    submitted_at: {
      type: Date,
      default: null,
    },
    review_deadline: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
); // Tự động tạo created_at và updated_at

module.exports = mongoose.model("SeriesProposal", seriesProposalSchema);
