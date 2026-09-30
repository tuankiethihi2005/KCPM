const request = require("supertest");
const express = require("express");
const mongoose = require("mongoose");
const { connectDB, closeDB, clearDB } = require("./setup/dbSetup");
const { createAuthenticatedUser, withAuth } = require("./setup/authHelper");
const chapterRoutes = require("../src/routes/chapter.routes");
const Chapter = require("../src/models/ChapterModel");
const Series = require("../src/models/SeriesModel");

const app = express();
app.use(express.json());
app.use("/api/chapters", chapterRoutes);

beforeAll(async () => await connectDB());
afterEach(async () => await clearDB());
afterAll(async () => await closeDB());

describe("Chapter API Tests", () => {
  let accessToken;
  let user;
  let series;

  beforeEach(async () => {
    ({ accessToken, user } = await createAuthenticatedUser());
    series = await Series.create({
      title: "Owned Series",
      author_id: user._id,
      status: "Draft",
    });
  });

  it("creates a new chapter successfully", async () => {
    const newChapterData = {
      series_id: series._id.toString(),
      chapter_number: 1,
      title: "Khoi dau moi",
      deadline: "2026-12-31",
    };

    const response = await withAuth(
      request(app).post("/api/chapters/create"),
      accessToken,
    ).send(newChapterData);

    expect(response.status).toBe(201);
    expect(response.body.chapter.title).toBe("Khoi dau moi");

    const savedChapter = await Chapter.findOne({ title: "Khoi dau moi" });
    expect(savedChapter).not.toBeNull();
  });

  it("updates chapter status successfully", async () => {
    const chapter = new Chapter({
      series_id: series._id,
      chapter_number: 2,
      title: "Chapter can doi trang thai",
      deadline: "2026-12-31",
    });
    await chapter.save();

    const response = await withAuth(
      request(app).put(`/api/chapters/update-status/${chapter._id}`),
      accessToken,
    ).send({ status: "In Production" });

    expect(response.status).toBe(200);
    expect(response.body.chapter.status).toBe("In Production");

    const updatedChapter = await Chapter.findById(chapter._id);
    expect(updatedChapter.status).toBe("In Production");
  });

  it("returns 400 for invalid chapter status", async () => {
    const chapter = new Chapter({
      series_id: series._id,
      chapter_number: 3,
      title: "Chapter test loi enum",
      deadline: "2026-12-31",
    });
    await chapter.save();

    const response = await withAuth(
      request(app).put(`/api/chapters/update-status/${chapter._id}`),
      accessToken,
    ).send({ status: "Done" });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Trạng thái không hợp lệ");
  });

  it("returns 404 when chapter is not found", async () => {
    const fakeId = new mongoose.Types.ObjectId();

    const response = await withAuth(
      request(app).put(`/api/chapters/update-status/${fakeId}`),
      accessToken,
    ).send({ status: "In Production" });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Không tìm thấy chapter");
  });
});
