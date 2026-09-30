import { apiFetch } from "../apiClient";

const getLeaderboard = async (filters = {}) => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  const suffix = params.toString() ? `?${params.toString()}` : "";

  try {
    return await apiFetch(`/rankings${suffix}`);
  } catch (error) {
    return {
      success: false,
      status: error.status,
      message: error.message || "Khong the tai bang xep hang.",
    };
  }
};

export default getLeaderboard;
