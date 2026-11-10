const SeriesProposal = require("../../models/SeriesProposalModel");
const Series = require("../../models/SeriesModel");
const BoardVote = require("../../models/BoardVoteModel");
const User = require("../../models/UserModel");
const NotificationService = require("../../services/notificationService");
const { addReviewDeadline } = require("../../constants/boardReview");

const SUBMITTABLE_STATUSES = ["Draft", "Need Revision"];
const PENDING_STATUSES = ["Submitted", "Pending", "Under Review"];

exports.submitProposal = async (req, res) => {
  try {
    const series = req.authz?.series;
    if (!series) {
      return res.status(404).json({ message: "Không tìm thấy series" });
    }
    if (series.status === "Cancelled") {
      return res.status(400).json({ message: "Series đã bị hủy, không thể nộp proposal" });
    }

    const proposalToSubmit = await SeriesProposal.findOne({
      series_id: series._id,
    }).sort({ createdAt: -1 });
    if (
      proposalToSubmit &&
      !SUBMITTABLE_STATUSES.includes(proposalToSubmit.status)
    ) {
      return res.status(400).json({
        message:
          "Không thể nộp proposal. Proposal không tồn tại hoặc đang trong quá trình xét duyệt.",
      });
    }

    const missingFields = [];
    if (!series.title?.trim()) missingFields.push("title");
    if (!series.genre?.trim()) missingFields.push("genre");
    if (!series.target_audience?.trim()) {
      missingFields.push("target_audience");
    }
    if (!proposalToSubmit?.summary?.trim()) missingFields.push("summary");

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: "Vui lòng hoàn tất các trường bắt buộc trước khi nộp proposal",
        missingFields,
      });
    }

    const seriesValidation = new Series({
      title: series.title,
      genre: series.genre,
      target_audience: series.target_audience,
      author_id: series.author_id,
    }).validateSync();
    const proposalValidation = new SeriesProposal({
      series_id: series._id,
      summary: proposalToSubmit.summary,
    }).validateSync();
    const validationErrors = [
      ...Object.values(seriesValidation?.errors || {}),
      ...Object.values(proposalValidation?.errors || {}),
    ];
    if (validationErrors.length > 0) {
      return res.status(400).json({
        message: "Dữ liệu proposal chưa hợp lệ",
        details: validationErrors.map((error) => error.message),
      });
    }

    const now = new Date();
    // Atomic findOneAndUpdate để chống race condition: chỉ cho phép chuyển sang Submitted khi trạng thái thuộc SUBMITTABLE_STATUSES
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
      { new: true, returnDocument: "after", sort: { createdAt: -1 } }
    );

    if (!proposal) {
      const existingProposal = await SeriesProposal.findOne({
        series_id: series._id,
      }).sort({ createdAt: -1 });

      if (!existingProposal) {
        return res.status(404).json({
          message: "Không tìm thấy proposal để nộp",
        });
      }

      if (PENDING_STATUSES.includes(existingProposal.status)) {
        return res.status(409).json({
          message: "Hồ sơ đang trong quá trình xét duyệt hoặc đang được xử lý",
        });
      }

      return res.status(409).json({
        message: `Hồ sơ đang ở trạng thái "${existingProposal.status}", không thể nộp proposal.`,
      });
    }

    await BoardVote.deleteMany({
      series_id: series._id,
      vote_context: "initial_review",
    });

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
