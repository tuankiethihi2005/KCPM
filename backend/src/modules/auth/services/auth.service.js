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

const validateRole = (role) => Object.values(ROLES).includes(role);
const validateStatus = (status) =>
  ["Active", "Inactive", "Suspended"].includes(status);

const validatePasswordPolicy = (password) => {
  if (typeof password !== "string" || password.length < 8) {
    throw buildAuthError(
      400,
      AUTH_ERROR_CODES.PASSWORD_POLICY_VIOLATION,
      "Password must be at least 8 characters long.",
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
      401,
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
  if (!name || !email || !password || !role) {
    throw buildAuthError(
      400,
      "AUTH_INVALID_PAYLOAD",
      "Name, email, password, and role are required.",
    );
  }

  if (!validateRole(role)) {
    throw buildAuthError(400, "AUTH_INVALID_ROLE", "Role is invalid.");
  }

  if (!validateStatus(status)) {
    throw buildAuthError(400, "AUTH_INVALID_STATUS", "Status is invalid.");
  }

  validatePasswordPolicy(password);

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
    name,
    email: normalizedEmail,
    password: await hashPassword(password),
    role,
    status,
  });

  // Welcome notification for new user
  await NotificationService.createNotification({
    user_id: user._id,
    type: "System",
    title: "Chào mừng bạn đến với Hệ thống",
    message: `Chào mừng ${name} đến với Hệ thống quản lý Manga. Tài khoản ${role} của bạn đã được tạo thành công.`,
  });

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

/**
 * Admin cập nhật trạng thái tài khoản (Active/Inactive/Suspended)
 * Dùng để khóa/mở khóa hoặc xóa tài khoản (soft delete)
 */
const updateUserStatus = async ({ userId, status }) => {
  if (!validateStatus(status)) {
    throw buildAuthError(400, AUTH_ERROR_CODES.INVALID_STATUS, "Status is invalid.");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw buildAuthError(404, AUTH_ERROR_CODES.USER_NOT_FOUND, "User was not found.");
  }

  user.status = status;
  await user.save();

  // Khi khóa hoặc vô hiệu hóa → Revoke tất cả sessions
  if (status === "Suspended" || status === "Inactive") {
    await AuthSession.updateMany(
      { user_id: user._id, revoked_at: null },
      { revoked_at: new Date() },
    );
  }

  return { user: sanitizeUser(user) };
};

/**
 * Admin xóa tài khoản (soft delete → chuyển status thành Inactive)
 */
const deleteUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw buildAuthError(404, AUTH_ERROR_CODES.USER_NOT_FOUND, "User was not found.");
  }

  user.status = "Inactive";
  await user.save();

  // Revoke tất cả sessions
  await AuthSession.updateMany(
    { user_id: user._id, revoked_at: null },
    { revoked_at: new Date() },
  );

  return { user: sanitizeUser(user) };
};

/**
 * Lấy danh sách users với filter, search, pagination
 */
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

/**
 * Admin cập nhật thông tin user (name, email, role)
 */
const updateUser = async ({ userId, updates }) => {
  const allowedFields = ["name", "email", "role"];
  const filteredUpdates = {};

  for (const key of allowedFields) {
    if (updates[key] !== undefined) {
      filteredUpdates[key] = updates[key];
    }
  }

  if (filteredUpdates.role && !validateRole(filteredUpdates.role)) {
    throw buildAuthError(400, "AUTH_INVALID_ROLE", "Role is invalid.");
  }

  if (filteredUpdates.email) {
    const normalizedEmail = filteredUpdates.email.trim().toLowerCase();
    const existingUser = await User.findOne({
      email: normalizedEmail,
      _id: { $ne: userId },
    });
    if (existingUser) {
      throw buildAuthError(409, AUTH_ERROR_CODES.EMAIL_ALREADY_EXISTS, "Email already exists.");
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
