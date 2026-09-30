import { apiFetch } from "../apiClient";

export const getIncomeStatsApi = async () => {
  try {
    return await apiFetch("/income/my");
  } catch (error) {
    return {
      success: false,
      status: error.status,
      message: error.message || "Không thể tải báo cáo thu nhập.",
    };
  }
};
