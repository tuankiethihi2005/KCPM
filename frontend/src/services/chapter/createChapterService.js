import { apiFetch } from "../apiClient";

const createChapter = async (chapterData) => {
  try {
    return await apiFetch("/chapters/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(chapterData),
    });
  } catch (error) {
    return {
      success: false,
      status: error.status,
      message: error.message || "Khoi tao chapter that bai.",
    };
  }
};

export default createChapter;
