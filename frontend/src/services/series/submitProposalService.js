import { apiFetch } from "../apiClient";

const submitProposal = async (seriesId) => {
  try {
    return await apiFetch(`/series/${seriesId}/proposal/submit`, {
      method: "POST",
    });
  } catch (error) {
    return {
      success: false,
      status: error.status,
      message: error.message || "Nop ho so that bai.",
    };
  }
};

export default submitProposal;
