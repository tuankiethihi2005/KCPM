import { apiFetch } from "./apiClient";

export const getDashboardStatsApi = async () => {
  try {
    return await apiFetch("/admin/dashboard-stats");
  } catch (error) {
    return {
      success: false,
      status: error.status,
      message: error.message || "Không thể tải dữ liệu dashboard.",
    };
  }
};
