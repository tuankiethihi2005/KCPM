import { apiFetch } from "../apiClient";

export const listUsers = async ({ page = 1, limit = 10, search = "", role = "", status = "" } = {}) => {
  try {
    const params = new URLSearchParams();
    params.set("page", page);
    params.set("limit", limit);
    if (search) params.set("search", search);
    if (role) params.set("role", role);
    if (status) params.set("status", status);

    return await apiFetch(`/auth/users?${params.toString()}`);
  } catch (error) {
    return {
      success: false,
      status: error.status,
      message: error.message || "Khong the tai danh sach user.",
    };
  }
};

export const createUser = async ({ name, email, password, role, status }) => {
  try {
    return await apiFetch("/auth/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role, status }),
    });
  } catch (error) {
    return {
      success: false,
      status: error.status,
      message: error.message || "Khong the tao tai khoan.",
    };
  }
};

export const updateUser = async (userId, { name, email, role }) => {
  try {
    return await apiFetch(`/auth/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, role }),
    });
  } catch (error) {
    return {
      success: false,
      status: error.status,
      message: error.message || "Khong the cap nhat user.",
    };
  }
};

export const updateUserStatus = async (userId, status) => {
  try {
    return await apiFetch(`/auth/users/${userId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  } catch (error) {
    return {
      success: false,
      status: error.status,
      message: error.message || "Khong the cap nhat trang thai.",
    };
  }
};

export const deleteUser = async (userId) => {
  try {
    return await apiFetch(`/auth/users/${userId}`, {
      method: "DELETE",
    });
  } catch (error) {
    return {
      success: false,
      status: error.status,
      message: error.message || "Khong the xoa user.",
    };
  }
};

export const resetUserPassword = async (userId, newPassword) => {
  try {
    return await apiFetch(`/auth/users/${userId}/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword }),
    });
  } catch (error) {
    return {
      success: false,
      status: error.status,
      message: error.message || "Khong the reset mat khau.",
    };
  }
};
