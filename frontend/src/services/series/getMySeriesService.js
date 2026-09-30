import { apiFetch } from "../apiClient";

const getMySeries = async (authorId = null) => {
  try {
    const path = authorId ? `/series/mine/${authorId}` : "/series/mine";
    return await apiFetch(path);
  } catch (error) {
    return {
      success: false,
      status: error.status,
      message: error.message || "Khong the tai danh sach series.",
    };
  }
};

export default getMySeries;
