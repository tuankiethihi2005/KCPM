import { apiFetch } from "../apiClient";

const getPageVersions = async (pageId) => {
  try {
    return await apiFetch(`/pages/${pageId}/versions`, {
      method: "GET",
    });
  } catch (error) {
    return {
      success: false,
      status: error.status,
      message: error.message || "Lấy lịch sử phiên bản thất bại.",
    };
  }
};

export default getPageVersions;
