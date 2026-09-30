const express = require("express");
const multer = require("multer");
const { requireAuth } = require("../modules/auth/middlewares/requireAuth");
const {
  getReleaseIssues,
  createReleaseIssue,
  importVoteData,
} = require("../controllers/IssueController");
const { checkRole } = require("../middlewares/AuthMiddleware");

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.use(requireAuth);

router.get("/", checkRole(["Editorial Board", "Admin"]), getReleaseIssues);
router.post("/", checkRole(["Editorial Board", "Admin"]), createReleaseIssue);
router.post(
  "/:issueId/import-votes",
  checkRole(["Editorial Board", "Admin"]),
  upload.single("file"),
  importVoteData,
);

module.exports = router;
