const Series = require("../../models/SeriesModel");
const SeriesProposal = require("../../models/SeriesProposalModel");
const {
  ensureReviewDeadline,
} = require("../../services/proposalReviewService");

exports.getSeriesById = async (req, res) => {
  try {
    const { id } = req.params;
    const series = await Series.findById(id);

    if (!series) {
      return res.status(404).json({ message: "Không tìm thấy series" });
    }

    const proposal = await SeriesProposal.findOne({ series_id: id }).sort({
      createdAt: -1,
    });

    if (proposal) {
      await ensureReviewDeadline(proposal);
    }

    res.status(200).json({ series, proposal });
  } catch (err) {
    res.status(500).json({ error: "Lỗi server", details: err.message });
  }
};
