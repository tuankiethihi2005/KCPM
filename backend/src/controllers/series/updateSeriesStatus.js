const Series = require("../../models/SeriesModel");
const NotificationService = require("../../services/notificationService");

const ALLOWED_STATUSES = [
  "Active",
  "At Risk",
  "Hiatus",
  "Cancelled",
  "Completed",
  "Changed Schedule",
];

const SCHEDULE_VALUES = ["weekly", "monthly", "one-shot", "online only", "none"];
const RISK_VALUES = ["Safe", "Warning", "Critical"];

exports.updateSeriesStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, approved_schedule, risk_status } = req.body;

    if (!status || !ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        message: `status phải là một trong: ${ALLOWED_STATUSES.join(", ")}`,
      });
    }

    const series = await Series.findById(id);
    if (!series) {
      return res.status(404).json({ message: "Không tìm thấy series" });
    }

    series.status = status;

    if (approved_schedule !== undefined) {
      if (!SCHEDULE_VALUES.includes(approved_schedule)) {
        return res.status(400).json({
          message: `approved_schedule không hợp lệ`,
        });
      }
      series.approved_schedule = approved_schedule;
    }

    if (risk_status !== undefined) {
      if (!RISK_VALUES.includes(risk_status)) {
        return res.status(400).json({
          message: `risk_status phải là một trong: ${RISK_VALUES.join(", ")}`,
        });
      }
      series.risk_status = risk_status;
    }

    await series.save();

    // Notify the mangaka about the status change
    const statusLabels = {
      "Active": "Đang hoạt động",
      "At Risk": "Có nguy cơ",
      "Hiatus": "Tạm ngưng",
      "Cancelled": "Đã hủy",
      "Completed": "Hoàn thành",
      "Changed Schedule": "Đổi lịch",
    };
    await NotificationService.createNotification({
      user_id: series.author_id,
      type: "System",
      title: "Trạng thái series đã thay đổi",
      message: `Series "${series.title}" đã được cập nhật trạng thái thành "${statusLabels[status] || status}".`,
      target_type: "Series",
      target_id: series._id,
    });

    res.status(200).json({
      message: "Cập nhật trạng thái series thành công",
      series,
    });
  } catch (err) {
    res.status(500).json({ error: "Lỗi server", details: err.message });
  }
};
