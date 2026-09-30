import { apiFetch } from "../apiClient";

const publishChapter = async (chapterId, releaseIssueId = null) => {
  try {
    const payload = releaseIssueId ? { release_issue_id: releaseIssueId } : {};

    return await apiFetch(`/publish/chapter/${chapterId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    return {
      success: false,
      status: error.status,
      message: error.message || "Khong du dieu kien xuat ban.",
      unapprovedPages_count: error.data?.unapprovedPages_count || 0,
    };
  }
};

export default publishChapter;
