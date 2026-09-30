import { apiFetch } from "../apiClient";

/**
 * Lấy danh sách annotation theo trang truyện
 * @param {string} pageId
 */
export const getAnnotationsByPage = async (pageId) => {
  try {
    return await apiFetch(`/annotations/page/${pageId}`);
  } catch (error) {
    return {
      success: false,
      status: error.status,
      message: error.message || "Không thể tải danh sách góp ý.",
    };
  }
};

/**
 * Lấy danh sách annotation theo chương truyện
 * @param {string} chapterId
 */
export const getAnnotationsByChapter = async (chapterId) => {
  try {
    return await apiFetch(`/annotations/chapter/${chapterId}`);
  } catch (error) {
    return {
      success: false,
      status: error.status,
      message: error.message || "Không thể tải danh sách góp ý theo chương.",
    };
  }
};

/**
 * Tạo annotation mới
 * @param {string} pageId
 * @param {{ x: number, y: number, content: string, status?: string, deadline?: string, category?: string }} data
 */
export const createAnnotation = async (pageId, data) => {
  try {
    return await apiFetch(`/annotations/page/${pageId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch (error) {
    return {
      success: false,
      status: error.status,
      message: error.message || "Không thể tạo góp ý.",
    };
  }
};

/**
 * Cập nhật annotation
 * @param {string} annotationId
 * @param {{ content?: string, status?: string, deadline?: string, x?: number, y?: number, category?: string }} data
 */
export const updateAnnotation = async (annotationId, data) => {
  try {
    return await apiFetch(`/annotations/${annotationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch (error) {
    return {
      success: false,
      status: error.status,
      message: error.message || "Không thể cập nhật góp ý.",
    };
  }
};

/**
 * Xóa annotation
 * @param {string} annotationId
 */
export const deleteAnnotation = async (annotationId) => {
  try {
    return await apiFetch(`/annotations/${annotationId}`, {
      method: "DELETE",
    });
  } catch (error) {
    return {
      success: false,
      status: error.status,
      message: error.message || "Không thể xóa góp ý.",
    };
  }
};

/**
 * Khôi phục annotation đã xóa mềm
 * @param {string} annotationId
 */
export const restoreAnnotation = async (annotationId) => {
  try {
    return await apiFetch(`/annotations/${annotationId}/restore`, {
      method: "PATCH",
    });
  } catch (error) {
    return {
      success: false,
      status: error.status,
      message: error.message || "Không thể khôi phục góp ý.",
    };
  }
};
