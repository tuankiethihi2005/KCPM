const request = require("supertest");
const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const { connectDB, closeDB, clearDB } = require("./setup/dbSetup");
const { createAuthenticatedUser, withAuth } = require("./setup/authHelper");
const pageRoutes = require("../src/routes/page.routes");
const Series = require("../src/models/SeriesModel");
const Chapter = require("../src/models/ChapterModel");
const Page = require("../src/models/PageModel");

// Mock Multer
jest.mock("../src/middlewares/upload.middleware", () => {
  const multer = require("multer");
  const parser = multer().any();

  return {
    fields: () => (req, res, next) => {
      parser(req, res, () => {
        req.files = {
          source_file: [
            { path: "https://res.cloudinary.com/mock/trang_1.jpg" },
          ],
          attached_resource: [
            { path: "https://res.cloudinary.com/mock/resource.zip" },
          ],
        };
        next();
      });
    },
    array: () => (req, res, next) => {
      parser(req, res, () => {
        req.files = [{ path: "https://res.cloudinary.com/mock/trang_1.jpg" }];
        next();
      });
    },
    single: () => (req, res, next) => {
      parser(req, res, () => {
        req.file = { path: "https://res.cloudinary.com/mock/cover.jpg" };
        next();
      });
    },
  };
});

const app = express();
app.use(express.json());
app.use("/api/pages", pageRoutes);

beforeAll(async () => await connectDB());
afterEach(async () => await clearDB());
afterAll(async () => await closeDB());

describe("Page API - Upload & Update Tests", () => {
  let accessToken;
  let user;
  let series;

  beforeEach(async () => {
    ({ accessToken, user } = await createAuthenticatedUser({
      role: "Mangaka",
    }));
    series = await Series.create({
      title: "Page Test Series",
      author_id: user._id,
      status: "Draft",
    });
  });

  it("uploads pages successfully", async () => {
    const chapter = await Chapter.create({
      series_id: series._id,
      chapter_number: 1,
      title: "Test",
      deadline: new Date(),
    });

    const response = await withAuth(
      request(app).post(`/api/pages/upload/${chapter._id}/upload`),
      accessToken,
    )
      .field("page_number", 1)
      .attach("source_file", Buffer.from("anh-gia"), "trang_1.jpg");

    expect(response.status).toBe(201);
    expect(response.body.page.current_source_file_url).toBe(
      "https://res.cloudinary.com/mock/trang_1.jpg",
    );
  });

  it("updates page version successfully with commit_note", async () => {
    const chapter = await Chapter.create({
      series_id: series._id,
      chapter_number: 1,
      title: "Test Update Version",
      deadline: new Date(),
    });

    const page = await Page.create({
      chapter_id: chapter._id,
      page_number: 1,
      current_source_file_url: "https://link-cu-rich-da-bi-loi.psd",
      current_preview_url: "https://link-cu-rich-da-bi-loi.jpg",
      current_version: 1,
      status: "Draft",
    });

    const response = await withAuth(
      request(app).put(`/api/pages/update/${page._id}`),
      accessToken,
    )
      .field("commit_note", "Đã fix lại nét vẽ tay nhân vật")
      .attach("source_file", Buffer.from("anh-ve-lai"), "trang_1_sua.psd");

    expect(response.status).toBe(200);
    expect(response.body.page.current_version).toBe(2);
  });

  it("approves page successfully", async () => {
    const chapter = await Chapter.create({
      series_id: series._id,
      chapter_number: 2,
      title: "Approve Test",
      deadline: new Date(),
    });

    const page = new Page({
      chapter_id: chapter._id,
      page_number: 1,
      current_source_file_url: "https://example.com/page1_v2.psd",
      current_preview_url: "https://example.com/page1_v2.jpg",
      current_version: 2,
      status: "Ready For Review",
    });
    await page.save();

    const response = await withAuth(
      request(app).put(`/api/pages/approve/${page._id}`),
      accessToken,
    ).send({ status: "Approved" });

    expect(response.status).toBe(200);
    expect(response.body.page.status).toBe("Approved");
  });

  it("returns 400 for invalid page status", async () => {
    const chapter = await Chapter.create({
      series_id: series._id,
      chapter_number: 3,
      title: "Invalid Status Test",
      deadline: new Date(),
    });

    const page = new Page({
      chapter_id: chapter._id,
      page_number: 2,
      current_source_file_url: "https://example.com/page2_draft.psd",
      current_preview_url: "https://example.com/page2_draft.jpg",
      status: "Draft",
    });
    await page.save();

    const response = await withAuth(
      request(app).put(`/api/pages/approve/${page._id}`),
      accessToken,
    ).send({ status: "Done" });

    expect(response.status).toBe(400);
  });

  it("returns 404 when page is not found", async () => {
    const fakePageId = new mongoose.Types.ObjectId();

    const response = await withAuth(
      request(app).put(`/api/pages/approve/${fakePageId}`),
      accessToken,
    ).send({ status: "Approved" });

    expect(response.status).toBe(404);
  });
});
