import { apiFetch } from "../apiClient";

const getPendingSeries = async () => {
  try {
    return await apiFetch("/board/series/pending");
  } catch (error) {
    return {
      success: false,
      status: error.status,
      message: error.message || "Khong the tai danh sach cho duyet.",
    };
  }
};

export default getPendingSeries;
