import { apiFetch } from "./apiClient";

export const getNotificationsApi = async ({ page = 1, limit = 20, type, is_read } = {}) => {
  try {
    const params = new URLSearchParams();
    params.set("page", page);
    params.set("limit", limit);
    if (type) params.set("type", type);
    if (is_read !== undefined && is_read !== "") params.set("is_read", is_read);

    return await apiFetch(`/notifications?${params.toString()}`);
  } catch (error) {
    return {
      success: false,
      status: error.status,
      message: error.message || "Không thể tải danh sách thông báo.",
    };
  }
};

export const getUnreadCountApi = async () => {
  try {
    return await apiFetch("/notifications/unread-count");
  } catch (error) {
    return { success: false, count: 0 };
  }
};

export const markAsReadApi = async (id) => {
  try {
    return await apiFetch(`/notifications/${id}/read`, {
      method: "PUT",
    });
  } catch (error) {
    return {
      success: false,
      status: error.status,
      message: error.message || "Không thể đánh dấu thông báo.",
    };
  }
};

export const markAllAsReadApi = async () => {
  try {
    return await apiFetch("/notifications/mark-all-read", {
      method: "PUT",
    });
  } catch (error) {
    return {
      success: false,
      status: error.status,
      message: error.message || "Không thể đánh dấu tất cả thông báo.",
    };
  }
};

export const deleteNotificationApi = async (id) => {
  try {
    return await apiFetch(`/notifications/${id}`, {
      method: "DELETE",
    });
  } catch (error) {
    return {
      success: false,
      status: error.status,
      message: error.message || "Không thể xóa thông báo.",
    };
  }
};
