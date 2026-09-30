import { API_BASE_URL } from "../config/api";
import { useAuthStore } from "../stores/authStore";

const parseResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return null;
  }

  return response.json();
};

const buildHeaders = (headers = {}, accessToken, body) => {
  const finalHeaders = new Headers(headers);
  if (accessToken) {
    finalHeaders.set("Authorization", `Bearer ${accessToken}`);
  }
  // Khi body là FormData, để browser tự set Content-Type kèm boundary
  // Nếu set thủ công sẽ thiếu boundary → lỗi "Failed to fetch"
  if (body instanceof FormData) {
    finalHeaders.delete("Content-Type");
  }

  return finalHeaders;
};


const getErrorMessage = (data) => {
  if (!data) {
    return "Request failed.";
  }

  if (typeof data.error === "string") {
    return data.error;
  }

  return data.error?.message || data.message || data.details || "Request failed.";
};

export const apiFetch = async (path, options = {}) => {
  const state = useAuthStore.getState();
  const accessToken = state.accessToken;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: buildHeaders(options.headers, accessToken, options.body),
  });

  if (response.status === 401 && !options._retry) {
    try {
      await useAuthStore.getState().refreshSession();
      const nextState = useAuthStore.getState();

      const retriedResponse = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        _retry: undefined,
        credentials: "include",
        headers: buildHeaders(options.headers, nextState.accessToken, options.body),
      });

      const retriedData = await parseResponse(retriedResponse);
      if (!retriedResponse.ok) {
        const error = new Error(getErrorMessage(retriedData));
        error.status = retriedResponse.status;
        error.data = retriedData;
        throw error;
      }

      return retriedData;
    } catch (error) {
      useAuthStore.getState().clearSession();
      throw error;
    }
  }

  const data = await parseResponse(response);
  if (!response.ok) {
    const error = new Error(getErrorMessage(data));
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};
