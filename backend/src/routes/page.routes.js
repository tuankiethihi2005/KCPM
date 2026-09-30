const express = require("express");
const { ROLES } = require("../constants/roles");
const { requireAuth } = require("../modules/auth/middlewares/requireAuth");
const {
  requireRole,
} = require("../modules/authorization/middlewares/requireRole");
const {
  requireChapterScope,
  requirePageScope,
} = require("../modules/authorization/middlewares/scope");
const uploadPages = require("../controllers/page/uploadPages");
const updatePageVersion = require("../controllers/page/updatePageVersion");
const approvePage = require("../controllers/page/approvedPage");
const getPagesByChapter = require("../controllers/page/getPagesByChapter");
const getPageById = require("../controllers/page/getPageById");
const upload = require("../middlewares/upload.middleware");
const getPageVersions = require("../controllers/page/getPageVersions");
const deletePage = require("../controllers/page/deletePage");
const restorePage = require("../controllers/page/restorePage");

const router = express.Router();

router.use(requireAuth);

router.get(
  "/:page_id",
  requireRole(
    ROLES.MANGAKA,
    ROLES.ASSISTANT,
    ROLES.TANTOU_EDITOR,
    ROLES.EDITORIAL_BOARD,
    ROLES.ADMIN,
  ),
  getPageById.getPageById,
);

router.get(
  "/chapter/:chapter_id",
  requireRole(
    ROLES.MANGAKA,
    ROLES.ASSISTANT,
    ROLES.TANTOU_EDITOR,
    ROLES.EDITORIAL_BOARD,
    ROLES.ADMIN,
  ),
  requireChapterScope("chapter_id", "read"),
  getPagesByChapter.getPagesByChapter,
);

router.post(
  "/upload/:chapter_id/upload",
  requireRole(ROLES.MANGAKA, ROLES.ADMIN),
  requireChapterScope("chapter_id", "write"),
  upload.fields([
    { name: "source_file", maxCount: 1 }, // Bắt buộc: File PSD/CLIP
    { name: "attached_resource", maxCount: 1 }, // Tùy chọn: File ZIP
  ]),
  uploadPages.uploadPages,
);

router.put(
  "/update/:page_id",
  requireRole(ROLES.MANGAKA, ROLES.ASSISTANT, ROLES.ADMIN),
  requirePageScope("page_id", "write"),
  upload.fields([
    { name: "source_file", maxCount: 1 }, // Bản thảo mới (bắt buộc)
    { name: "attached_resource", maxCount: 1 }, // Tài nguyên mới (tùy chọn)
  ]),
  updatePageVersion.updatePageVersion,
);

router.put(
  "/approve/:page_id",
  requireRole(ROLES.MANGAKA, ROLES.ADMIN, ROLES.TANTOU_EDITOR),
  requirePageScope("page_id", "write"),
  approvePage.approvePage,
);

router.get(
  "/:page_id/versions",
  requireRole(
    ROLES.MANGAKA,
    ROLES.ASSISTANT,
    ROLES.ADMIN,
    ROLES.EDITORIAL_BOARD,
    ROLES.TANTOU_EDITOR,
  ),
  requirePageScope("page_id", "read"),
  getPageVersions.getPageVersions,
);

router.delete(
  "/:page_id",
  requireRole(ROLES.MANGAKA, ROLES.ADMIN),
  deletePage.deletePage,
);

// Khôi phục (Dùng PUT vì đây là hành động cập nhật trạng thái)
router.put(
  "/:page_id/restore",
  requireRole(ROLES.MANGAKA, ROLES.ADMIN),
  restorePage.restorePage,
);

module.exports = router;
