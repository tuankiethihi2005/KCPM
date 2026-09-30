const mongoose = require("mongoose");

const authSessionSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    token_hash: {
      type: String,
      required: true,
      index: true,
    },
    expires_at: {
      type: Date,
      required: true,
    },
    revoked_at: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("AuthSession", authSessionSchema);
