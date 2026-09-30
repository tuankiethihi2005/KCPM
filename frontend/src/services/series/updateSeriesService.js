import { apiFetch } from "../apiClient";

const updateSeries = async (seriesId, data) => {
  try {
    return await apiFetch(`/series/${seriesId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch (error) {
    return {
      success: false,
      status: error.status,
      message: error.message || "Cap nhat series that bai.",
    };
  }
};

export default updateSeries;
