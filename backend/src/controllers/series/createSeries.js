const Series = require("../../models/SeriesModel");
const SeriesProposal = require("../../models/SeriesProposalModel");
const { ROLES } = require("../../constants/roles");
const User = require("../../models/UserModel");
const NotificationService = require("../../services/notificationService");

exports.createSeries = async (req, res) => {
  try {
    const {
      title,
      description,
      genre,
      target_audience,
      author_id,
      editor_id,
      summary,
      characters,
      art_style,
    } = req.body;

    if (!title) {
      return res.status(400).json({ message: "title là bắt buộc" });
    }

    const resolvedAuthorId =
      req.user.role === ROLES.ADMIN ? author_id || req.user.id : req.user.id;

    if (!resolvedAuthorId) {
      return res.status(400).json({ message: "author_id là bắt buộc" });
    }

    const series = await Series.create({
      title,
      description,
      genre,
      target_audience,
      author_id: resolvedAuthorId,
      editor_id: editor_id || null,
      status: "Draft",
    });

    if (summary) {
      await SeriesProposal.create({
        series_id: series._id,
        summary,
        characters,
        art_style,
        status: "Draft",
      });
    }

    const proposal = await SeriesProposal.findOne({ series_id: series._id }).sort({
      createdAt: -1,
    });

    // Notify the author about successful creation
    await NotificationService.createNotification({
      user_id: resolvedAuthorId,
      type: "System",
      title: "Series mới được tạo thành công",
      message: `Series "${title}" đã được tạo thành công.`,
      target_type: "Series",
      target_id: series._id,
    });

    // Notify the editor if assigned
    if (editor_id) {
      await NotificationService.createNotification({
        user_id: editor_id,
        type: "System",
        title: "Bạn được phân công series mới",
        message: `Bạn được phân công phụ trách series "${title}".`,
        target_type: "Series",
        target_id: series._id,
      });
    }

    return res.status(201).json({
      message: "Tạo series thành công",
      series,
      proposal,
    });
  } catch (err) {
    return res.status(500).json({ error: "Lỗi server", details: err.message });
  }
};
