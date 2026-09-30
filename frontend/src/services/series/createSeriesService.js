import { apiFetch } from "../apiClient";

const createSeries = async (data) => {
  try {
    return await apiFetch("/series", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch (error) {
    return {
      success: false,
      status: error.status,
      message: error.message || "Tao series that bai.",
    };
  }
};

export default createSeries;
