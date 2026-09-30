const express = require("express");
const { ROLES } = require("../constants/roles");
const { requireAuth } = require("../modules/auth/middlewares/requireAuth");
const {
  requireRole,
} = require("../modules/authorization/middlewares/requireRole");
const {
  requireChapterScope,
} = require("../modules/authorization/middlewares/scope");
const publishChapter = require("../controllers/publish/publishChapter");

const router = express.Router();

router.use(requireAuth);
router.post(
  "/chapter/:chapter_id",
  requireRole(ROLES.TANTOU_EDITOR, ROLES.EDITORIAL_BOARD, ROLES.ADMIN),
  requireChapterScope("chapter_id", "write"),
  publishChapter.publishChapter,
);

module.exports = router;
