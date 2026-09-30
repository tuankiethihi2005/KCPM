import { apiFetch } from "../apiClient";

const importVoteData = async ({ issueId, file }) => {
  const formData = new FormData();
  formData.append("file", file);

  try {
    return await apiFetch(`/issues/${issueId}/import-votes`, {
      method: "POST",
      body: formData,
    });
  } catch (error) {
    return {
      success: false,
      status: error.status,
      message: error.message || "Khong the import du lieu vote.",
    };
  }
};

export default importVoteData;
