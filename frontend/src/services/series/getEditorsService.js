import { apiFetch } from "../apiClient";

const getEditors = async () => {
  try {
    return await apiFetch("/series/editors");
  } catch (error) {
    return {
      success: false,
      status: error.status,
      message: error.message || "Khong the tai danh sach Tantou Editor.",
    };
  }
};

export default getEditors;
