import { apiFetch } from "../apiClient";

const getAtRiskSeries = async () => {
  try {
    return await apiFetch("/series/at-risk");
  } catch (error) {
    return {
      success: false,
      status: error.status,
      message: error.message || "Khong the tai danh sach series co nguy co.",
    };
  }
};

export default getAtRiskSeries;
