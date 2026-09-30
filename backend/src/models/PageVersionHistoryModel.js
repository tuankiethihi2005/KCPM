const mongoose = require("mongoose");

const PageVersionHistorySchema = new mongoose.Schema(
  {
    page_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Page",
      required: true,
    },
    version_number: {
      type: Number,
      required: true,
    },
    preview_url: {
      type: String,
      required: true,
    },
    source_file_url: {
      type: String,
      required: true, // Lưu lại file .psd của phiên bản này
    },
    attached_resource_url: {
      type: String,
      default: null, // Lưu lại file .zip tài nguyên của phiên bản này (nếu có)
    },
    submitted_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    commit_note: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("PageVersionHistory", PageVersionHistorySchema);
