const mongoose = require("mongoose");
const Annotation = require("../../models/AnnotationModel");
const Chapter = require("../../models/ChapterModel");
const Page = require("../../models/PageModel");
const Series = require("../../models/SeriesModel");
const Task = require("../../models/TaskModel");
const { ROLES } = require("../../constants/roles");

const DONE_TASK_STATUSES = ["Submitted", "Approved", "Paid"];

const toObjectId = (id) => new mongoose.Types.ObjectId(String(id));

const buildRoleFilter = async (user) => {
  if (user.role === ROLES.ADMIN || user.role === ROLES.EDITORIAL_BOARD) {
    return {};
  }

  if (user.role === ROLES.MANGAKA) {
    return { author_id: toObjectId(user.id) };
  }

  if (user.role === ROLES.TANTOU_EDITOR) {
    return { editor_id: toObjectId(user.id) };
  }

  if (user.role === ROLES.ASSISTANT) {
    const tasks = await Task.find({ assigned_to: user.id }).select("page_id");
    const pageIds = tasks.map((task) => task.page_id);

    if (pageIds.length === 0) {
      return { _id: { $in: [] } };
    }

    const pages = await Page.find({ _id: { $in: pageIds } }).select("chapter_id");
    const chapterIds = pages.map((page) => page.chapter_id);
    const chapters = await Chapter.find({ _id: { $in: chapterIds } }).select("series_id");
    const seriesIds = [...new Set(chapters.map((chapter) => String(chapter.series_id)))];

    return { _id: { $in: seriesIds.map(toObjectId) } };
  }

  return { _id: { $in: [] } };
};

const buildSort = (sort) => {
  if (sort === "progress_desc") return { progress: -1, updatedAt: -1 };
  if (sort === "title_asc") return { title: 1 };
  if (sort === "updated_desc") return { updatedAt: -1 };
  return { attentionScore: -1, progress: 1, updatedAt: -1 };
};

exports.getSeriesProgress = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "10", 10), 1), 50);
    const skip = (page - 1) * limit;
    const search = String(req.query.search || "").trim();
    const filter = String(req.query.filter || "attention");
    const sort = String(req.query.sort || "attention");

    const roleFilter = await buildRoleFilter(req.user);
    const match = { ...roleFilter };

    if (search) {
      match.title = { $regex: search, $options: "i" };
    }

    const rawRows = await Series.aggregate([
      { $match: match },
      {
        $lookup: {
          from: "chapters",
          localField: "_id",
          foreignField: "series_id",
          as: "chapters",
        },
      },
      {
        $lookup: {
          from: "pages",
          localField: "chapters._id",
          foreignField: "chapter_id",
          as: "pages",
        },
      },
      {
        $lookup: {
          from: "tasks",
          localField: "pages._id",
          foreignField: "page_id",
          as: "tasks",
        },
      },
      {
        $lookup: {
          from: "annotations",
          localField: "chapters._id",
          foreignField: "chapter_id",
          as: "annotations",
        },
      },
      {
        $addFields: {
          totalTasks: { $size: "$tasks" },
          doneTasks: {
            $size: {
              $filter: {
                input: "$tasks",
                as: "task",
                cond: { $in: ["$$task.status", DONE_TASK_STATUSES] },
              },
            },
          },
          totalAnnotations: { $size: "$annotations" },
          resolvedAnnotations: {
            $size: {
              $filter: {
                input: "$annotations",
                as: "annotation",
                cond: { $eq: ["$$annotation.status", "Resolved"] },
              },
            },
          },
          overdueTasks: {
            $size: {
              $filter: {
                input: "$tasks",
                as: "task",
                cond: {
                  $and: [
                    { $not: [{ $in: ["$$task.status", DONE_TASK_STATUSES] }] },
                    { $lt: ["$$task.deadline", new Date()] },
                  ],
                },
              },
            },
          },
        },
      },
      {
        $addFields: {
          totalWorkItems: { $add: ["$totalTasks", "$totalAnnotations"] },
          completedWorkItems: { $add: ["$doneTasks", "$resolvedAnnotations"] },
        },
      },
      {
        $addFields: {
          progress: {
            $cond: [
              { $gt: ["$totalWorkItems", 0] },
              {
                $round: [
                  {
                    $multiply: [
                      { $divide: ["$completedWorkItems", "$totalWorkItems"] },
                      100,
                    ],
                  },
                  0,
                ],
              },
              0,
            ],
          },
          attentionScore: {
            $add: [
              { $multiply: ["$overdueTasks", 1000] },
              { $subtract: [100, {
                $cond: [
                  { $gt: ["$totalWorkItems", 0] },
                  {
                    $round: [
                      {
                        $multiply: [
                          { $divide: ["$completedWorkItems", "$totalWorkItems"] },
                          100,
                        ],
                      },
                      0,
                    ],
                  },
                  0,
                ],
              }] },
            ],
          },
        },
      },
      {
        $match: filter === "at_risk"
          ? { $or: [{ overdueTasks: { $gt: 0 } }, { progress: { $lt: 50 } }] }
          : filter === "low_progress"
            ? { progress: { $lt: 50 } }
            : {},
      },
      {
        $facet: {
          items: [
            { $sort: buildSort(sort) },
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                _id: 0,
                id: "$_id",
                title: 1,
                progress: 1,
                status: 1,
                risk_status: 1,
                totalChapters: { $size: "$chapters" },
                totalTasks: 1,
                overdueTasks: 1,
                updatedAt: 1,
              },
            },
          ],
          total: [{ $count: "count" }],
        },
      },
    ]);

    const result = rawRows[0] || { items: [], total: [] };
    const total = result.total[0]?.count || 0;

    return res.status(200).json({
      success: true,
      items: result.items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Khong the tai tien do series.",
      error: error.message,
    });
  }
};
