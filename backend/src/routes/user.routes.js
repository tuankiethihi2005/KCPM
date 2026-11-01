const express = require("express");
const authController = require("../modules/auth/controllers/auth.controller");
const { ROLES } = require("../constants/roles");
const { requireAuth } = require("../modules/auth/middlewares/requireAuth");
const { requireRole } = require("../modules/authorization/middlewares/requireRole");

const router = express.Router();

// Tất cả các route /api/users đều yêu cầu đăng nhập và phân quyền ADMIN
router.use(requireAuth);
router.use(requireRole(ROLES.ADMIN));

router.get("/", authController.listUsersWithFilter);
router.post("/", authController.createUser);
router.get("/:id", authController.listUsersWithFilter);
router.put("/:id", authController.updateUser);
router.patch("/:id/status", authController.updateUserStatus);
router.delete("/:id", authController.deleteUser);
router.post("/:id/reset-password", authController.resetPassword);

module.exports = router;
