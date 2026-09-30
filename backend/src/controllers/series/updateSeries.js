const Series = require("../../models/SeriesModel");
const SeriesProposal = require("../../models/SeriesProposalModel");

const EDITABLE_STATUSES = ["Draft", "Need Revision"];

exports.updateSeries = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, genre, target_audience, editor_id } = req.body;

    const series = await Series.findById(id);
    if (!series) {
      return res.status(404).json({ message: "Không tìm thấy series" });
    }

    // Chỉ cho sửa khi proposal còn ở trạng thái nháp/cần sửa hoặc chưa có proposal.
    const proposal = await SeriesProposal.findOne({ series_id: id }).sort({
      createdAt: -1,
    });
    if (proposal && !EDITABLE_STATUSES.includes(proposal.status)) {
      return res.status(400).json({
        message: `Không thể sửa thông tin series khi proposal ở trạng thái ${proposal.status}`,
      });
    }

    if (title !== undefined) {
      if (!title) {
        return res.status(400).json({ message: "title không được rỗng" });
      }
      series.title = title;
    }
    if (description !== undefined) series.description = description;
    if (genre !== undefined) series.genre = genre;
    if (target_audience !== undefined) series.target_audience = target_audience;
    if (editor_id !== undefined) series.editor_id = editor_id || null;

    await series.save();

    return res.status(200).json({
      message: "Cập nhật series thành công",
      series,
    });
  } catch (err) {
    return res.status(500).json({ error: "Lỗi server", details: err.message });
  }
};
