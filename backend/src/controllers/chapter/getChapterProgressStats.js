const Annotation = require("../../models/AnnotationModel");
const Page = require("../../models/PageModel");
const Task = require("../../models/TaskModel");

const DONE_TASK_STATUSES = ["Submitted", "Approved", "Paid"];
const TASK_STATUS_BUCKETS = ["Assigned", "In Progress", "Submitted", "Approved", "Revision Requested", "Rejected", "Paid"];

const isTaskDone = (status) => DONE_TASK_STATUSES.includes(status);

const isTaskOverdue = (task, now = new Date()) => {
  if (!task.deadline || isTaskDone(task.status)) return false;
  return new Date(task.deadline) < now;
};

exports.getChapterProgressStats = async (req, res) => {
  try {
    const { chapter_id } = req.params;
    const pages = await Page.find({ chapter_id }).select("_id page_number");
    const pageIds = pages.map((page) => page._id);

    const [tasks, annotations] = await Promise.all([
      Task.find({ page_id: { $in: pageIds } })
        .populate("page_id", "page_number")
        .populate("assigned_to", "name email")
        .sort({ deadline: 1 }),
      Annotation.find({ chapter_id })
        .populate("page_id", "page_number")
        .sort({ createdAt: 1 }),
    ]);

    const taskStatusCounts = TASK_STATUS_BUCKETS.reduce((acc, status) => {
      acc[status] = 0;
      return acc;
    }, {});

    tasks.forEach((task) => {
      taskStatusCounts[task.status] = (taskStatusCounts[task.status] || 0) + 1;
    });

    const resolvedAnnotations = annotations.filter((annotation) => annotation.status === "Resolved").length;
    const unresolvedAnnotations = annotations.length - resolvedAnnotations;
    const doneTasks = tasks.filter((task) => isTaskDone(task.status)).length;
    const totalWorkItems = tasks.length + annotations.length;
    const completedWorkItems = doneTasks + resolvedAnnotations;
    const completionPercent = totalWorkItems > 0
      ? Math.round((completedWorkItems / totalWorkItems) * 100)
      : 0;

    const overdueTasks = tasks.filter((task) => isTaskOverdue(task)).map((task) => ({
      _id: task._id,
      task_type: task.task_type,
      status: task.status,
      deadline: task.deadline,
      page_id: task.page_id,
      assigned_to: task.assigned_to,
    }));

    return res.status(200).json({
      success: true,
      chapter_id,
      totalTasks: tasks.length,
      taskStatusCounts,
      annotations: {
        total: annotations.length,
        resolved: resolvedAnnotations,
        unresolved: unresolvedAnnotations,
      },
      completionPercent,
      overdueTasks,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Khong the thong ke tien do chapter.",
      error: error.message,
    });
  }
};
