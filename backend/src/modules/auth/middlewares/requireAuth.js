const User = require("../../../models/UserModel");
const { AUTH_ERROR_CODES } = require("../constants/auth.constants");
const { verifyAccessToken } = require("../utils/token");

const withStatus = (status, code, message) => {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
};

const requireAuth = async (req, res, next) => {
  try {
    const authorizationHeader = req.headers.authorization;
    if (!authorizationHeader) {
      throw withStatus(
        401,
        AUTH_ERROR_CODES.TOKEN_MISSING,
        "Authorization token is required.",
      );
    }

    const [scheme, token] = authorizationHeader.split(" ");
    if (scheme !== "Bearer" || !token) {
      throw withStatus(
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
      throw withStatus(401, code, "Authorization token is invalid.");
    }

    const user = await User.findById(payload.sub);
    if (!user) {
      throw withStatus(
        401,
        AUTH_ERROR_CODES.TOKEN_INVALID,
        "User no longer exists.",
      );
    }

    if (user.status === "Inactive") {
      throw withStatus(
        403,
        AUTH_ERROR_CODES.ACCOUNT_INACTIVE,
        "This account is inactive.",
      );
    }

    if (user.status === "Suspended") {
      throw withStatus(
        403,
        AUTH_ERROR_CODES.ACCOUNT_SUSPENDED,
        "This account is suspended.",
      );
    }

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      status: user.status,
    };

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  requireAuth,
};
