import { apiFetch } from "../apiClient";

const getSeriesProgress = async ({
  page = 1,
  limit = 10,
  search = "",
  filter = "attention",
  sort = "attention",
} = {}) => {
  try {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      filter,
      sort,
    });

    if (search.trim()) {
      params.set("search", search.trim());
    }

    return await apiFetch(`/series/progress?${params.toString()}`);
  } catch (error) {
    return {
      success: false,
      status: error.status,
      message: error.message || "Không thể tải tiến độ series.",
    };
  }
};

export default getSeriesProgress;
