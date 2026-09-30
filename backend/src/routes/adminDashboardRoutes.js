const express = require("express");
const { requireAuth } = require("../modules/auth/middlewares/requireAuth");
const { requireRole } = require("../modules/authorization/middlewares/requireRole");
const { ROLES } = require("../constants/roles");
const dashboardController = require("../controllers/adminDashboardController");

const router = express.Router();

router.use(requireAuth);
router.use(requireRole(ROLES.ADMIN));

router.get("/dashboard-stats", dashboardController.getDashboardStats);

module.exports = router;
