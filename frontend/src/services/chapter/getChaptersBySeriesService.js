import { apiFetch } from "../apiClient";

const getChaptersBySeries = async (seriesId) => {
  try {
    return await apiFetch(`/chapters/series/${seriesId}`);
  } catch (error) {
    return {
      success: false,
      status: error.status,
      message: error.message || "Khong the tai danh sach chapter.",
    };
  }
};

export default getChaptersBySeries;
