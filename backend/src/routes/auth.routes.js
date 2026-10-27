const express = require("express");
const authController = require("../modules/auth/controllers/auth.controller");
const { ROLES } = require("../constants/roles");
const { requireAuth } = require("../modules/auth/middlewares/requireAuth");
const { requireRole } = require("../modules/authorization/middlewares/requireRole");

const router = express.Router();

router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.post("/refresh", authController.refresh);
router.get("/me", requireAuth, authController.me);
router.get(
  "/users",
  requireAuth,
  requireRole(ROLES.ADMIN),
  authController.listUsersWithFilter,
);
router.post(
  "/users",
  requireAuth,
  requireRole(ROLES.ADMIN),
  authController.createUser,
);
router.post(
  "/users/:id/reset-password",
  requireAuth,
  requireRole(ROLES.ADMIN),
  authController.resetPassword,
);
// Cập nhật thông tin user
router.put(
  "/users/:id",
  requireAuth,
  requireRole(ROLES.ADMIN),
  authController.updateUser,
);

// Khóa/Mở khóa/Xóa tài khoản
router.patch(
  "/users/:id/status",
  requireAuth,
  requireRole(ROLES.ADMIN),
  authController.updateUserStatus,
);
router.delete(
  "/users/:id",
  requireAuth,
  requireRole(ROLES.ADMIN),
  authController.deleteUser,
);

module.exports = router;
