jest.mock("../src/middlewares/upload.middleware", () => ({
  single: () => (req, res, next) => {
    req.file = { path: "https://res.cloudinary.com/mock/cover.jpg" };
    next();
  },
}));

const request = require("supertest");
const express = require("express");
const mongoose = require("mongoose");
const { connectDB, closeDB, clearDB } = require("./setup/dbSetup");
const { createAuthenticatedUser, withAuth } = require("./setup/authHelper");
const seriesRoutes = require("../src/routes/series.routes");
const Series = require("../src/models/SeriesModel");
const SeriesProposal = require("../src/models/SeriesProposalModel");
const Chapter = require("../src/models/ChapterModel");
const Page = require("../src/models/PageModel");
const Task = require("../src/models/TaskModel");

const app = express();
app.use(express.json());
app.use("/api/series", seriesRoutes);

beforeAll(async () => await connectDB());
afterEach(async () => await clearDB());
afterAll(async () => await closeDB());

// ... (Giữ nguyên các khối describe Series API Phase 1, Phase 3, Phase 5) ...
// Để gọn gàng tôi chỉ ghi lại phần describe cuối bị lỗi. Bạn vẫn giữ nguyên phần trên nhé!
// BẠN CHỈ CẦN TÌM VÀ SỬA ĐOẠN CODE NÀY TRONG FILE CỦA BẠN:

describe("Series API - Lấy series theo từng role", () => {
  // ... (các it khác giữ nguyên)

  it("assistant lấy series gián tiếp qua task được giao", async () => {
    const { user: mangaka } = await createAuthenticatedUser({
      role: "Mangaka",
      email: `mk3-${Date.now()}@example.com`,
    });
    const { user: assistant, accessToken: assistantToken } =
      await createAuthenticatedUser({
        role: "Assistant",
        email: `assistant-${Date.now()}@example.com`,
      });

    const series = await Series.create({
      title: "Series co task",
      author_id: mangaka._id,
      status: "Active",
    });
    const chapter = await Chapter.create({
      series_id: series._id,
      chapter_number: 1,
      title: "Chuong 1",
      deadline: new Date("2026-12-31"),
    });

    // 🚨 ĐÃ SỬA Ở ĐÂY
    const page = await Page.create({
      chapter_id: chapter._id,
      page_number: 1,
      current_source_file_url: "https://example.com/p1.psd",
      current_preview_url: "https://example.com/p1.png",
    });

    await Task.create({
      page_id: page._id,
      region_id: new mongoose.Types.ObjectId(),
      assigned_to: assistant._id,
      assigned_by: mangaka._id,
      task_type: "To bong",
      deadline: new Date("2026-12-31"),
    });

    // Series khac khong giao task -> khong duoc lay
    await Series.create({
      title: "Series khong task",
      author_id: mangaka._id,
      status: "Active",
    });

    const response = await withAuth(
      request(app).get("/api/series/assistant"),
      assistantToken,
    );

    expect(response.status).toBe(200);
    expect(response.body.series).toHaveLength(1);
    expect(response.body.series[0].series.title).toBe("Series co task");
  });

  it("editorial board lấy tất cả series", async () => {
    const { user: mangaka } = await createAuthenticatedUser({
      role: "Mangaka",
      email: `mk-all-${Date.now()}@example.com`,
    });
    const { accessToken: boardToken } = await createAuthenticatedUser({
      role: "Editorial Board",
      email: `board-all-${Date.now()}@example.com`,
    });

    await Series.create({
      title: "Series A",
      author_id: mangaka._id,
      status: "Active",
    });
    await Series.create({
      title: "Series B",
      author_id: mangaka._id,
      status: "Draft",
    });

    const response = await withAuth(
      request(app).get("/api/series/all"),
      boardToken,
    );

    expect(response.status).toBe(200);
    expect(response.body.series).toHaveLength(2);
  });

  it("admin cũng lấy được tất cả series", async () => {
    const { user: mangaka } = await createAuthenticatedUser({
      role: "Mangaka",
      email: `mk-admin-${Date.now()}@example.com`,
    });
    const { accessToken: adminToken } = await createAuthenticatedUser({
      role: "Admin",
      email: `admin-all-${Date.now()}@example.com`,
    });

    await Series.create({
      title: "Series cho admin",
      author_id: mangaka._id,
      status: "Active",
    });

    const response = await withAuth(
      request(app).get("/api/series/all"),
      adminToken,
    );

    expect(response.status).toBe(200);
    expect(response.body.series).toHaveLength(1);
  });

  it("chặn mangaka lấy tất cả series", async () => {
    const { accessToken: mangakaToken } = await createAuthenticatedUser({
      role: "Mangaka",
      email: `mk-deny-${Date.now()}@example.com`,
    });

    const response = await withAuth(
      request(app).get("/api/series/all"),
      mangakaToken,
    );

    expect(response.status).toBe(403);
  });
});
