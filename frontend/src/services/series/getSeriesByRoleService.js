import { apiFetch } from "../apiClient";

// Tantou Editor: lấy series mình phụ trách (theo editor_id)
export const getEditorSeries = async () => {
  try {
    return await apiFetch("/series/editor");
  } catch (error) {
    return {
      success: false,
      status: error.status,
      message: error.message || "Khong the tai danh sach series.",
    };
  }
};

// Editorial Board: lấy tất cả series
export const getAllSeries = async () => {
  try {
    return await apiFetch("/series/all");
  } catch (error) {
    return {
      success: false,
      status: error.status,
      message: error.message || "Khong the tai danh sach series.",
    };
  }
};

// Assistant: lấy series gián tiếp qua task được giao
export const getAssistantSeries = async () => {
  try {
    return await apiFetch("/series/assistant");
  } catch (error) {
    return {
      success: false,
      status: error.status,
      message: error.message || "Khong the tai danh sach series.",
    };
  }
};
