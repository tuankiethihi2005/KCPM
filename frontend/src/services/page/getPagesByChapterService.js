import { apiFetch } from "../apiClient";

const getPagesByChapter = async (chapterId) => {
  try {
    return await apiFetch(`/pages/chapter/${chapterId}`, {
      method: "GET",
    });
  } catch (error) {
    return {
      success: false,
      status: error.status,
      message: error.message || "Khong the tai danh sach trang.",
    };
  }
};

export default getPagesByChapter;
