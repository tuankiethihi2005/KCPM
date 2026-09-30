import { apiFetch } from "../apiClient";

const updateChapterStatus = async (chapterId, newStatus) => {
  try {
    return await apiFetch(`/chapters/update-status/${chapterId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
  } catch (error) {
    return {
      success: false,
      status: error.status,
      message: error.message || "Cap nhat trang thai chapter that bai.",
    };
  }
};

export default updateChapterStatus;
