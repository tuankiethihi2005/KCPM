import { apiFetch } from "../apiClient";

const approvePage = async (pageId, status) => {
  try {
    return await apiFetch(`/pages/approve/${pageId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  } catch (error) {
    return {
      success: false,
      status: error.status,
      message: error.message || "Duyet trang truyen that bai.",
    };
  }
};

export default approvePage;
