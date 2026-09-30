const AdminDashboardService = require("../services/adminDashboardService");

const getDashboardStats = async (req, res) => {
  try {
    const data = await AdminDashboardService.getDashboardStats();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Không thể tải dữ liệu dashboard",
      error: error.message,
    });
  }
};

module.exports = { getDashboardStats };
