import { apiFetch } from "../apiClient";

const createReleaseIssue = async (issueData) => {
  try {
    return await apiFetch("/issues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(issueData),
    });
  } catch (error) {
    return {
      success: false,
      status: error.status,
      message: error.message || "Khong the tao ky phat hanh.",
    };
  }
};

export default createReleaseIssue;
