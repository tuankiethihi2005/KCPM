import { apiFetch } from "../apiClient";

const getBoardSeriesDetail = async (seriesId) => {
  try {
    return await apiFetch(`/board/series/${seriesId}`);
  } catch (error) {
    return {
      success: false,
      status: error.status,
      message: error.message || "Khong the tai chi tiet ho so.",
    };
  }
};

export default getBoardSeriesDetail;
