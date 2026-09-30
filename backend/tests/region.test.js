const request = require("supertest");
const express = require("express");
const mongoose = require("mongoose");
const { connectDB, closeDB, clearDB } = require("./setup/dbSetup");
const { createAuthenticatedUser, withAuth } = require("./setup/authHelper");
const regionRoutes = require("../src/routes/region.routes");
const Series = require("../src/models/SeriesModel");
const Chapter = require("../src/models/ChapterModel");
const Page = require("../src/models/PageModel");
const PageRegion = require("../src/models/PageRegionModel");

const app = express();
app.use(express.json());
app.use("/api/regions", regionRoutes);

beforeAll(async () => await connectDB());
afterEach(async () => await clearDB());
afterAll(async () => await closeDB());

describe("Region API Tests", () => {
  let accessToken;
  let user;
  let series;
  let chapter;
  let page;

  beforeEach(async () => {
    // Region creation is typically Mangaka role
    ({ accessToken, user } = await createAuthenticatedUser({
      role: "Mangaka",
    }));

    series = await Series.create({
      title: "Region Test Series",
      author_id: user._id, // Assign to this author (Mangaka)
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

  it("creates a page region successfully", async () => {
    const response = await withAuth(
      request(app).post(`/api/regions/page/${page._id}`),
      accessToken
    ).send({
      page_id: page._id,
      coordinates: JSON.stringify({ x: 10, y: 10, width: 40, height: 30 }),
      region_type: "background"
    });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.region.region_type).toBe("background");
  });

  it("gets page regions for a page", async () => {
    await PageRegion.create({
      page_id: page._id,
      coordinates: JSON.stringify({ x: 10, y: 10, width: 40, height: 30 }),
      region_type: "panel",
      created_by: user._id
    });

    const response = await withAuth(
      request(app).get(`/api/regions/page/${page._id}`),
      accessToken
    );

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.regions.length).toBe(1);
    expect(response.body.regions[0].region_type).toBe("panel");
  });

  it("deletes a page region", async () => {
    const reg = await PageRegion.create({
      page_id: page._id,
      coordinates: JSON.stringify({ x: 10, y: 10, width: 40, height: 30 }),
      region_type: "panel",
      created_by: user._id
    });

    const response = await withAuth(
      request(app).delete(`/api/regions/${reg._id}`),
      accessToken
    );

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const checkReg = await PageRegion.findById(reg._id);
    expect(checkReg).toBeNull();
  });
});
