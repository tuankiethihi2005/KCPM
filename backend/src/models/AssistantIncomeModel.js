const mongoose = require("mongoose");

const assistantIncomeSchema = new mongoose.Schema(
  {
    assistant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    task_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    }, // Số tiền kiếm được từ task này
    month: {
      type: String,
      required: true,
    }, // Tháng ghi nhận thu nhập (ví dụ: '2024-05')
    status: {
      type: String,
      enum: ["Pending", "Approved", "Paid", "Cancelled"],
      default: "Pending",
    }, // Trạng thái thanh toán
  },
  { timestamps: true },
);

module.exports = mongoose.model("AssistantIncome", assistantIncomeSchema);
