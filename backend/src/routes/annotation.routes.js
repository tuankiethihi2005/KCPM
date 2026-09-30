const express = require("express");
const { ROLES } = require("../constants/roles");
const { requireAuth } = require("../modules/auth/middlewares/requireAuth");
const {
  requireRole,
} = require("../modules/authorization/middlewares/requireRole");
const {
  requirePageScope,
} = require("../modules/authorization/middlewares/scope");
const annotationController = require("../controllers/annotation/annotationController");

/**
 * Annotation Routes - /api/annotations
 *
 * Tất cả route đều yêu cầu đăng nhập (requireAuth).
 *
 * GET    /api/annotations/page/:page_id        → Lấy ds annotation theo trang
 * GET    /api/annotations/chapter/:chapter_id  → Lấy ds annotation theo chương
 * POST   /api/annotations/page/:page_id        → Thêm annotation mới
 * PATCH  /api/annotations/:id                  → Sửa annotation
 * DELETE /api/annotations/:id                  → Xóa annotation
 */

const router = express.Router();

// Tất cả các route đều cần xác thực
router.use(requireAuth);

// ─────────────────────────────────────────────────────────────
// GET /api/annotations/page/:page_id
// Lấy danh sách annotation theo trang truyện
// ─────────────────────────────────────────────────────────────
router.get(
  "/page/:page_id",
  requireRole(
    ROLES.MANGAKA,
    ROLES.TANTOU_EDITOR,
    ROLES.EDITORIAL_BOARD,
    ROLES.ADMIN,
    ROLES.ASSISTANT,
  ),
  annotationController.getAnnotationsByPage,
);

// ─────────────────────────────────────────────────────────────
// GET /api/annotations/chapter/:chapter_id
// Lấy danh sách annotation theo chương truyện
// ─────────────────────────────────────────────────────────────
router.get(
  "/chapter/:chapter_id",
  requireRole(
    ROLES.MANGAKA,
    ROLES.TANTOU_EDITOR,
    ROLES.EDITORIAL_BOARD,
    ROLES.ADMIN,
    ROLES.ASSISTANT,
  ),
  annotationController.getAnnotationsByChapter,
);

// ─────────────────────────────────────────────────────────────
// POST /api/annotations/page/:page_id
// Thêm annotation mới trên trang truyện
// ─────────────────────────────────────────────────────────────
router.post(
  "/page/:page_id",
  requireRole(ROLES.MANGAKA, ROLES.TANTOU_EDITOR, ROLES.ADMIN),
  requirePageScope("page_id", "write"),
  annotationController.createAnnotation,
);

// ─────────────────────────────────────────────────────────────
// PATCH /api/annotations/:id
// Sửa annotation (nội dung, trạng thái, deadline, tọa độ)
// ─────────────────────────────────────────────────────────────
router.patch(
  "/:id",
  requireRole(ROLES.MANGAKA, ROLES.TANTOU_EDITOR, ROLES.ADMIN),
  annotationController.updateAnnotation,
);

// ─────────────────────────────────────────────────────────────
// DELETE /api/annotations/:id
// Xóa annotation
// ─────────────────────────────────────────────────────────────
router.delete(
  "/:id",
  requireRole(ROLES.TANTOU_EDITOR, ROLES.ADMIN),
  annotationController.deleteAnnotation,
);

router.patch(
  "/:id/restore",
  requireRole(ROLES.TANTOU_EDITOR, ROLES.ADMIN),
  annotationController.restoreAnnotation,
);

module.exports = router;
