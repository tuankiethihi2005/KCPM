import { apiFetch } from "../apiClient";

const castLifecycleVote = async (seriesId, { vote, comment }) => {
  try {
    return await apiFetch(`/series/${seriesId}/lifecycle-vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vote, comment }),
    });
  } catch (error) {
    return {
      success: false,
      status: error.status,
      message: error.message || "Bo phieu vong doi that bai.",
    };
  }
};

export default castLifecycleVote;
