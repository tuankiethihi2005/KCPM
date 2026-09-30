import { apiFetch } from "../apiClient";

const getSeriesById = async (seriesId) => {
  try {
    return await apiFetch(`/series/${seriesId}`);
  } catch (error) {
    return {
      success: false,
      status: error.status,
      message: error.message || "Khong the tai chi tiet series.",
    };
  }
};

export default getSeriesById;
