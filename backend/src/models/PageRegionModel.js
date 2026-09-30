const mongoose = require("mongoose");

const pageRegionSchema = new mongoose.Schema(
  {
    page_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Page",
      required: true,
    },
    coordinates: {
      type: String,
      required: true,
    }, // Lưu tọa độ vùng được khoanh (có thể là chuỗi JSON chứa tọa độ x, y)
    region_type: {
      type: String,
      required: true,
    }, // Loại vùng: ví dụ 'panel', 'background', 'sfx', 'speech_bubble'...
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    }, // ID của người khoanh vùng (thường là Mangaka)
  },
  { timestamps: true },
);

module.exports = mongoose.model("PageRegion", pageRegionSchema);
