const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const {
  ACCESS_TOKEN_TTL,
  REFRESH_TOKEN_TTL_DAYS,
} = require("../constants/auth.constants");

const getAccessSecret = () =>
  process.env.JWT_ACCESS_SECRET || "dev-access-secret";
const getRefreshSecret = () =>
  process.env.JWT_REFRESH_SECRET || "dev-refresh-secret";

const signAccessToken = (user) =>
  jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
      status: user.status,
    },
    getAccessSecret(),
    { expiresIn: ACCESS_TOKEN_TTL },
  );

const signRefreshToken = (user) => {
  const expiresInSeconds = REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60;
  const token = jwt.sign(
    {
      sub: user._id.toString(),
      jti: crypto.randomUUID(),
      type: "refresh",
    },
    getRefreshSecret(),
    { expiresIn: expiresInSeconds },
  );

  return {
    token,
    expiresAt: new Date(Date.now() + expiresInSeconds * 1000),
  };
};

const verifyAccessToken = (token) => jwt.verify(token, getAccessSecret());
const verifyRefreshToken = (token) => jwt.verify(token, getRefreshSecret());
const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

module.exports = {
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
