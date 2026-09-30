const mongoose = require("mongoose");

const boardVoteSchema = new mongoose.Schema(
  {
    series_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Series",
      required: true,
    },
    board_member_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    vote: {
      type: String,
      enum: [
        "Approve",
        "Reject",
        "Need Revision", // Dùng cho lúc duyệt series mới
        "Continue",
        "Cancel",
        "Hiatus",
        "Change Schedule",
        "Online Only",
        "Need Improvement Plan", // Dùng cho lúc đánh giá vòng đời (Module 13)
      ],
      required: true,
    },
    comment: {
      type: String, // Lời phê/góp ý của thành viên hội đồng
    },
    vote_context: {
      type: String,
      enum: ["initial_review", "lifecycle"],
      default: "initial_review",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("BoardVote", boardVoteSchema);
