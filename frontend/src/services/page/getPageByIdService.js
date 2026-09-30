import { apiFetch } from "../apiClient";

const getPageById = async (pageId) => {
  try {
    return await apiFetch(`/pages/${pageId}`);
  } catch (error) {
    return {
      success: false,
      status: error.status,
      message: error.message || "Không thể tải thông tin trang truyện.",
    };
  }
};

export default getPageById;
