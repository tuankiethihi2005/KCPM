import { apiFetch } from "../apiClient";

const uploadCover = async (seriesId, file) => {
  try {
    const formData = new FormData();
    formData.append("cover", file);

    return await apiFetch(`/series/${seriesId}/proposal/upload-cover`, {
      method: "POST",
      body: formData,
    });
  } catch (error) {
    return {
      success: false,
      status: error.status,
      message: error.message || "Upload anh bia that bai.",
    };
  }
};

export default uploadCover;
