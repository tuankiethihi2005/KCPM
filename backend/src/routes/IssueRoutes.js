const express = require("express");
<<<<<<< HEAD
const multer = require("multer");
=======
>>>>>>> origin/main
const { requireAuth } = require("../modules/auth/middlewares/requireAuth");
const {
  getReleaseIssues,
  createReleaseIssue,
  importVoteData,
} = require("../controllers/IssueController");
const { checkRole } = require("../middlewares/AuthMiddleware");
<<<<<<< HEAD

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });
=======
const { votes: voteUpload } = require("../middlewares/upload.middleware");

const router = express.Router();
>>>>>>> origin/main

router.use(requireAuth);

router.get("/", checkRole(["Editorial Board", "Admin"]), getReleaseIssues);
router.post("/", checkRole(["Editorial Board", "Admin"]), createReleaseIssue);
router.post(
  "/:issueId/import-votes",
  checkRole(["Editorial Board", "Admin"]),
<<<<<<< HEAD
  upload.single("file"),
=======
  voteUpload.single("file"),
>>>>>>> origin/main
  importVoteData,
);

module.exports = router;
