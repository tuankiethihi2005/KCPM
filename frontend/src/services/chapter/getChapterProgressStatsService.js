import { apiFetch } from "../apiClient";

const getChapterProgressStats = async (chapterId) => {
  try {
    return await apiFetch(`/chapters/${chapterId}/progress-stats`);
  } catch (error) {
    return {
      success: false,
      status: error.status,
      message: error.message || "Khong the tai thong ke tien do chapter.",
    };
  }
};

export default getChapterProgressStats;
