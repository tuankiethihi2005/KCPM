const express = require("express");
const { requireAuth } = require("../modules/auth/middlewares/requireAuth");
const {
  getReleaseIssues,
  createReleaseIssue,
  importVoteData,
} = require("../controllers/IssueController");
const { checkRole } = require("../middlewares/AuthMiddleware");
const { votes: voteUpload } = require("../middlewares/upload.middleware");

const router = express.Router();

router.use(requireAuth);

router.get("/", checkRole(["Editorial Board", "Admin"]), getReleaseIssues);
router.post("/", checkRole(["Editorial Board", "Admin"]), createReleaseIssue);
router.post(
  "/:issueId/import-votes",
  checkRole(["Editorial Board", "Admin"]),
  voteUpload.single("file"),
  importVoteData,
);

module.exports = router;
