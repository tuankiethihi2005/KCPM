const Series = require("../../models/SeriesModel");
const SeriesProposal = require("../../models/SeriesProposalModel");
const BoardVote = require("../../models/BoardVoteModel");

const INITIAL_VOTES = ["Approve", "Reject", "Need Revision"];

exports.castVote = async (req, res) => {
  try {
    const { id } = req.params;
    const { vote, comment } = req.body;
    const boardMemberId = req.user.id;

    if (!vote) {
      return res.status(400).json({ message: "vote là bắt buộc" });
    }

    if (!INITIAL_VOTES.includes(vote)) {
      return res.status(400).json({
        message: `vote phải là: ${INITIAL_VOTES.join(", ")}`,
      });
    }

    const series = await Series.findById(id);
    if (!series) {
      return res.status(404).json({ message: "Không tìm thấy series" });
    }

    const proposal = await SeriesProposal.findOne({ series_id: id }).sort({
      createdAt: -1,
    });

    if (!proposal || !["Submitted", "Under Review"].includes(proposal.status)) {
      return res.status(400).json({
        message: "Series không ở trạng thái chờ duyệt",
      });
    }

    const existingVote = await BoardVote.findOne({
      series_id: id,
      board_member_id: boardMemberId,
      vote_context: "initial_review",
    });

    if (existingVote) {
      existingVote.vote = vote;
      existingVote.comment = comment;
      await existingVote.save();
      return res.status(200).json({
        message: "Cập nhật phiếu bầu thành công",
        vote: existingVote,
      });
    }

    const boardVote = await BoardVote.create({
      series_id: id,
      board_member_id: boardMemberId,
      vote,
      comment,
      vote_context: "initial_review",
    });

    if (proposal.status === "Submitted") {
      proposal.status = "Under Review";
      await proposal.save();
    }

    return res.status(201).json({
      message: "Bỏ phiếu thành công",
      vote: boardVote,
    });
  } catch (err) {
    return res.status(500).json({ error: "Lỗi server", details: err.message });
  }
};
