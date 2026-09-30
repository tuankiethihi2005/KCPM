const mongoose = require("mongoose");

/**
 * AnnotationModel - Bảng lưu trữ các góp ý / chú thích biên tập
 *
 * Các trường chính theo yêu cầu:
 *  - Id          : _id (tự động do MongoDB sinh)
 *  - ChapterId   : chapter_id (ObjectId → Chapter)
 *  - PageId      : page_id   (ObjectId → Page)
 *  - X           : x         (tọa độ ngang trên ảnh trang)
 *  - Y           : y         (tọa độ dọc trên ảnh trang)
 *  - Content     : content   (nội dung góp ý)
 *  - Status      : status    (Open | In Progress | Resolved | Reopened)
 *  - Deadline    : deadline  (hạn chót xử lý góp ý)
 *  - CreatedBy   : created_by (ObjectId → User)
 *  - CreatedAt   : createdAt  (tự động do timestamps: true)
 */
const annotationSchema = new mongoose.Schema(
  {
    // --- Quan hệ ---
    chapter_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chapter",
      required: true,
    },
    page_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Page",
      required: true,
    },

    // --- Tọa độ hiển thị trên ảnh trang ---
    x: {
      type: Number,
      required: true,
      default: 0,
    },
    y: {
      type: Number,
      required: true,
      default: 0,
    },

    // --- Nội dung góp ý ---
    content: {
      type: String,
      required: true,
      trim: true,
    },

    // --- Trạng thái xử lý ---
    status: {
      type: String,
      enum: ["Open", "In Progress", "Resolved", "Reopened"],
      default: "Open",
    },

    // --- Hạn xử lý ---
    deadline: {
      type: Date,
      default: null,
    },

    // --- Người tạo ---
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // --- Trường bổ sung giữ tương thích ngược ---
    role: {
      type: String,
      default: "",
    }, // Vai trò của người tạo tại thời điểm comment (vd: 'Tantou Editor')

    region_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PageRegion",
      default: null,
    }, // Vùng cụ thể trên trang (tuỳ chọn)

    category: {
      type: String,
      default: "",
    }, // Phân loại lỗi: dialogue, drawing, layout...
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }, // Tự động tạo createdAt và updatedAt
);

annotationSchema
  .virtual("comment")
  .get(function () {
    return this.content;
  })
  .set(function (value) {
    this.content = value;
  });

annotationSchema
  .virtual("coordinates")
  .get(function () {
    return JSON.stringify({ x: this.x, y: this.y });
  })
  .set(function (value) {
    if (!value) return;
    try {
      const parsed = typeof value === "string" ? JSON.parse(value) : value;
      if (parsed.x !== undefined) this.x = Number(parsed.x);
      if (parsed.y !== undefined) this.y = Number(parsed.y);
    } catch (_) {
      const xMatch = String(value).match(/x\s*:?\s*([0-9.]+)/i);
      const yMatch = String(value).match(/y\s*:?\s*([0-9.]+)/i);
      if (xMatch) this.x = Number(xMatch[1]);
      if (yMatch) this.y = Number(yMatch[1]);
    }
  });

annotationSchema.pre("validate", async function () {
  if (!this.chapter_id && this.page_id) {
    const Page = require("./PageModel");
    const page = await Page.findById(this.page_id).select("chapter_id");
    if (page) {
      this.chapter_id = page.chapter_id;
    }
  }
});

// --- Indexes để tối ưu truy vấn ---
annotationSchema.index({ chapter_id: 1, createdAt: 1 });
annotationSchema.index({ page_id: 1, createdAt: 1 });
annotationSchema.index({ created_by: 1 });
annotationSchema.index({ status: 1 });

module.exports = mongoose.model("Annotation", annotationSchema);
