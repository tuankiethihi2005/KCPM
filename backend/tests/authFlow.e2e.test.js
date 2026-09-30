jest.mock("../src/middlewares/upload.middleware", () => ({
  fields: () => (req, res, next) => next(),
  array: () => (req, res, next) => next(),
  single: () => (req, res, next) => next(),
}));

const request = require("supertest");
const { connectDB, closeDB, clearDB } = require("./setup/dbSetup");
const app = require("../src/app");
const User = require("../src/models/UserModel");
const Series = require("../src/models/SeriesModel");
const Chapter = require("../src/models/ChapterModel");
const Page = require("../src/models/PageModel");
const { hashPassword } = require("../src/modules/auth/utils/password");

beforeAll(async () => await connectDB());
afterEach(async () => await clearDB());
afterAll(async () => await closeDB());

describe("Auth flow end-to-end", () => {
  it("supports login, protected resource access, and logout with refresh revocation", async () => {
    const agent = request.agent(app);
    const password = "password123";
    const user = await User.create({
      name: "Flow User",
      email: "flow-user@example.com",
      password: await hashPassword(password),
      role: "Mangaka",
      status: "Active",
    });

    const series = await Series.create({
      title: "Flow Series",
      author_id: user._id,
      status: "Draft",
    });

    const chapter = await Chapter.create({
      series_id: series._id,
      chapter_number: 1,
      title: "Flow Chapter",
      deadline: new Date("2026-12-31"),
      status: "In Production",
    });

    // 🚨 ĐÃ SỬA Ở ĐÂY: Thay file_url
    await Page.create([
      {
        chapter_id: chapter._id,
        page_number: 1,
        current_source_file_url: "https://example.com/page-1.psd",
        current_preview_url: "https://example.com/page-1.png",
        status: "Draft",
      },
      {
        chapter_id: chapter._id,
        page_number: 2,
        current_source_file_url: "https://example.com/page-2.psd",
        current_preview_url: "https://example.com/page-2.png",
        status: "Ready For Review",
      },
    ]);

    const loginResponse = await agent.post("/api/auth/login").send({
      email: user.email,
      password,
    });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.user.email).toBe(user.email);

    const { accessToken } = loginResponse.body;
    expect(loginResponse.headers["set-cookie"][0]).toContain("refresh_token=");

    const meResponse = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${accessToken}`);
    expect(meResponse.status).toBe(200);
    expect(meResponse.body.user.id).toBe(String(user._id));

    const seriesResponse = await request(app)
      .get("/api/series/mine")
      .set("Authorization", `Bearer ${accessToken}`);
    expect(seriesResponse.status).toBe(200);
    expect(seriesResponse.body.series).toHaveLength(1);
    expect(seriesResponse.body.series[0].series._id).toBe(String(series._id));

    const chaptersResponse = await request(app)
      .get(`/api/chapters/series/${series._id}`)
      .set("Authorization", `Bearer ${accessToken}`);
    expect(chaptersResponse.status).toBe(200);
    expect(chaptersResponse.body.chapters).toHaveLength(1);
    expect(chaptersResponse.body.chapters[0]._id).toBe(String(chapter._id));

    const pagesResponse = await request(app)
      .get(`/api/pages/chapter/${chapter._id}`)
      .set("Authorization", `Bearer ${accessToken}`);
    expect(pagesResponse.status).toBe(200);
    expect(pagesResponse.body.pages).toHaveLength(2);

    const logoutResponse = await agent.post("/api/auth/logout").send();
    expect(logoutResponse.status).toBe(200);

    const refreshResponse = await agent.post("/api/auth/refresh").send();
    expect(refreshResponse.status).toBe(401);
    expect(refreshResponse.body.error.code).toBe("AUTH_REFRESH_INVALID");
  });
});
