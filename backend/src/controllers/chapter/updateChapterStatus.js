const Chapter = require("../../models/ChapterModel");

exports.updateChapterStatus = async (req, res) => {
  try {
    const { chapter_id } = req.params;
    const { status } = req.body;

    // Kiểm tra trạng thái gửi lên có hợp lệ với Enum trong Model không
    const validStatuses = [
      "Draft",
      "In Production",
      "Waiting Review",
      "Approved",
      "Published",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Trạng thái không hợp lệ" });
    }

    const updatedChapter = await Chapter.findByIdAndUpdate(
      chapter_id,
      { status: status },
      { new: true }, // Trả về document sau khi đã update
    );

    if (!updatedChapter) {
      return res.status(404).json({ message: "Không tìm thấy chapter" });
    }

    res.status(200).json({
      message: "Cập nhật trạng thái chapter thành công",
      chapter: updatedChapter,
    });
  } catch (err) {
    res.status(500).json({ error: "Lỗi server", details: err.message });
  }
};
