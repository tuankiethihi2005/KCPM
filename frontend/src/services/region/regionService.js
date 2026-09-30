import { apiFetch } from "../apiClient";

export const getRegionsByPage = async (pageId) => {
  try {
    return await apiFetch(`/regions/page/${pageId}`);
  } catch (error) {
    return {
      success: false,
      status: error.status,
      message: error.message || "Không thể tải danh sách phân vùng.",
    };
  }
};

export const createRegion = async (pageId, regionData) => {
  try {
    return await apiFetch(`/regions/page/${pageId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(regionData),
    });
  } catch (error) {
    return {
      success: false,
      status: error.status,
      message: error.message || "Không thể tạo phân vùng mới.",
    };
  }
};

export const deleteRegion = async (regionId) => {
  try {
    return await apiFetch(`/regions/${regionId}`, {
      method: "DELETE",
    });
  } catch (error) {
    return {
      success: false,
      status: error.status,
      message: error.message || "Không thể xóa phân vùng.",
    };
  }
};
