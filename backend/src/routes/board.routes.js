const express = require("express");
const { ROLES } = require("../constants/roles");
const { requireAuth } = require("../modules/auth/middlewares/requireAuth");
const { requireRole } = require("../modules/authorization/middlewares/requireRole");
const getPendingSeries = require("../controllers/board/getPendingSeries");
const getBoardSeriesDetail = require("../controllers/board/getBoardSeriesDetail");
const castVote = require("../controllers/board/castVote");
const finalizeSeries = require("../controllers/board/finalizeSeries");

const router = express.Router();

router.use(requireAuth);
router.use(requireRole(ROLES.EDITORIAL_BOARD, ROLES.ADMIN));

router.get("/series/pending", getPendingSeries.getPendingSeries);
router.get("/series/:id", getBoardSeriesDetail.getBoardSeriesDetail);
router.post("/series/:id/vote", castVote.castVote);
router.post("/series/:id/finalize", finalizeSeries.finalizeSeries);

module.exports = router;
