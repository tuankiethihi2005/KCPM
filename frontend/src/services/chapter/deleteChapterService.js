import { apiFetch } from "../apiClient";

const deleteChapter = async (chapterId) => {
  try {
    return await apiFetch(`/chapters/${chapterId}`, {
      method: "DELETE",
    });
  } catch (error) {
    return {
      success: false,
      status: error.status,
      message: error.message || "Hủy chương truyện thất bại.",
    };
  }
};

export default deleteChapter;
