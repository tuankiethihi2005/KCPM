const SeriesProposal = require("../../models/SeriesProposalModel");

const EDITABLE_STATUSES = ["Draft", "Need Revision"];

exports.uploadCover = async (req, res) => {
  try {
    const series = req.authz?.series;
    if (!series) {
      return res.status(404).json({ message: "Không tìm thấy series" });
    }

    if (!req.file || !req.file.path) {
      return res.status(400).json({ message: "Không có file cover được upload" });
    }

    let proposal = await SeriesProposal.findOne({ series_id: series._id }).sort({
      createdAt: -1,
    });

    if (!proposal) {
      return res.status(400).json({
        message: "Cần tạo proposal trước khi upload cover",
      });
    }

    if (!EDITABLE_STATUSES.includes(proposal.status)) {
      return res.status(400).json({
        message: `Không thể upload cover khi proposal ở trạng thái ${proposal.status}`,
      });
    }

    proposal.cover_image = req.file.path;
    await proposal.save();

    return res.status(200).json({
      message: "Upload cover thành công",
      cover_image: proposal.cover_image,
      proposal,
    });
  } catch (err) {
    return res.status(500).json({ error: "Lỗi server", details: err.message });
  }
};
