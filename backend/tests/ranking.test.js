const mongoose = require("mongoose");
const request = require("supertest");
const express = require("express");
const { connectDB, closeDB, clearDB } = require("./setup/dbSetup");
const { createAuthenticatedUser, withAuth } = require("./setup/authHelper");
const issueRoutes = require("../src/routes/IssueRoutes");
const rankingRoutes = require("../src/routes/RankingRoutes");
const ReleaseIssue = require("../src/models/ReleaseIssueModel");
const Ranking = require("../src/models/RankingModel");
const ReaderVote = require("../src/models/ReaderVoteModel");
const Series = require("../src/models/SeriesModel");

const app = express();
app.use(express.json());
app.use("/api/issues", issueRoutes);
app.use("/api/rankings", rankingRoutes);
app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }
  return res.status(error.status || 500).json({
    error: {
      code: error.code || "INTERNAL_SERVER_ERROR",
      message: error.message || "Unexpected error",
    },
  });
});

beforeAll(async () => await connectDB());
afterEach(async () => await clearDB());
afterAll(async () => await closeDB());

describe("Module 11 & 12 (Nhiệm vụ 8): Kỳ phát hành, Nhập Vote & Xếp hạng", () => {
  let boardToken;
  let mangakaToken;

  beforeEach(async () => {
    ({ accessToken: boardToken } = await createAuthenticatedUser({
      role: "Editorial Board",
      email: `board-${Date.now()}@example.com`,
    }));
    ({ accessToken: mangakaToken } = await createAuthenticatedUser({
      role: "Mangaka",
      email: `mangaka-${Date.now()}@example.com`,
    }));
  });

  it("cho phép Editorial Board tạo kỳ phát hành mới", async () => {
    const res = await withAuth(
      request(app).post("/api/issues"),
      boardToken,
    ).send({
      id: "ISSUE-2026-01",
      name: "Weekly Shonen Jump Issue 1",
      releaseDate: "2026-06-14",
      type: "Weekly",
      seriesList: ["S1", "S2"],
    });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe("Tạo kỳ phát hành thành công!");
    expect(res.body.data.id).toBe("ISSUE-2026-01");

    // Kiểm tra trong DB
    const issue = await ReleaseIssue.findOne({ custom_id: "ISSUE-2026-01" });
    expect(issue).toBeTruthy();
    expect(issue.title).toBe("Weekly Shonen Jump Issue 1");
  });

  it("ngăn cản Mangaka tạo kỳ phát hành", async () => {
    const res = await withAuth(
      request(app).post("/api/issues"),
      mangakaToken,
    ).send({
      id: "ISSUE-2026-01",
      name: "Weekly Shonen Jump Issue 1",
      releaseDate: "2026-06-14",
      type: "Weekly",
      seriesList: ["S1"],
    });

    expect(res.status).toBe(403);
  });

  it("tính toán xếp hạng, xu hướng và cảnh báo hủy khi xử lý bầu chọn", async () => {
    // 1. Tạo trước 2 kỳ phát hành để so sánh xu hướng (Trend)
    const issue1 = await ReleaseIssue.create({
      custom_id: "ISSUE-TEST-01",
      title: "Kỳ phát hành Test 1",
      release_date: new Date("2026-06-01"),
      type: "Weekly",
    });

    const issue2 = await ReleaseIssue.create({
      custom_id: "ISSUE-TEST-02",
      title: "Kỳ phát hành Test 2",
      release_date: new Date("2026-06-08"),
      type: "Weekly",
    });

    // 2. Tạo các Series mẫu
    const series1 = await Series.create({
      title: "One Piece",
      author_id: new mongoose.Types.ObjectId(),
      status: "Active",
    });
    const series2 = await Series.create({
      title: "Naruto",
      author_id: new mongoose.Types.ObjectId(),
      status: "Active",
    });

    // 3. Giả lập xếp hạng cho Kỳ 1 (One Piece hạng 1, Naruto hạng 2)
    await Ranking.create({
      release_issue_id: issue1._id,
      series_id: series1._id,
      rank: 1,
      score: 9.0,
      trend: "NEW",
    });
    await Ranking.create({
      release_issue_id: issue1._id,
      series_id: series2._id,
      rank: 2,
      score: 8.0,
      trend: "NEW",
    });

    // 4. Gọi hàm import votes cho Kỳ 2 nhưng đổi ngôi đầu (Naruto lên hạng 1, One Piece xuống hạng 2)
    const rawVotes = [
      { seriesId: "S2", votes: 1000, avgScore: 9.5 }, // Naruto: 1000*0.6 + 9.5*0.4 = 600 + 3.8 = 603.8 (Hạng 1)
      { seriesId: "S1", votes: 500, avgScore: 8.0 },  // One Piece: 500*0.6 + 8.0*0.4 = 300 + 3.2 = 303.2 (Hạng 2)
    ];

    const RankingService = require("../src/services/RankingService");
    const result = await RankingService.calculateRankingAndTrends("ISSUE-TEST-02", rawVotes);

    expect(result).toBeTruthy();
    
    // Check Naruto (S2) ranking
    const narutoRanking = await Ranking.findOne({ release_issue_id: issue2._id, series_id: series2._id });
    expect(narutoRanking.rank).toBe(1);
    expect(narutoRanking.trend).toBe("UP"); // Từ hạng 2 lên hạng 1

    // Check One Piece (S1) ranking
    const opRanking = await Ranking.findOne({ release_issue_id: issue2._id, series_id: series1._id });
    expect(opRanking.rank).toBe(2);
    expect(opRanking.trend).toBe("DOWN"); // Từ hạng 1 xuống hạng 2
    expect(opRanking.cancellationWarning).toBe(true); // Xu hướng DOWN kích hoạt cancellationWarning
  });

  it("cập nhật trạng thái Series thành Critical/Warning khi điểm trung bình dưới 4 hoặc bằng 6", async () => {
    const issue1 = await ReleaseIssue.create({
      custom_id: "ISSUE-TEST-AVG-01",
      title: "Kỳ phát hành Test điểm TB",
      release_date: new Date(),
      type: "Weekly",
    });

    const seriesCritical = await Series.create({
      title: "Bleach",
      author_id: new mongoose.Types.ObjectId(),
      status: "Active",
      risk_status: "Safe"
    });

    const seriesWarning = await Series.create({
      title: "Conan",
      author_id: new mongoose.Types.ObjectId(),
      status: "Active",
      risk_status: "Safe"
    });

    // Giả lập votes
    // S3 (Bleach) có điểm trung bình 3.5 (dưới 4)
    // S4 (Conan) có điểm trung bình 6.0 (bằng 6)
    const rawVotes = [
      { seriesId: "S3", votes: 100, avgScore: 3.5 },
      { seriesId: "S4", votes: 200, avgScore: 6.0 },
    ];

    const RankingService = require("../src/services/RankingService");
    await RankingService.calculateRankingAndTrends("ISSUE-TEST-AVG-01", rawVotes);

    // Kiểm tra Series Critical
    const updatedCritical = await Series.findById(seriesCritical._id);
    expect(updatedCritical.risk_status).toBe("Critical");
    expect(updatedCritical.status).toBe("At Risk");

    // Kiểm tra Series Warning
    const updatedWarning = await Series.findById(seriesWarning._id);
    expect(updatedWarning.risk_status).toBe("Warning");
    expect(updatedWarning.status).toBe("At Risk");
  });
});
