import { apiFetch } from "../apiClient";

export default async function restorePage(pageId) {
  try {
    return await apiFetch(`/pages/${pageId}/restore`, { method: "PUT" });
  } catch (error) {
    return { success: false, message: error.message || "Khôi phục thất bại" };
  }
}
