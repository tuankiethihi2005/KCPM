const Chapter = require("../../models/ChapterModel");

exports.getChapterById = async (req, res) => {
  try {
    const chapter =
      req.authz && req.authz.chapter
        ? req.authz.chapter
        : await Chapter.findById(req.params.chapter_id);

    if (!chapter) {
      return res.status(404).json({ message: "Không tìm thấy chapter" });
    }

    return res.status(200).json({ chapter });
  } catch (err) {
    return res.status(500).json({ error: "Lỗi server", details: err.message });
  }
};
