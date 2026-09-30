import { apiFetch } from "../apiClient";

const getChapterById = async (chapterId) => {
  try {
    return await apiFetch(`/chapters/${chapterId}`);
  } catch (error) {
    return {
      success: false,
      status: error.status,
      message: error.message || "Khong the tai thong tin chapter.",
    };
  }
};

export default getChapterById;
