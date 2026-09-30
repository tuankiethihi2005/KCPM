const express = require("express");
const { ROLES } = require("../constants/roles");
const { requireAuth } = require("../modules/auth/middlewares/requireAuth");
const {
  requireRole,
} = require("../modules/authorization/middlewares/requireRole");
const {
  requireChapterScope,
  requireSeriesScope,
} = require("../modules/authorization/middlewares/scope");
const createChapter = require("../controllers/chapter/createChapter");
const getChapterById = require("../controllers/chapter/getChapterById");
const getChaptersBySeries = require("../controllers/chapter/getChaptersBySeries");
const getChapterProgressStats = require("../controllers/chapter/getChapterProgressStats");
const updateChapterStatus = require("../controllers/chapter/updateChapterStatus");
const deleteChapter = require("../controllers/chapter/deleteChapter");
const restoreChapter = require("../controllers/chapter/restoreChapter");

const router = express.Router();

router.use(requireAuth);

router.put(
  "/update-status/:chapter_id",
  requireRole(ROLES.MANGAKA, ROLES.TANTOU_EDITOR, ROLES.ADMIN),
  requireChapterScope("chapter_id", "write"),
  updateChapterStatus.updateChapterStatus,
);

router.post(
  "/create",
  requireRole(ROLES.MANGAKA, ROLES.ADMIN),
  createChapter.Chapter,
);

router.get(
  "/series/:series_id",
  requireRole(
    ROLES.MANGAKA,
    ROLES.ASSISTANT,
    ROLES.TANTOU_EDITOR,
    ROLES.EDITORIAL_BOARD,
    ROLES.ADMIN,
  ),
  requireSeriesScope("series_id", "read"),
  getChaptersBySeries.getChaptersBySeries,
);

router.get(
  "/:chapter_id/progress-stats",
  requireRole(
    ROLES.MANGAKA,
    ROLES.ASSISTANT,
    ROLES.TANTOU_EDITOR,
    ROLES.EDITORIAL_BOARD,
    ROLES.ADMIN,
  ),
  requireChapterScope("chapter_id", "read"),
  getChapterProgressStats.getChapterProgressStats,
);

router.get(
  "/:chapter_id",
  requireRole(
    ROLES.MANGAKA,
    ROLES.ASSISTANT,
    ROLES.TANTOU_EDITOR,
    ROLES.EDITORIAL_BOARD,
    ROLES.ADMIN,
  ),
  requireChapterScope("chapter_id", "read"),
  getChapterById.getChapterById,
);

router.delete(
  "/:chapter_id",
  requireRole(ROLES.MANGAKA, ROLES.ADMIN),
  requireChapterScope("chapter_id", "write"),
  deleteChapter.deleteChapter,
);

router.put(
  "/restore/:chapter_id",
  requireRole(ROLES.MANGAKA, ROLES.ADMIN),
  requireChapterScope("chapter_id", "write"),
  restoreChapter.restoreChapter,
);

module.exports = router;
