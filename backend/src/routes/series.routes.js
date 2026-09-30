const express = require("express");
const { ROLES } = require("../constants/roles");
const { requireAuth } = require("../modules/auth/middlewares/requireAuth");
const {
  requireRole,
} = require("../modules/authorization/middlewares/requireRole");
const {
  requireSeriesScope,
} = require("../modules/authorization/middlewares/scope");
const createSeries = require("../controllers/series/createSeries");
const getMySeries = require("../controllers/series/getMySeries");
const getSeriesByRole = require("../controllers/series/getSeriesByRole");
const getSeriesById = require("../controllers/series/getSeriesById");
const updateSeries = require("../controllers/series/updateSeries");
const listEditors = require("../controllers/series/listEditors");
const upsertProposal = require("../controllers/series/upsertProposal");
const submitProposal = require("../controllers/series/submitProposal");
const uploadCover = require("../controllers/series/uploadCover");
const getAtRiskSeries = require("../controllers/series/getAtRiskSeries");
const getSeriesProgress = require("../controllers/series/getSeriesProgress");
const updateSeriesStatus = require("../controllers/series/updateSeriesStatus");
const lifecycleVote = require("../controllers/series/lifecycleVote");
const upload = require("../middlewares/upload.middleware");

const router = express.Router();

router.use(requireAuth);

router.post("/", requireRole(ROLES.MANGAKA), createSeries.createSeries);
router.get(
  "/mine",
  requireRole(ROLES.MANGAKA, ROLES.ADMIN),
  getMySeries.getMySeries,
);
router.get(
  "/mine/:author_id",
  requireRole(ROLES.ADMIN),
  getMySeries.getSeriesByAuthor,
);
router.get(
  "/editor",
  requireRole(ROLES.TANTOU_EDITOR),
  getSeriesByRole.getEditorSeries,
);
router.get("/all", getSeriesByRole.getAllSeries);
router.get(
  "/assistant",
  requireRole(ROLES.ASSISTANT),
  getSeriesByRole.getAssistantSeries,
);
router.get(
  "/editors",
  requireRole(
    ROLES.MANGAKA,
    ROLES.TANTOU_EDITOR,
    ROLES.EDITORIAL_BOARD,
    ROLES.ADMIN,
  ),
  listEditors.listEditors,
);
router.get(
  "/at-risk",
  requireRole(ROLES.EDITORIAL_BOARD, ROLES.ADMIN),
  getAtRiskSeries.getAtRiskSeries,
);
router.get(
  "/progress",
  requireRole(
    ROLES.MANGAKA,
    ROLES.ASSISTANT,
    ROLES.TANTOU_EDITOR,
    ROLES.EDITORIAL_BOARD,
    ROLES.ADMIN,
  ),
  getSeriesProgress.getSeriesProgress,
);
router.patch(
  "/:id/status",
  requireRole(ROLES.EDITORIAL_BOARD, ROLES.ADMIN),
  updateSeriesStatus.updateSeriesStatus,
);
router.get(
  "/:id/lifecycle-votes",
  requireRole(ROLES.EDITORIAL_BOARD, ROLES.ADMIN),
  lifecycleVote.getLifecycleVotes,
);
router.post(
  "/:id/lifecycle-vote",
  requireRole(ROLES.EDITORIAL_BOARD, ROLES.ADMIN),
  lifecycleVote.castLifecycleVote,
);
router.get(
  "/:id",
  requireRole(ROLES.MANGAKA, ROLES.TANTOU_EDITOR, ROLES.EDITORIAL_BOARD, ROLES.ADMIN),
  requireSeriesScope("id", "read"),
  getSeriesById.getSeriesById,
);
router.put(
  "/:id",
  requireRole(ROLES.MANGAKA),
  requireSeriesScope("id", "write"),
  updateSeries.updateSeries,
);
router.put(
  "/:id/proposal",
  requireRole(ROLES.MANGAKA),
  requireSeriesScope("id", "write"),
  upsertProposal.upsertProposal,
);
router.post(
  "/:id/proposal/submit",
  requireRole(ROLES.MANGAKA),
  requireSeriesScope("id", "write"),
  submitProposal.submitProposal,
);
router.post(
  "/:id/proposal/upload-cover",
  requireRole(ROLES.MANGAKA),
  requireSeriesScope("id", "write"),
  upload.single("cover"),
  uploadCover.uploadCover,
);

module.exports = router;
