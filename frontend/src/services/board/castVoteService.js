import { apiFetch } from "../apiClient";

const castVote = async (seriesId, { vote, comment }) => {
  try {
    return await apiFetch(`/board/series/${seriesId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vote, comment }),
    });
  } catch (error) {
    return {
      success: false,
      status: error.status,
      message: error.message || "Bo phieu that bai.",
    };
  }
};

export default castVote;
