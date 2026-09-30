import { apiFetch } from "../apiClient";

const getLifecycleVotes = async (seriesId) => {
  try {
    return await apiFetch(`/series/${seriesId}/lifecycle-votes`);
  } catch (error) {
    return {
      success: false,
      status: error.status,
      message: error.message || "Khong the tai phieu vong doi.",
    };
  }
};

export default getLifecycleVotes;
