const Series = require("../../models/SeriesModel");
const SeriesProposal = require("../../models/SeriesProposalModel");

const EDITABLE_STATUSES = ["Draft", "Need Revision"];

exports.upsertProposal = async (req, res) => {
  try {
    const { id } = req.params;
    const { summary, characters, art_style } = req.body;

    const series = await Series.findById(id);
    if (!series) {
      return res.status(404).json({ message: "Không tìm thấy series" });
    }

    let proposal = await SeriesProposal.findOne({ series_id: id }).sort({
      createdAt: -1,
    });

    if (proposal && !EDITABLE_STATUSES.includes(proposal.status)) {
      return res.status(400).json({
        message: `Không thể sửa proposal ở trạng thái ${proposal.status}`,
      });
    }

    if (!summary) {
      return res.status(400).json({ message: "summary là bắt buộc" });
    }

    if (proposal) {
      proposal.summary = summary;
      proposal.characters = characters;
      proposal.art_style = art_style;
      if (proposal.status === "Need Revision") {
        proposal.status = "Draft";
      }
      await proposal.save();
    } else {
      proposal = await SeriesProposal.create({
        series_id: id,
        summary,
        characters,
        art_style,
        status: "Draft",
      });
    }

    res.status(200).json({ message: "Lưu proposal thành công", proposal });
  } catch (err) {
    res.status(500).json({ error: "Lỗi server", details: err.message });
  }
};
