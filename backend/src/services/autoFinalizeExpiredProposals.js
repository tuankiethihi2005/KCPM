const SeriesProposal = require("../models/SeriesProposalModel");
const BoardVote = require("../models/BoardVoteModel");
const {
  PENDING_PROPOSAL_STATUSES,
  DEFAULT_APPROVED_SCHEDULE,
} = require("../constants/boardReview");
const {
  finalizeSeriesById,
  markNeedRevisionNoVotes,
} = require("./boardFinalizeService");

exports.autoFinalizeExpiredProposals = async () => {
  const now = new Date();
  const expiredProposals = await SeriesProposal.find({
    status: { $in: PENDING_PROPOSAL_STATUSES },
    review_deadline: { $ne: null, $lte: now },
  });

  const results = [];

  for (const proposal of expiredProposals) {
    const seriesId = proposal.series_id;
    const voteCount = await BoardVote.countDocuments({
      series_id: seriesId,
      vote_context: "initial_review",
    });

    try {
      if (voteCount > 0) {
        const finalized = await finalizeSeriesById(seriesId, {
          approved_schedule: DEFAULT_APPROVED_SCHEDULE,
        });
        results.push({
          series_id: seriesId,
          action: "finalized",
          decision: finalized.decision,
        });
      } else {
        await markNeedRevisionNoVotes(seriesId);
        results.push({
          series_id: seriesId,
          action: "need_revision_no_votes",
        });
      }
    } catch (error) {
      results.push({
        series_id: seriesId,
        action: "error",
        message: error.message,
      });
    }
  }

  return results;
};
