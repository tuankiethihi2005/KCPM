const express = require("express");
const { requireAuth } = require("../modules/auth/middlewares/requireAuth");
const {
  getLeaderboard,
  getPerformanceChartData,
} = require("../controllers/RankingController");
const { checkRole } = require("../middlewares/AuthMiddleware");

const router = express.Router();

router.use(requireAuth);

router.get(
  "/",
  checkRole(["Editorial Board", "Mangaka", "Tantou Editor", "Admin"]),
  getLeaderboard,
);
router.get(
  "/performance/:seriesId",
  checkRole(["Editorial Board", "Mangaka", "Tantou Editor", "Admin"]),
  getPerformanceChartData,
);

module.exports = router;
