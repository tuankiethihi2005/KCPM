const Series = require("../../models/SeriesModel");
const User = require("../../models/UserModel");
const { ROLES } = require("../../constants/roles");
const NotificationService = require("../../services/notificationService");

/**
 * Assign Editor to Series
 *
 * Cho phép Admin / Editorial Board gán Tantou Editor vào series.
 * Không bị ràng buộc bởi proposal status (khác với updateSeries).
 *
 * PATCH /api/series/:id/assign-editor
 *
 * Body:
 *  - editor_id {string} ObjectId của Tantou Editor (hoặc null để xoá)
 */
exports.assignEditor = async (req, res) => {
  try {
    const { id } = req.params;
    const { editor_id } = req.body;

    const series = await Series.findById(id);
    if (!series) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy series",
      });
    }

    // Nếu editor_id được cung cấp, kiểm tra user có tồn tại và đúng role không
    if (editor_id) {
      const editor = await User.findById(editor_id);
      if (!editor) {
        return res.status(400).json({
          success: false,
          message: "Không tìm thấy người dùng với editor_id đã cung cấp",
        });
      }
      if (editor.role !== ROLES.TANTOU_EDITOR) {
        return res.status(400).json({
          success: false,
          message: `Người dùng "${editor.name}" có role "${editor.role}", không phải Tantou Editor`,
        });
      }
    }

    const oldEditorId = series.editor_id;
    series.editor_id = editor_id || null;
    await series.save();

    // Gửi thông báo cho editor mới
    if (editor_id) {
      await NotificationService.createNotification({
        user_id: editor_id,
        type: "System",
        title: "Bạn được phân công series mới",
        message: `Bạn được phân công phụ trách series "${series.title}".`,
        target_type: "Series",
        target_id: series._id,
      });
    }

    // Gửi thông báo cho editor cũ (nếu có)
    if (oldEditorId && String(oldEditorId) !== String(editor_id)) {
      await NotificationService.createNotification({
        user_id: oldEditorId,
        type: "System",
        title: "Thay đổi phân công series",
        message: `Bạn đã được bỏ phân công khỏi series "${series.title}".`,
        target_type: "Series",
        target_id: series._id,
      });
    }

    return res.status(200).json({
      success: true,
      message: editor_id
        ? "Đã phân công editor cho series thành công"
        : "Đã bỏ phân công editor khỏi series",
      series,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: "Lỗi server",
      details: err.message,
    });
  }
};
