const User = require("../models/UserModel");
const Series = require("../models/SeriesModel");
const Task = require("../models/TaskModel");
const Notification = require("../models/NotificationModel");

class AdminDashboardService {
  static async getDashboardStats() {
    const [userStats, seriesStats, taskStats, atRiskSeries, recentNotifications] =
      await Promise.all([
        this._getUserStats(),
        this._getSeriesStats(),
        this._getTaskStats(),
        this._getAtRiskSeries(),
        this._getRecentNotifications(),
      ]);

    return {
      users: userStats,
      series: seriesStats,
      tasks: taskStats,
      atRiskSeries,
      recentNotifications,
    };
  }

  static async _getUserStats() {
    const [total, byRole, byStatus] = await Promise.all([
      User.countDocuments({}),
      User.aggregate([
        { $group: { _id: "$role", count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      User.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    const roleMap = {};
    byRole.forEach((r) => {
      roleMap[r._id] = r.count;
    });

    const statusMap = {};
    byStatus.forEach((s) => {
      statusMap[s._id] = s.count;
    });

    return { total, byRole: roleMap, byStatus: statusMap };
  }

  static async _getSeriesStats() {
    const [total, byStatus, byRiskStatus] = await Promise.all([
      Series.countDocuments({}),
      Series.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Series.aggregate([
        { $group: { _id: "$risk_status", count: { $sum: 1 } } },
      ]),
    ]);

    const statusMap = {};
    byStatus.forEach((s) => {
      statusMap[s._id] = s.count;
    });

    const riskMap = {};
    byRiskStatus.forEach((r) => {
      riskMap[r._id] = r.count;
    });

    return { total, byStatus: statusMap, byRiskStatus: riskMap };
  }

  static async _getTaskStats() {
    const [total, byStatus] = await Promise.all([
      Task.countDocuments({}),
      Task.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    const statusMap = {};
    byStatus.forEach((s) => {
      statusMap[s._id] = s.count;
    });

    return { total, byStatus: statusMap };
  }

  static async _getAtRiskSeries() {
    const series = await Series.find({
      risk_status: { $in: ["Warning", "Critical"] },
    })
      .select("title risk_status status")
      .sort({ risk_status: 1, updatedAt: -1 })
      .limit(10)
      .lean();

    // For each at-risk series, count overdue tasks
    const enrichedSeries = await Promise.all(
      series.map(async (s) => {
        const overdueTasks = await Task.countDocuments({
          deadline: { $lt: new Date() },
          status: { $nin: ["Approved", "Paid"] },
        });
        return { ...s, overdueTasks };
      }),
    );

    return enrichedSeries;
  }

  static async _getRecentNotifications() {
    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("user_id", "name email role")
      .lean();

    return notifications.map((n) => ({
      _id: n._id,
      type: n.type,
      title: n.title,
      message: n.message,
      is_read: n.is_read,
      createdAt: n.createdAt,
      user: n.user_id
        ? { _id: n.user_id._id, name: n.user_id.name, role: n.user_id.role }
        : null,
    }));
  }
}

module.exports = AdminDashboardService;
