const mongoose = require("mongoose");
const User = require("../../../models/UserModel");
const AuthSession = require("../models/AuthSessionModel");
const { ROLES } = require("../../../constants/roles");
const { AUTH_ERROR_CODES } = require("../constants/auth.constants");
const { comparePassword, hashPassword } = require("../utils/password");
const {
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} = require("../utils/token");
const NotificationService = require("../../../services/notificationService");

const buildAuthError = (status, code, message) => {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
};

const sanitizeUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
  status: user.status,
});

const normalizeRole = (role) => {
  if (!role || typeof role !== "string") return null;
  const upper = role.toUpperCase();
  for (const [k, v] of Object.entries(ROLES)) {
    if (k.toUpperCase() === upper || v.toUpperCase() === upper) {
      return v;
    }
  }
  return null;
};
const validateRole = (role) => Boolean(normalizeRole(role));

const normalizeStatus = (status) => {
  if (!status || typeof status !== "string") return null;
  const upper = status.toUpperCase();
  if (upper === "ACTIVE") return "Active";
  if (upper === "BLOCKED" || upper === "SUSPENDED") return "Suspended";
  if (upper === "INACTIVE") return "Inactive";
  if (["Active", "Suspended", "Inactive"].includes(status)) return status;
  return null;
};
const validateStatus = (status) => Boolean(normalizeStatus(status));

const validatePasswordPolicy = (password) => {
  if (typeof password !== "string" || password.length < 6 || password.length > 50) {
    throw buildAuthError(
      400,
      AUTH_ERROR_CODES.PASSWORD_POLICY_VIOLATION,
      "Password must be between 6 and 50 characters long.",
    );
  }
};

const assertAccountIsActive = (user) => {
  if (user.status === "Inactive") {
    throw buildAuthError(
      403,
      AUTH_ERROR_CODES.ACCOUNT_INACTIVE,
      "This account is inactive.",
    );
  }

  if (user.status === "Suspended") {
    throw buildAuthError(
      403,
      AUTH_ERROR_CODES.ACCOUNT_SUSPENDED,
      "This account is suspended.",
    );
  }
};

const createSessionTokens = async (user) => {
  const accessToken = signAccessToken(user);
  const { token: refreshToken, expiresAt } = signRefreshToken(user);

  await AuthSession.create({
    user_id: user._id,
    token_hash: hashToken(refreshToken),
    expires_at: expiresAt,
  });

  return { accessToken, refreshToken };
};

const login = async ({ email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    throw buildAuthError(
      401,
      AUTH_ERROR_CODES.INVALID_CREDENTIALS,
      "Email or password is incorrect.",
    );
  }

  const passwordMatches = await comparePassword(password, user.password);

  if (!passwordMatches) {
    throw buildAuthError(
      401,
      AUTH_ERROR_CODES.INVALID_CREDENTIALS,
      "Email or password is incorrect.",
    );
  }

  assertAccountIsActive(user);
  const tokens = await createSessionTokens(user);

  return {
    ...tokens,
    user: sanitizeUser(user),
  };
};

const logout = async (refreshToken) => {
  if (!refreshToken) {
    return;
  }

  await AuthSession.findOneAndUpdate(
    { token_hash: hashToken(refreshToken), revoked_at: null },
    { revoked_at: new Date() },
  );
};

const refresh = async (refreshToken) => {
  if (!refreshToken) {
    throw buildAuthError(
      401,
      AUTH_ERROR_CODES.REFRESH_INVALID,
      "Refresh token is required.",
    );
  }

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (error) {
    throw buildAuthError(
      401,
      AUTH_ERROR_CODES.REFRESH_INVALID,
      "Refresh token is invalid or expired.",
    );
  }

  const tokenHash = hashToken(refreshToken);
  const session = await AuthSession.findOne({
    token_hash: tokenHash,
    revoked_at: null,
  });

  if (!session || session.expires_at.getTime() <= Date.now()) {
    throw buildAuthError(
      401, // Trả lại 401 như ban đầu để pass các test suite auth
      AUTH_ERROR_CODES.REFRESH_INVALID,
      "Refresh token is invalid or expired.",
    );
  }

  const user = await User.findById(payload.sub);
  if (!user) {
    throw buildAuthError(
      401,
      AUTH_ERROR_CODES.TOKEN_INVALID,
      "User no longer exists.",
    );
  }

  assertAccountIsActive(user);

  session.revoked_at = new Date();
  await session.save();

  return createSessionTokens(user);
};

const getCurrentUserFromAccessToken = async (authorizationHeader) => {
  if (!authorizationHeader) {
    throw buildAuthError(
      401,
      AUTH_ERROR_CODES.TOKEN_MISSING,
      "Authorization token is required.",
    );
  }

  const [scheme, token] = authorizationHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    throw buildAuthError(
      401,
      AUTH_ERROR_CODES.TOKEN_INVALID,
      "Authorization token is invalid.",
    );
  }

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (error) {
    const code =
      error.name === "TokenExpiredError"
        ? AUTH_ERROR_CODES.TOKEN_EXPIRED
        : AUTH_ERROR_CODES.TOKEN_INVALID;
    throw buildAuthError(401, code, "Authorization token is invalid.");
  }

  const user = await User.findById(payload.sub);
  if (!user) {
    throw buildAuthError(
      401,
      AUTH_ERROR_CODES.TOKEN_INVALID,
      "User no longer exists.",
    );
  }

  assertAccountIsActive(user);
  return sanitizeUser(user);
};

const listUsers = async () => {
  const users = await User.find().sort({ createdAt: -1 });
  return { users: users.map(sanitizeUser) };
};

const createUser = async ({ name, email, password, role, status = "Active" }) => {
  if (!email || !password || !role) {
    throw buildAuthError(
      400,
      "AUTH_INVALID_PAYLOAD",
      "Email, password, and role are required.",
    );
  }

  const normalizedName = name || email.split("@")[0];

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(String(email).trim())) {
    throw buildAuthError(400, "AUTH_INVALID_EMAIL", "Email format is invalid.");
  }

  if (!validateRole(role)) {
    throw buildAuthError(400, "AUTH_INVALID_ROLE", "Role is invalid.");
  }

  if (!validateStatus(status)) {
    throw buildAuthError(400, "AUTH_INVALID_STATUS", "Status is invalid.");
  }

  validatePasswordPolicy(password);

  const normalizedRole = normalizeRole(role);
  const normalizedStatus = normalizeStatus(status) || "Active";

  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw buildAuthError(
      409,
      AUTH_ERROR_CODES.EMAIL_ALREADY_EXISTS,
      "Email already exists.",
    );
  }

  const user = await User.create({
    name: normalizedName,
    email: normalizedEmail,
    password: await hashPassword(password),
    role: normalizedRole,
    status: normalizedStatus,
  });

  try {
    await NotificationService.createNotification({
      user_id: user._id,
      type: "System",
      title: "Chào mừng bạn đến với Hệ thống",
      message: `Chào mừng ${normalizedName} đến với Hệ thống quản lý Manga. Tài khoản ${normalizedRole} của bạn đã được tạo thành công.`,
    });
  } catch (err) {
    // Ignore notification failure
  }

  return { user: sanitizeUser(user) };
};

const resetPassword = async ({ userId, newPassword }) => {
  validatePasswordPolicy(newPassword);

  const user = await User.findById(userId);
  if (!user) {
    throw buildAuthError(
      404,
      AUTH_ERROR_CODES.USER_NOT_FOUND,
      "User was not found.",
    );
  }

  user.password = await hashPassword(newPassword);
  await user.save();

  await AuthSession.updateMany(
    { user_id: user._id, revoked_at: null },
    { revoked_at: new Date() },
  );

  return { user: sanitizeUser(user) };
};

const updateUserStatus = async ({ userId, status }) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw buildAuthError(400, "INVALID_ID", "ID không hợp lệ hoặc sai định dạng ObjectId.");
  }

  if (!validateStatus(status)) {
    throw buildAuthError(400, AUTH_ERROR_CODES.INVALID_STATUS, "Status is invalid.");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw buildAuthError(404, AUTH_ERROR_CODES.USER_NOT_FOUND, "User was not found.");
  }

  const normalizedStatus = normalizeStatus(status);
  user.status = normalizedStatus;
  await user.save();

  if (normalizedStatus === "Suspended" || normalizedStatus === "Inactive") {
    await AuthSession.updateMany(
      { user_id: user._id, revoked_at: null },
      { revoked_at: new Date() },
    );
  }

  return { user: sanitizeUser(user) };
};

const deleteUser = async (userId) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw buildAuthError(400, "INVALID_ID", "ID không hợp lệ hoặc sai định dạng ObjectId.");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw buildAuthError(404, AUTH_ERROR_CODES.USER_NOT_FOUND, "User was not found.");
  }

  user.status = "Inactive";
  await user.save();

  await AuthSession.updateMany(
    { user_id: user._id, revoked_at: null },
    { revoked_at: new Date() },
  );

  return { user: sanitizeUser(user) };
};

const listUsersWithFilter = async ({ page = 1, limit = 10, search = "", role = "", status = "" }) => {
  const query = {};

  if (role) {
    query.role = role;
  }

  if (status) {
    query.status = status;
  }

  if (search) {
    const searchRegex = new RegExp(search.trim(), "i");
    query.$or = [
      { name: searchRegex },
      { email: searchRegex },
    ];
  }

  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(query),
  ]);

  return {
    users: users.map(sanitizeUser),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const updateUser = async ({ userId, updates }) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw buildAuthError(400, "INVALID_ID", "ID không hợp lệ hoặc sai định dạng ObjectId.");
  }

  const allowedFields = ["name", "email", "role"];
  const filteredUpdates = {};

  for (const key of allowedFields) {
    if (updates[key] !== undefined) {
      filteredUpdates[key] = updates[key];
    }
  }

  if (filteredUpdates.role) {
    if (!validateRole(filteredUpdates.role)) {
      throw buildAuthError(400, "AUTH_INVALID_ROLE", "Role is invalid.");
    }
    filteredUpdates.role = normalizeRole(filteredUpdates.role);
  }

  if (filteredUpdates.email) {
    const normalizedEmail = filteredUpdates.email.trim().toLowerCase();
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      throw buildAuthError(404, AUTH_ERROR_CODES.USER_NOT_FOUND, "User was not found.");
    }
    if (normalizedEmail && normalizedEmail !== currentUser.email) {
      const existingUser = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: new mongoose.Types.ObjectId(userId) }
      });
      if (existingUser) {
        throw buildAuthError(409, "AUTH_EMAIL_ALREADY_EXISTS", "Email already exists.");
      }
    }
    filteredUpdates.email = normalizedEmail;
  }

  const user = await User.findByIdAndUpdate(userId, filteredUpdates, { new: true });
  if (!user) {
    throw buildAuthError(404, AUTH_ERROR_CODES.USER_NOT_FOUND, "User was not found.");
  }

  return { user: sanitizeUser(user) };
};

module.exports = {
  createUser,
  deleteUser,
  getCurrentUserFromAccessToken,
  listUsers,
  listUsersWithFilter,
  login,
  logout,
  resetPassword,
  refresh,
  updateUser,
  updateUserStatus,
};