const request = require("supertest");
const express = require("express");
const mongoose = require("mongoose");
const { connectDB, closeDB, clearDB } = require("./setup/dbSetup");
const { createAuthenticatedUser, withAuth } = require("./setup/authHelper");
const annotationRoutes = require("../src/routes/annotation.routes");
const Series = require("../src/models/SeriesModel");
const Chapter = require("../src/models/ChapterModel");
const Page = require("../src/models/PageModel");
const Annotation = require("../src/models/AnnotationModel");

const app = express();
app.use(express.json());
app.use("/api/annotations", annotationRoutes);

beforeAll(async () => await connectDB());
afterEach(async () => await clearDB());
afterAll(async () => await closeDB());

describe("Annotation API Tests", () => {
  let accessToken;
  let user;
  let series;
  let chapter;
  let page;

  beforeEach(async () => {
    // Create Tantou Editor user (editors edit annotations)
    ({ accessToken, user } = await createAuthenticatedUser({
      role: "Tantou Editor",
    }));

    series = await Series.create({
      title: "Annotation Test Series",
      author_id: new mongoose.Types.ObjectId(), // Fake author
      editor_id: user._id, // Assign to this editor
      status: "Active",
    });

    chapter = await Chapter.create({
      series_id: series._id,
      chapter_number: 1,
      title: "Chương 1",
      deadline: new Date(),
      status: "Draft",
    });

    page = await Page.create({
      chapter_id: chapter._id,
      page_number: 1,
      current_source_file_url: "https://example.com/source.psd",
      current_preview_url: "https://example.com/preview.jpg",
      status: "Draft",
    });
  });

  it("creates an annotation successfully", async () => {
    const response = await withAuth(
      request(app).post(`/api/annotations/page/${page._id}`),
      accessToken
    ).send({
      x: 50,
      y: 50,
      content: "Nét vẽ chỗ này hơi lệch",
      category: "drawing"
    });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.content).toBe("Nét vẽ chỗ này hơi lệch");
    expect(response.body.data.category).toBe("drawing");
    expect(response.body.data.x).toBe(50);
    expect(response.body.data.y).toBe(50);
  });

  it("gets annotations for a page", async () => {
    await Annotation.create({
      chapter_id: chapter._id,
      page_id: page._id,
      x: 20,
      y: 30,
      content: "Lời thoại sai chính tả",
      category: "dialogue",
      status: "Open",
      created_by: user._id,
      role: user.role,
    });

    const response = await withAuth(
      request(app).get(`/api/annotations/page/${page._id}`),
      accessToken
    );

    if (response.status !== 200) {
      console.log("GET annotations response:", response.status, JSON.stringify(response.body));
    }

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.length).toBe(1);
    expect(response.body.data[0].content).toBe("Lời thoại sai chính tả");
  });

  it("gets annotations for a chapter", async () => {
    await Annotation.create({
      chapter_id: chapter._id,
      page_id: page._id,
      x: 10,
      y: 20,
      content: "Góp ý test chapter",
      status: "Open",
      created_by: user._id,
      role: user.role,
    });

    const response = await withAuth(
      request(app).get(`/api/annotations/chapter/${chapter._id}`),
      accessToken
    );

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.length).toBe(1);
    expect(response.body.data[0].content).toBe("Góp ý test chapter");
  });

  it("updates an annotation's status", async () => {
    const ann = await Annotation.create({
      chapter_id: chapter._id,
      page_id: page._id,
      x: 20,
      y: 30,
      content: "Sai kịch bản",
      category: "script",
      status: "Open",
      created_by: user._id,
      role: user.role,
    });

    const response = await withAuth(
      request(app).patch(`/api/annotations/${ann._id}`),
      accessToken
    ).send({
      status: "Resolved",
      content: "Đã sửa hoàn tất"
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe("Resolved");
    expect(response.body.data.content).toBe("Đã sửa hoàn tất");
  });

  it("deletes an annotation", async () => {
    const ann = await Annotation.create({
      chapter_id: chapter._id,
      page_id: page._id,
      x: 20,
      y: 30,
      content: "Xóa cái này",
      category: "drawing",
      created_by: user._id,
      role: user.role,
    });

    const response = await withAuth(
      request(app).delete(`/api/annotations/${ann._id}`),
      accessToken
    );

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const checkAnn = await Annotation.findById(ann._id);
    expect(checkAnn).toBeNull();
  });
});
