const Chapter = require("../../models/ChapterModel");

exports.getChaptersBySeries = async (req, res) => {
  try {
    const { series_id } = req.params;
    const chapters = await Chapter.find({ series_id }).sort({
      chapter_number: 1,
    });

    res.status(200).json({ chapters });
  } catch (err) {
    res.status(500).json({ error: "Lỗi server", details: err.message });
  }
};
