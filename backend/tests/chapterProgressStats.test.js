const request = require("supertest");
const express = require("express");
const mongoose = require("mongoose");
const { connectDB, closeDB, clearDB } = require("./setup/dbSetup");
const { createAuthenticatedUser, withAuth } = require("./setup/authHelper");
const chapterRoutes = require("../src/routes/chapter.routes");
const Annotation = require("../src/models/AnnotationModel");
const Chapter = require("../src/models/ChapterModel");
const Page = require("../src/models/PageModel");
const PageRegion = require("../src/models/PageRegionModel");
const Series = require("../src/models/SeriesModel");
const Task = require("../src/models/TaskModel");

const app = express();
app.use(express.json());
app.use("/api/chapters", chapterRoutes);

beforeAll(async () => await connectDB());
afterEach(async () => await clearDB());
afterAll(async () => await closeDB());

describe("Chapter progress stats API", () => {
  it("returns task counts, annotation counts, completion percent, and overdue tasks", async () => {
    const { accessToken, user } = await createAuthenticatedUser({ role: "Tantou Editor" });
    const assistantId = new mongoose.Types.ObjectId();

    const series = await Series.create({
      title: "Progress Test Series",
      author_id: new mongoose.Types.ObjectId(),
      editor_id: user._id,
      status: "Active",
    });

    const chapter = await Chapter.create({
      series_id: series._id,
      chapter_number: 1,
      title: "Progress Chapter",
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: "In Production",
    });

    const page = await Page.create({
      chapter_id: chapter._id,
      page_number: 1,
      current_source_file_url: "https://example.com/source.psd",
      current_preview_url: "https://example.com/preview.jpg",
      status: "In Progress",
    });

    const region = await PageRegion.create({
      page_id: page._id,
      coordinates: JSON.stringify({ x: 0, y: 0, width: 50, height: 50 }),
      region_type: "panel",
      created_by: user._id,
    });

    await Task.create([
      {
        page_id: page._id,
        region_id: region._id,
        assigned_to: assistantId,
        assigned_by: user._id,
        task_type: "Background",
        deadline: new Date(Date.now() - 24 * 60 * 60 * 1000),
        status: "Assigned",
      },
      {
        page_id: page._id,
        region_id: region._id,
        assigned_to: assistantId,
        assigned_by: user._id,
        task_type: "Line art",
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
        status: "Approved",
      },
    ]);

    await Annotation.create([
      {
        chapter_id: chapter._id,
        page_id: page._id,
        x: 10,
        y: 15,
        content: "Fix speech bubble",
        status: "Resolved",
        created_by: user._id,
      },
      {
        chapter_id: chapter._id,
        page_id: page._id,
        x: 20,
        y: 25,
        content: "Adjust expression",
        status: "Open",
        created_by: user._id,
      },
    ]);

    const response = await withAuth(
      request(app).get(`/api/chapters/${chapter._id}/progress-stats`),
      accessToken,
    );

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.totalTasks).toBe(2);
    expect(response.body.taskStatusCounts.Assigned).toBe(1);
    expect(response.body.taskStatusCounts.Approved).toBe(1);
    expect(response.body.annotations).toEqual({
      total: 2,
      resolved: 1,
      unresolved: 1,
    });
    expect(response.body.completionPercent).toBe(50);
    expect(response.body.overdueTasks).toHaveLength(1);
    expect(response.body.overdueTasks[0].task_type).toBe("Background");
  });
});
