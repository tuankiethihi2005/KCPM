const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    page_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Page",
      required: true,
    },
    region_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PageRegion",
      required: true,
    },
    assigned_to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Liên kết tới tài khoản của Assistant
      required: true,
    },
    assigned_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Liên kết tới tài khoản của Mangaka
      required: true,
    },
    task_type: {
      type: String,
      required: true,
    }, // Loại công việc, ví dụ: 'Tô bóng', 'Vẽ background', 'Đi nét'...
    description: {
      type: String,
    },
    deadline: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: [
        "Assigned",
        "In Progress",
        "Submitted",
        "Approved",
        "Revision Requested",
        "Rejected",
        "Paid",
      ],
      default: "Assigned",
    },
    price: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Task", taskSchema);
