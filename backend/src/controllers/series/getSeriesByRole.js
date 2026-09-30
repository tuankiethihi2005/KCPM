const Series = require("../../models/SeriesModel");
const Chapter = require("../../models/ChapterModel");
const Page = require("../../models/PageModel");
const Task = require("../../models/TaskModel");
const attachProposals = require("./attachProposals");

// Tantou Editor: lấy các series mình phụ trách (theo editor_id)
exports.getEditorSeries = async (req, res) => {
  try {
    const seriesList = await Series.find({ editor_id: req.user.id })
      .populate("author_id", "name email")
      .populate("editor_id", "name email")
      .sort({
        createdAt: -1,
      });

    const result = await attachProposals(seriesList);

    return res.status(200).json({ series: result });
  } catch (err) {
    return res.status(500).json({ error: "Lỗi server", details: err.message });
  }
};

// Editorial Board / Admin: lấy toàn bộ series trong hệ thống
exports.getAllSeries = async (req, res) => {
  try {
    const seriesList = await Series.find()
      .populate("author_id", "name email")
      .sort({ createdAt: -1 });

    const result = await attachProposals(seriesList);

    return res.status(200).json({ series: result, success: true });
  } catch (err) {
    return res.status(500).json({ error: "Lỗi server", details: err.message });
  }
};

// Assistant: lấy series gián tiếp qua task được giao
// Task.assigned_to -> Page -> Chapter -> Series
exports.getAssistantSeries = async (req, res) => {
  try {
    const tasks = await Task.find({ assigned_to: req.user.id }).select(
      "page_id",
    );
    const pageIds = tasks.map((task) => task.page_id);

    if (pageIds.length === 0) {
      return res.status(200).json({ series: [] });
    }

    const pages = await Page.find({ _id: { $in: pageIds } }).select(
      "chapter_id",
    );
    const chapterIds = pages.map((page) => page.chapter_id);

    const chapters = await Chapter.find({ _id: { $in: chapterIds } }).select(
      "series_id",
    );
    const seriesIds = [
      ...new Set(chapters.map((chapter) => String(chapter.series_id))),
    ];

    const seriesList = await Series.find({ _id: { $in: seriesIds } }).sort({
      createdAt: -1,
    });

    const result = await attachProposals(seriesList);

    return res.status(200).json({ series: result });
  } catch (err) {
    return res.status(500).json({ error: "Lỗi server", details: err.message });
  }
};
