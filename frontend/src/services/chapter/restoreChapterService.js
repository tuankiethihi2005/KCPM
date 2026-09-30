import { apiFetch } from "../apiClient";

const restoreChapter = async (chapterId) => {
  try {
    return await apiFetch(`/chapters/restore/${chapterId}`, {
      method: "PUT", // Sử dụng phương thức PUT như đã định nghĩa ở Backend
    });
  } catch (error) {
    return {
      success: false,
      status: error.status,
      message: error.message || "Khôi phục chương truyện thất bại.",
    };
  }
};

export default restoreChapter;
