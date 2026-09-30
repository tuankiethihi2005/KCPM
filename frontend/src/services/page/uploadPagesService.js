import { apiFetch } from "../apiClient";

const uploadPages = async (
  chapterId,
  pageNumber,
  sourceFile,
  attachedResource,
) => {
  try {
    const formData = new FormData();

    formData.append("page_number", pageNumber);
    formData.append("source_file", sourceFile);

    if (attachedResource) {
      formData.append("attached_resource", attachedResource);
    }

    return await apiFetch(`/pages/upload/${chapterId}/upload`, {
      method: "POST",
      body: formData,
    });
  } catch (error) {
    return {
      success: false,
      status: error.status,
      message: error.message || "Tải lên bản thảo thất bại.",
    };
  }
};

export default uploadPages;
