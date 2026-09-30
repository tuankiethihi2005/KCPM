const request = require("supertest");
const express = require("express");
const mongoose = require("mongoose");
const { connectDB, closeDB, clearDB } = require("./setup/dbSetup");
const { createAuthenticatedUser, withAuth } = require("./setup/authHelper");
const publishRoutes = require("../src/routes/publish.routes");
const Series = require("../src/models/SeriesModel");
const Chapter = require("../src/models/ChapterModel");
const Page = require("../src/models/PageModel");
const Task = require("../src/models/TaskModel");
const Annotation = require("../src/models/AnnotationModel");

const app = express();
app.use(express.json());
app.use("/api/publish", publishRoutes);

beforeAll(async () => await connectDB());
afterEach(async () => await clearDB());
afterAll(async () => await closeDB());

describe("Publish API Tests", () => {
  let accessToken;
  let user;
  let series;
  const fakeUserId = new mongoose.Types.ObjectId();
  const fakeRegionId = new mongoose.Types.ObjectId();

  beforeEach(async () => {
    ({ accessToken, user } = await createAuthenticatedUser({
      role: "Tantou Editor",
    }));
    series = await Series.create({
      title: "Publish Test Series",
      author_id: fakeUserId,
      editor_id: user._id,
      status: "Draft",
    });
  });

  it("blocks publish when there are unapproved pages", async () => {
    const chapter = await Chapter.create({
      series_id: series._id,
      chapter_number: 1,
      title: "Chapter Loi Trang",
      deadline: new Date(),
    });

    await Page.create({
      chapter_id: chapter._id,
      page_number: 1,
      current_source_file_url: "link1.psd",
      current_preview_url: "link1.png",
      status: "Approved",
    });
    await Page.create({
      chapter_id: chapter._id,
      page_number: 2,
      current_source_file_url: "link2.psd",
      current_preview_url: "link2.png",
      status: "Draft",
    });

    const response = await withAuth(
      request(app).post(`/api/publish/chapter/${chapter._id}`),
      accessToken,
    ).send({ release_issue_id: new mongoose.Types.ObjectId() });

    expect(response.status).toBe(400);
  });

  it("blocks publish when assistant tasks are unfinished", async () => {
    const chapter = await Chapter.create({
      series_id: series._id,
      title: "Ten gi cung duoc",
      chapter_number: 2,
      deadline: new Date(),
    });

    const page = await Page.create({
      chapter_id: chapter._id,
      page_number: 1,
      current_source_file_url: "link.psd",
      current_preview_url: "link.png",
      status: "Approved",
    });

    await Task.create({
      page_id: page._id,
      region_id: fakeRegionId,
      assigned_to: fakeUserId,
      assigned_by: fakeUserId,
      task_type: "To nen",
      deadline: new Date(),
      status: "In Progress",
    });

    const response = await withAuth(
      request(app).post(`/api/publish/chapter/${chapter._id}`),
      accessToken,
    ).send({ release_issue_id: new mongoose.Types.ObjectId() });

    expect(response.status).toBe(400);
  });

  it("blocks publish when editor annotations are unresolved", async () => {
    const chapter = await Chapter.create({
      series_id: series._id,
      title: "Ten gi cung duoc",
      chapter_number: 3,
      deadline: new Date(),
    });
    const page = await Page.create({
      chapter_id: chapter._id,
      page_number: 1,
      current_source_file_url: "link.psd",
      current_preview_url: "link.png",
      status: "Approved",
    });

    await Task.create({
      page_id: page._id,
      region_id: fakeRegionId,
      assigned_to: fakeUserId,
      assigned_by: fakeUserId,
      task_type: "Di net",
      deadline: new Date(),
      status: "Approved",
    });

    await Annotation.create({
      page_id: page._id,
      created_by: fakeUserId,
      role: "Tantou Editor",
      coordinates: "x:10, y:20",
      comment: "Cho nay ve sai tay roi",
      status: "Open",
    });

    const response = await withAuth(
      request(app).post(`/api/publish/chapter/${chapter._id}`),
      accessToken,
    ).send({ release_issue_id: new mongoose.Types.ObjectId() });

    expect(response.status).toBe(400);
  });

  it("publishes chapter when all checks pass", async () => {
    const chapter = await Chapter.create({
      series_id: series._id,
      chapter_number: 4,
      title: "Chapter Hoan Hao",
      deadline: new Date(),
      status: "Waiting Review",
    });
    const page = await Page.create({
      chapter_id: chapter._id,
      page_number: 1,
      current_source_file_url: "link.psd",
      current_preview_url: "link.png",
      status: "Approved",
    });

    await Task.create({
      page_id: page._id,
      region_id: fakeRegionId,
      assigned_to: fakeUserId,
      assigned_by: fakeUserId,
      task_type: "Ve bong",
      deadline: new Date(),
      status: "Approved",
    });

    await Annotation.create({
      page_id: page._id,
      created_by: fakeUserId,
      role: "Tantou Editor",
      coordinates: "0,0",
      comment: "Sua toc",
      status: "Resolved",
    });

    const response = await withAuth(
      request(app).post(`/api/publish/chapter/${chapter._id}`),
      accessToken,
    ).send({ release_issue_id: "60d21b4667d0d8992e610c85" });

    expect(response.status).toBe(200);
    expect(response.body.chapter.status).toBe("Published");
  });
});
