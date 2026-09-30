import { apiFetch } from "../apiClient";

export const getTasksApi = async (params = {}) => {
  try {
    const query = new URLSearchParams(params).toString();
    const path = query ? `/tasks?${query}` : "/tasks";
    return await apiFetch(path);
  } catch (error) {
    return {
      success: false,
      status: error.status,
      message: error.message || "Không thể tải danh sách công việc.",
    };
  }
};

export const getTaskByIdApi = async (taskId) => {
  try {
    return await apiFetch(`/tasks/${taskId}`);
  } catch (error) {
    return {
      success: false,
      status: error.status,
      message: error.message || "Không thể tải chi tiết công việc.",
    };
  }
};

export const createTaskApi = async (data) => {
  try {
    return await apiFetch("/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
  } catch (error) {
    return {
      success: false,
      status: error.status,
      message: error.message || "Không thể tạo công việc mới.",
    };
  }
};

export const submitTaskApi = async (taskId, formData) => {
  try {
    // Note: Do not set Content-Type header when using FormData, browser will set it automatically with boundary
    return await apiFetch(`/tasks/${taskId}/submit`, {
      method: "POST",
      body: formData,
    });
  } catch (error) {
    return {
      success: false,
      status: error.status,
      message: error.message || "Không thể nộp file thành phẩm.",
    };
  }
};

export const reviewTaskApi = async (taskId, reviewData) => {
  try {
    return await apiFetch(`/tasks/${taskId}/review`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(reviewData),
    });
  } catch (error) {
    return {
      success: false,
      status: error.status,
      message: error.message || "Không thể đánh giá công việc.",
    };
  }
};

export const getAssistantsApi = async () => {
  try {
    return await apiFetch("/tasks/assistants");
  } catch (error) {
    return {
      success: false,
      status: error.status,
      message: error.message || "Không thể tải danh sách trợ lý.",
    };
  }
};

export const updateTaskStatusApi = async (taskId, status) => {
  try {
    return await apiFetch(`/tasks/${taskId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });
  } catch (error) {
    return {
      success: false,
      status: error.status,
      message: error.message || "Không thể cập nhật trạng thái công việc.",
    };
  }
};

export const deleteTaskApi = async (taskId) => {
  try {
    return await apiFetch(`/tasks/${taskId}`, {
      method: "DELETE",
    });
  } catch (error) {
    return {
      success: false,
      status: error.status,
      message: error.message || "Không thể hủy nhiệm vụ.",
    };
  }
};
