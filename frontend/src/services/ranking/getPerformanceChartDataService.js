import { apiFetch } from "../apiClient";

const getPerformanceChartData = async (seriesId) => {
  try {
    return await apiFetch(`/rankings/performance/${seriesId}`);
  } catch (error) {
    return {
      success: false,
      status: error.status,
      message: error.message || "Khong the tai du lieu bieu do.",
    };
  }
};

export default getPerformanceChartData;
