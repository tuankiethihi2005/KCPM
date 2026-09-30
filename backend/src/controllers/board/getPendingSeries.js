const Series = require("../../models/SeriesModel");
const SeriesProposal = require("../../models/SeriesProposalModel");
const {
  autoFinalizeExpiredProposals,
} = require("../../services/autoFinalizeExpiredProposals");
const {
  ensureReviewDeadline,
} = require("../../services/proposalReviewService");

exports.getPendingSeries = async (req, res) => {
  try {
    await autoFinalizeExpiredProposals();

    const proposals = await SeriesProposal.find({
      status: { $in: ["Submitted", "Under Review"] },
    }).sort({ submitted_at: -1 });

    const result = await Promise.all(
      proposals.map(async (proposal) => {
        await ensureReviewDeadline(proposal);
        const series = await Series.findById(proposal.series_id).populate(
          "author_id",
          "name email",
        );
        return { series, proposal };
      }),
    );

    return res.status(200).json({ pending: result, count: result.length });
  } catch (err) {
    return res.status(500).json({ error: "Lỗi server", details: err.message });
  }
};
