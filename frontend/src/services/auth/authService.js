import { API_BASE_URL } from "../../config/api";

const parseJson = async (response) => {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return null;
  }

  return response.json();
};

export const loginRequest = async ({ email, password }) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await parseJson(response);
  if (!response.ok) {
    const error = new Error(
      data?.error?.message || "Dang nhap that bai. Vui long thu lai.",
    );
    error.status = response.status;
    error.code = data?.error?.code;
    throw error;
  }

  return data;
};

export const refreshRequest = async () => {
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });

  const data = await parseJson(response);
  if (!response.ok) {
    const error = new Error(data?.error?.message || "Refresh token that bai.");
    error.status = response.status;
    error.code = data?.error?.code;
    throw error;
  }

  return data;
};

export const meRequest = async (accessToken) => {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = await parseJson(response);
  if (!response.ok) {
    const error = new Error(
      data?.error?.message || "Khong the lay thong tin nguoi dung.",
    );
    error.status = response.status;
    error.code = data?.error?.code;
    throw error;
  }

  return data;
};

export const logoutRequest = async (refreshToken) => {
  const response = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(refreshToken ? { refreshToken } : {}),
  });

  if (!response.ok) {
    const data = await parseJson(response);
    const error = new Error(data?.error?.message || "Dang xuat that bai.");
    error.status = response.status;
    error.code = data?.error?.code;
    throw error;
  }
};
