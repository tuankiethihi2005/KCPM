import { apiFetch } from "../apiClient";

const updatePageVersion = async (
  pageId,
  commitNote,
  sourceFile,
  attachedResource,
) => {
  try {
    const formData = new FormData();

    // Bắt buộc phải có lời nhắn
    formData.append("commit_note", commitNote);
    formData.append("source_file", sourceFile);

    // Nếu có file tài nguyên đi kèm thì mới thêm vào
    if (attachedResource) {
      formData.append("attached_resource", attachedResource);
    }

    return await apiFetch(`/pages/update/${pageId}`, {
      method: "PUT", // Chú ý đây là method PUT theo đúng API ta đã viết
      body: formData,
    });
  } catch (error) {
    return {
      success: false,
      status: error.status,
      message: error.message || "Cập nhật phiên bản thất bại.",
    };
  }
};

export default updatePageVersion;
