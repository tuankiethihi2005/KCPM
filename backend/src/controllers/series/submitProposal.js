const SeriesProposal = require("../../models/SeriesProposalModel");
const BoardVote = require("../../models/BoardVoteModel");
const User = require("../../models/UserModel");
const NotificationService = require("../../services/notificationService");
const { addReviewDeadline } = require("../../constants/boardReview");

const SUBMITTABLE_STATUSES = ["Draft", "Need Revision"];

exports.submitProposal = async (req, res) => {
  try {
    const series = req.authz?.series;
    if (!series) {
      return res.status(404).json({ message: "Không tìm thấy series" });
    }
    if (series.status === "Cancelled") {
      return res.status(400).json({ message: "Series đã bị hủy, không thể nộp proposal" });
    }

    const now = new Date();
    const proposal = await SeriesProposal.findOneAndUpdate(
      {
        series_id: series._id,
        status: { $in: SUBMITTABLE_STATUSES },
      },
      {
        $set: {
          status: "Submitted",
          submitted_at: now,
          review_deadline: addReviewDeadline(now),
        },
      },
      { new: true, sort: { createdAt: -1 } }
    );

    if (!proposal) {
      return res.status(400).json({
        message:
          "Không thể nộp proposal. Proposal không tồn tại hoặc đang trong quá trình xét duyệt.",
      });
    }

    // Notify all Editorial Board members
    const boardMembers = await User.find({ role: "Editorial Board", status: "Active" }).select("_id");
    const notifyUserIds = boardMembers.map((m) => m._id);

    // Fallback: notify Admin + Tantou Editor if no board members found
    if (notifyUserIds.length === 0) {
      const fallbackUsers = await User.find({
        role: { $in: ["Admin", "Tantou Editor"] },
        status: "Active",
      }).select("_id");
      notifyUserIds.push(...fallbackUsers.map((u) => u._id));
    }

    const notificationPromises = notifyUserIds.map((userId) =>
      NotificationService.createNotification({
        user_id: userId,
        type: "System",
        title: "Hồ sơ xét duyệt mới",
        message: `Series "${series.title}" vừa được nộp hồ sơ xét duyệt. Vui lòng vào xem và bỏ phiếu.`,
        target_type: "Series",
        target_id: series._id,
      })
    );
    await Promise.all(notificationPromises);

    return res.status(200).json({
      message: "Nộp hồ sơ xét duyệt thành công",
      proposal,
    });
  } catch (err) {
    return res.status(500).json({ error: "Lỗi server", details: err.message });
  }
};
