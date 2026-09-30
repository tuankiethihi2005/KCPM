const express = require("express");
const { ROLES } = require("../constants/roles");
const { requireAuth } = require("../modules/auth/middlewares/requireAuth");
const { requireRole } = require("../modules/authorization/middlewares/requireRole");
const upload = require("../middlewares/upload.middleware");
const taskController = require("../controllers/task/taskController");

const router = express.Router();

router.use(requireAuth);

router.get(
  "/",
  requireRole(
    ROLES.ASSISTANT,
    ROLES.MANGAKA,
    ROLES.TANTOU_EDITOR,
    ROLES.EDITORIAL_BOARD,
    ROLES.ADMIN
  ),
  taskController.getTasks
);

router.get(
  "/assistants",
  requireRole(ROLES.MANGAKA, ROLES.ADMIN),
  taskController.getAssistants
);

router.get(
  "/:id",
  requireRole(ROLES.ASSISTANT, ROLES.MANGAKA, ROLES.ADMIN),
  taskController.getTaskById
);

router.post(
  "/",
  requireRole(ROLES.MANGAKA, ROLES.ADMIN),
  taskController.createTask
);

router.post(
  "/:id/submit",
  requireRole(ROLES.ASSISTANT, ROLES.ADMIN),
  upload.single("file"), // Client uploads completed file as "file" field
  taskController.submitTask
);

router.post(
  "/:id/review",
  requireRole(ROLES.MANGAKA, ROLES.ADMIN),
  taskController.reviewTask
);

router.patch(
  "/:id/status",
  requireRole(ROLES.ASSISTANT, ROLES.MANGAKA, ROLES.TANTOU_EDITOR, ROLES.ADMIN),
  taskController.updateTaskStatus
);

router.delete(
  "/:id",
  requireRole(ROLES.MANGAKA, ROLES.ADMIN),
  taskController.deleteTask
);

module.exports = router;
