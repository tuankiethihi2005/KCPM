const mongoose = require("mongoose");

const rankingSchema = new mongoose.Schema(
  {
    release_issue_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ReleaseIssue",
      required: true,
    },
    series_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Series",
      required: true,
    },
    rank: {
      type: Number,
      required: true,
    }, // Hạng hiện tại trong kỳ
    previous_rank: {
      type: Number,
    }, // Hạng của kỳ trước đó (nếu có)
    score: {
      type: Number,
      default: 0,
    }, // Điểm xếp hạng tổng hợp
    trend: {
      type: String,
      enum: ["UP", "DOWN", "STABLE", "NEW"],
      default: "NEW",
    }, // Xu hướng so với kỳ trước
    cancellationWarning: {
      type: Boolean,
      default: false,
    }, // Cảnh báo nguy cơ hủy/giam hang
  },
  { timestamps: true },
);

module.exports = mongoose.model("Ranking", rankingSchema);
