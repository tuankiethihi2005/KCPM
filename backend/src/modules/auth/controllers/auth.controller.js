const authService = require("../services/auth.service");
const { REFRESH_TOKEN_COOKIE_NAME } = require("../constants/auth.constants");

const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/api/auth",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const buildErrorResponse = (error) => ({
  error: {
    code: error.code || "AUTH_UNKNOWN_ERROR",
    message: error.message || "Authentication request failed.",
  },
});

const getCookieValue = (req, name) => {
  const rawCookie = req.headers.cookie;
  if (!rawCookie) {
    return null;
  }

  const cookies = rawCookie.split(";").map((cookie) => cookie.trim());
  const target = cookies.find((cookie) => cookie.startsWith(`${name}=`));
  if (!target) {
    return null;
  }

  return decodeURIComponent(target.slice(name.length + 1));
};

const setRefreshCookie = (res, refreshToken) => {
  res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, refreshCookieOptions);
};

const clearRefreshCookie = (res) => {
  res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
    ...refreshCookieOptions,
    maxAge: undefined,
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: {
        code: "AUTH_INVALID_PAYLOAD",
        message: "Email and password are required.",
      },
    });
  }

  try {
    const result = await authService.login({ email, password });
    setRefreshCookie(res, result.refreshToken);
    return res.status(200).json({
      accessToken: result.accessToken,
      user: result.user,
    });
  } catch (error) {
    return res.status(error.status || 500).json(buildErrorResponse(error));
  }
};

const logout = async (req, res) => {
  try {
    const refreshToken =
      getCookieValue(req, REFRESH_TOKEN_COOKIE_NAME) || req.body?.refreshToken;
    await authService.logout(refreshToken);
    clearRefreshCookie(res);
    return res.status(200).json({ message: "Logged out successfully." });
  } catch (error) {
    return res.status(error.status || 500).json(buildErrorResponse(error));
  }
};

const refresh = async (req, res) => {
  try {
    const refreshToken =
      getCookieValue(req, REFRESH_TOKEN_COOKIE_NAME) || req.body?.refreshToken;
    const result = await authService.refresh(refreshToken);
    setRefreshCookie(res, result.refreshToken);
    return res.status(200).json({ accessToken: result.accessToken });
  } catch (error) {
    clearRefreshCookie(res);
    return res.status(error.status || 500).json(buildErrorResponse(error));
  }
};

const me = async (req, res) => res.status(200).json({ user: req.user });

const listUsers = async (req, res) => {
  try {
    const result = await authService.listUsers();
    return res.status(200).json(result);
  } catch (error) {
    return res.status(error.status || 500).json(buildErrorResponse(error));
  }
};

const createUser = async (req, res) => {
  try {
    const result = await authService.createUser(req.body);
    return res.status(201).json({
      message: "User created successfully.",
      user: result.user,
    });
  } catch (error) {
    return res.status(error.status || 500).json(buildErrorResponse(error));
  }
};

const resetPassword = async (req, res) => {
  try {
    await authService.resetPassword({
      userId: req.params.id,
      newPassword: req.body.newPassword,
    });
    return res.status(200).json({ message: "Password reset successfully." });
  } catch (error) {
    return res.status(error.status || 500).json(buildErrorResponse(error));
  }
};

/**
 * PATCH /api/auth/users/:id/status
 * Admin khóa/mở khóa tài khoản (status: Active / Suspended / Inactive)
 */
const updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        error: {
          code: "AUTH_INVALID_PAYLOAD",
          message: "status là bắt buộc.",
        },
      });
    }

    const result = await authService.updateUserStatus({
      userId: req.params.id,
      status,
    });

    let actionText = "cập nhật trạng thái";
    if (status === "Suspended") actionText = "khóa";
    else if (status === "Inactive") actionText = "vô hiệu hóa";
    else if (status === "Active") actionText = "mở khóa";

    return res.status(200).json({
      message: `Đã ${actionText} tài khoản thành công.`,
      user: result.user,
    });
  } catch (error) {
    return res.status(error.status || 500).json(buildErrorResponse(error));
  }
};

/**
 * DELETE /api/auth/users/:id
 * Admin xóa tài khoản (soft delete)
 */
const deleteUser = async (req, res) => {
  try {
    const result = await authService.deleteUser(req.params.id);
    return res.status(200).json({
      message: "Đã xóa tài khoản thành công.",
      user: result.user,
    });
  } catch (error) {
    return res.status(error.status || 500).json(buildErrorResponse(error));
  }
};

/**
 * GET /api/auth/users
 * Admin lấy danh sách users với filter/search/pagination
 */
const listUsersWithFilter = async (req, res) => {
  try {
    const { page, limit, search, role, status } = req.query;
    const result = await authService.listUsersWithFilter({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      search: search || "",
      role: role || "",
      status: status || "",
    });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(error.status || 500).json(buildErrorResponse(error));
  }
};

/**
 * PUT /api/auth/users/:id
 * Admin cập nhật thông tin user
 */
const updateUser = async (req, res) => {
  try {
    const result = await authService.updateUser({ userId: req.params.id, updates: req.body });
    return res.status(200).json({
      message: "Cập nhật thông tin user thành công.",
      user: result.user,
    });
  } catch (error) {
    return res.status(error.status || 500).json(buildErrorResponse(error));
  }
};

module.exports = {
  createUser,
  deleteUser,
  listUsers,
  listUsersWithFilter,
  login,
  logout,
  me,
  resetPassword,
  refresh,
  updateUser,
  updateUserStatus,
};
