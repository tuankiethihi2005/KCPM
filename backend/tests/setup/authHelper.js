const User = require("../../src/models/UserModel");
const { hashPassword } = require("../../src/modules/auth/utils/password");
const { signAccessToken } = require("../../src/modules/auth/utils/token");

const createAuthenticatedUser = async (overrides = {}) => {
  const user = await User.create({
    name: "Test User",
    email: `user-${Date.now()}-${Math.random()}@example.com`,
    password: await hashPassword("password123"),
    role: "Mangaka",
    status: "Active",
    ...overrides,
  });

  return {
    user,
    accessToken: signAccessToken(user),
  };
};

const withAuth = (requestBuilder, accessToken) =>
  requestBuilder.set("Authorization", `Bearer ${accessToken}`);

module.exports = {
  createAuthenticatedUser,
  withAuth,
};
