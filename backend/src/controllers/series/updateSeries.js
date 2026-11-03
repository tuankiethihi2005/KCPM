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
      const trimmedTitle = typeof title === "string" ? title.trim() : title;
      if (!trimmedTitle) {
        return res.status(400).json({ message: "title không được rỗng" });
      }

      // 🔍 BỔ SUNG LOGIC CHECK TRÙNG LẶP TIÊU ĐỀ (SCRUM-86)
      const existingSeries = await Series.findOne({
        title: trimmedTitle,
        _id: { $ne: id }, // Loại trừ chính series hiện tại ra
      });

      if (existingSeries) {
        return res.status(400).json({
          message: "Tiêu đề series này đã tồn tại, vui lòng chọn tiêu đề khác.",
        });
      }

      series.title = trimmedTitle;
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
    if (err.name === "ValidationError") {
      return res.status(400).json({
        message: "Dữ liệu Series không hợp lệ",
        details: Object.values(err.errors).map((error) => error.message),
      });
    }

    return res.status(500).json({ error: "Lỗi server", details: err.message });
  }
};