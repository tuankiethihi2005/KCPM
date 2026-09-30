const Series = require("../../models/SeriesModel");
const BoardVote = require("../../models/BoardVoteModel");

const LIFECYCLE_VOTES = [
  "Continue",
  "Cancel",
  "Hiatus",
  "Change Schedule",
  "Online Only",
  "Need Improvement Plan",
];

exports.castLifecycleVote = async (req, res) => {
  try {
    const { id } = req.params;
    const { vote, comment } = req.body;
    const boardMemberId = req.user.id;

    if (!vote) {
      return res.status(400).json({ message: "vote là bắt buộc" });
    }

    if (!LIFECYCLE_VOTES.includes(vote)) {
      return res.status(400).json({
        message: `vote phải là: ${LIFECYCLE_VOTES.join(", ")}`,
      });
    }

    const series = await Series.findById(id);
    if (!series) {
      return res.status(404).json({ message: "Không tìm thấy series" });
    }

    const existingVote = await BoardVote.findOne({
      series_id: id,
      board_member_id: boardMemberId,
      vote_context: "lifecycle",
    });

    if (existingVote) {
      existingVote.vote = vote;
      existingVote.comment = comment;
      await existingVote.save();
      return res.status(200).json({
        message: "Cập nhật phiếu vòng đời thành công",
        vote: existingVote,
      });
    }

    const boardVote = await BoardVote.create({
      series_id: id,
      board_member_id: boardMemberId,
      vote,
      comment,
      vote_context: "lifecycle",
    });

    return res.status(201).json({
      message: "Bỏ phiếu vòng đời thành công",
      vote: boardVote,
    });
  } catch (err) {
    return res.status(500).json({ error: "Lỗi server", details: err.message });
  }
};

exports.getLifecycleVotes = async (req, res) => {
  try {
    const { id } = req.params;

    const series = await Series.findById(id).populate(
      "author_id",
      "name email",
    );
    if (!series) {
      return res.status(404).json({ message: "Không tìm thấy series" });
    }

    const votes = await BoardVote.find({
      series_id: id,
      vote_context: "lifecycle",
    })
      .populate("board_member_id", "name email")
      .sort({ updatedAt: -1 });

    const tally = {};
    votes.forEach((v) => {
      tally[v.vote] = (tally[v.vote] || 0) + 1;
    });

    return res.status(200).json({ series, votes, tally, count: votes.length });
  } catch (err) {
    return res.status(500).json({ error: "Lỗi server", details: err.message });
  }
};
