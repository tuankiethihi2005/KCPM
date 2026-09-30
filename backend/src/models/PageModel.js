const mongoose = require("mongoose");

const pageSchema = new mongoose.Schema(
  {
    chapter_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chapter",
      required: true,
    },
    page_number: {
      type: Number,
      required: true,
    },
    // URL ảnh phẳng (PNG/JPG) được sinh ra từ file PSD để hiển thị trên web
    current_preview_url: {
      type: String,
      required: true,
    },
    // NÚT TẢI 1: Đường link tải file bản thảo gốc .psd (Bắt buộc)
    current_source_file_url: {
      type: String,
      required: true,
    },
    // NÚT TẢI 2: Đường link tải file tài nguyên đính kèm .zip (Được phép null)
    attached_resource_url: {
      type: String,
      default: null,
    },
    current_version: {
      type: Number,
      default: 1,
    },
    status: {
      type: String,
      enum: ["Draft", "In Progress", "Ready For Review", "Submitted", "Approved", "Rejected", "Locked"],
      default: "Draft",
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

// Transform field names cho frontend dễ dùng
pageSchema.set("toJSON", {
  transform(doc, ret) {
    ret.thumbnail_url = ret.current_preview_url;
    ret.version = ret.current_version;
    ret.updated_at = ret.updatedAt;
    return ret;
  },
});

pageSchema.set("toObject", {
  transform(doc, ret) {
    ret.thumbnail_url = ret.current_preview_url;
    ret.version = ret.current_version;
    ret.updated_at = ret.updatedAt;
    return ret;
  },
});

module.exports = mongoose.model("Page", pageSchema);
