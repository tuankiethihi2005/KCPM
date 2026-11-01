const Chapter = require("../../models/ChapterModel");
const Series = require("../../models/SeriesModel");
const {
  canAccessSeries,
} = require("../../modules/authorization/middlewares/scope");
const NotificationService = require("../../services/notificationService");

exports.Chapter = async (req, res) => {
  try {
    const { series_id, chapter_number, title, deadline } = req.body;
    const series = await Series.findById(series_id);

    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({
        message: "Tiêu đề chapter không được để trống",
        success: false,
      })
    }

    const trimmedTitle = title.trim();
    if (trimmedTitle.length < 2 || trimmedTitle.length > 255) {
      return res.status(400).json({
        success: false,
        message: "Tiêu đề chapter phải có độ dài từ 2 đến 255 ký tự",
      });
    }

    if (!series) {
      return res.status(404).json({ message: "Không tìm thấy series" });
    }

    if (!canAccessSeries(req.user, series, "write")) {
      return res.status(403).json({
        error: {
          code: "AUTHZ_SCOPE_DENIED",
          message: "You do not have access to this series.",
        },
      });
    }

    const newChapter = new Chapter({
      series_id,
      chapter_number,
      title: trimmedTitle,
      deadline,
    });

    await newChapter.save();

    // Notify the series author and editor about new chapter
    const notifyUsers = [series.author_id];
    if (series.editor_id) notifyUsers.push(series.editor_id);
    for (const userId of notifyUsers) {
      await NotificationService.createNotification({
        user_id: userId,
        type: "Task_Update",
        title: "Chapter mới được tạo",
        message: `Chapter ${chapter_number}: "${title}" vừa được tạo cho series "${series.title}".`,
        target_type: "Chapter",
        target_id: series_id,
      });
    }

    return res.status(201).json({
      message: "Tạo chapter thành công",
      chapter: newChapter,
      success: true,
    });
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: err.message,
        details: err.message,
      });
    }
    return res.status(500).json({ error: "Lỗi server", details: err.message });
  }
};
