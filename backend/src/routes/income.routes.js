const express = require("express");
const { ROLES } = require("../constants/roles");
const { requireAuth } = require("../modules/auth/middlewares/requireAuth");
const { requireRole } = require("../modules/authorization/middlewares/requireRole");
const incomeController = require("../controllers/income/incomeController");

const router = express.Router();

router.use(requireAuth);

router.get(
  "/my",
  requireRole(ROLES.ASSISTANT, ROLES.ADMIN),
  incomeController.getAssistantIncome
);

module.exports = router;
