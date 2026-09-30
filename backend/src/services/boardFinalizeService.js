const Series = require("../models/SeriesModel");
const SeriesProposal = require("../models/SeriesProposalModel");
const BoardVote = require("../models/BoardVoteModel");
const NotificationService = require("../services/notificationService");
const {
  DEFAULT_APPROVED_SCHEDULE,
  PENDING_PROPOSAL_STATUSES,
  SCHEDULE_VALUES,
} = require("../constants/boardReview");

const computeDecision = (tally) => {
  if (tally.Approve > tally.Reject && tally.Approve > tally["Need Revision"]) {
    return "Approve";
  }
  if (tally.Reject >= tally.Approve && tally.Reject >= tally["Need Revision"]) {
    return "Reject";
  }
  return "Need Revision";
};

const applyFinalizeDecision = async ({
  series,
  proposal,
  decision,
  approved_schedule,
}) => {
  if (decision === "Approve") {
    const schedule = approved_schedule || DEFAULT_APPROVED_SCHEDULE;
    if (!SCHEDULE_VALUES.includes(schedule)) {
      const error = new Error(
        `Approve cần approved_schedule: ${SCHEDULE_VALUES.join(", ")}`,
      );
      error.status = 400;
      throw error;
    }
    proposal.status = "Approved";
    series.status = "Active";
    series.approved_schedule = schedule;
  } else if (decision === "Reject") {
    proposal.status = "Rejected";
    series.status = "Draft";
  } else if (decision === "Need Revision") {
    proposal.status = "Need Revision";
  } else {
    const error = new Error("Quyết định vote không hợp lệ");
    error.status = 400;
    throw error;
  }

  await proposal.save();
  await series.save();

  const decisionLabels = {
    Approve: "Đã được duyệt",
    Reject: "Đã bị từ chối",
    "Need Revision": "Cần chỉnh sửa lại",
  };

  await NotificationService.createNotification({
    user_id: series.author_id,
    type: "System",
    title: `Kết quả duyệt series: ${decisionLabels[decision] || decision}`,
    message: `Series "${series.title}" đã có kết quả duyệt: ${decisionLabels[decision] || decision}.`,
    target_type: "Series",
    target_id: series._id,
  });

  return { decision, series, proposal };
};

exports.finalizeSeriesById = async (
  seriesId,
  { approved_schedule = DEFAULT_APPROVED_SCHEDULE } = {},
) => {
  const series = await Series.findById(seriesId);
  if (!series) {
    const error = new Error("Không tìm thấy series");
    error.status = 404;
    throw error;
  }

  const proposal = await SeriesProposal.findOne({ series_id: seriesId }).sort({
    createdAt: -1,
  });
  if (!proposal) {
    const error = new Error("Không tìm thấy proposal");
    error.status = 404;
    throw error;
  }

  if (!PENDING_PROPOSAL_STATUSES.includes(proposal.status)) {
    const error = new Error("Proposal đã được xử lý");
    error.status = 400;
    throw error;
  }

  const votes = await BoardVote.find({
    series_id: seriesId,
    vote_context: "initial_review",
  }).sort({ createdAt: 1 });

  if (votes.length === 0) {
    const error = new Error("Chưa có phiếu bầu nào");
    error.status = 400;
    throw error;
  }

  const tally = { Approve: 0, Reject: 0, "Need Revision": 0 };
  votes.forEach((vote) => {
    if (tally[vote.vote] !== undefined) {
      tally[vote.vote] += 1;
    }
  });

  const decision = computeDecision(tally);
  const result = await applyFinalizeDecision({
    series,
    proposal,
    decision,
    approved_schedule,
  });

  return { ...result, tally, votes };
};

exports.markNeedRevisionNoVotes = async (seriesId) => {
  const series = await Series.findById(seriesId);
  if (!series) return null;

  const proposal = await SeriesProposal.findOne({ series_id: seriesId }).sort({
    createdAt: -1,
  });
  if (!proposal) return null;

  if (!PENDING_PROPOSAL_STATUSES.includes(proposal.status)) {
    return null;
  }

  proposal.status = "Need Revision";
  await proposal.save();

  await NotificationService.createNotification({
    user_id: series.author_id,
    type: "System",
    title: "Hết hạn xét duyệt series",
    message: `Series "${series.title}" hết hạn xét duyệt mà chưa có phiếu. Vui lòng chỉnh sửa và nộp lại.`,
    target_type: "Series",
    target_id: series._id,
  });

  return { series, proposal };
};
