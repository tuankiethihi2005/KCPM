import { apiFetch } from "../apiClient";

const upsertProposal = async (seriesId, data) => {
  try {
    return await apiFetch(`/series/${seriesId}/proposal`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch (error) {
    return {
      success: false,
      status: error.status,
      message: error.message || "Luu proposal that bai.",
    };
  }
};

export default upsertProposal;
