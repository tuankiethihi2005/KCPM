import { apiFetch } from "../apiClient";

export default async function deletePage(pageId) {
  try {
    return await apiFetch(`/pages/${pageId}`, { method: "DELETE" });
  } catch (error) {
    return { success: false, message: error.message || "Xóa trang thất bại" };
  }
}
