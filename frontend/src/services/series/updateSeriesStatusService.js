import { apiFetch } from "../apiClient";

const updateSeriesStatus = async (seriesId, data) => {
  try {
    return await apiFetch(`/series/${seriesId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch (error) {
    return {
      success: false,
      status: error.status,
      message: error.message || "Cap nhat trang thai series that bai.",
    };
  }
};

export default updateSeriesStatus;
