import { apiFetch } from "../apiClient";

const finalizeSeries = async (seriesId, { approved_schedule } = {}) => {
  try {
    return await apiFetch(`/board/series/${seriesId}/finalize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved_schedule }),
    });
  } catch (error) {
    return {
      success: false,
      status: error.status,
      message: error.message || "Tong hop ket qua that bai.",
    };
  }
};

export default finalizeSeries;
