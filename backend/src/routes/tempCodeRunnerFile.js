const express = require("express");
const { ROLES } = require("../constants/roles");
const { requireAuth } = require("../modules/auth/middlewares/requireAuth");
const { requireRole } = require("../modules/authorization/middlewares/requireRole");
const { requirePageScope } = require("../modules/authorization/middlewares/scope");
const regionController = require("../controllers/region/regionController");

const router = express.Router();

router.use(requireAuth);

// 1. Lấy danh sách vùng phân phối theo trang truyện
router.get(
  "/page/:page_id",
  requireRole(ROLES.MANGAKA, ROLES.ASSISTANT, ROLES.TANTOU_EDITOR, ROLES.EDITORIAL_BOARD, ROLES.ADMIN),
  regionController.getRegionsByPage
);

// 2. Tạo phân vùng mới
router.post(
  "/page/:page_id",
  requireRole(ROLES.MANGAKA, ROLES.ADMIN),
  requirePageScope("page_id", "write"),
  regionController.createRegion
);

// 3. Xóa phân vùng
router.delete(
  "/:id",
  requireRole(ROLES.MANGAKA, ROLES.ADMIN),
  regionController.deleteRegion
);

module.exports = router;
