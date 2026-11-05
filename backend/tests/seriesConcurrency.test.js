const request = require("supertest");
const express = require("express");
const { connectDB, closeDB, clearDB } = require("./setup/dbSetup");
const { createAuthenticatedUser, withAuth } = require("./setup/authHelper");
const seriesRoutes = require("../src/routes/series.routes");
const Series = require("../src/models/SeriesModel");
const SeriesProposal = require("../src/models/SeriesProposalModel");

const app = express();
app.use(express.json());
app.use("/api/series", seriesRoutes);

beforeAll(async () => await connectDB());
afterEach(async () => await clearDB());
afterAll(async () => await closeDB());

describe("Series Concurrency & State Validation (SCRUM-90)", () => {
  it("từ chối update series và trả về HTTP 409 khi proposal đang ở trạng thái Submitted", async () => {
    const { user: mangaka, accessToken } = await createAuthenticatedUser({
      role: "Mangaka",
      email: `concurrency-mk-${Date.now()}@example.com`,
    });

    const series = await Series.create({
      title: "Series Concurrency Test 1",
      author_id: mangaka._id,
      status: "Draft",
    });

    await SeriesProposal.create({
      series_id: series._id,
      summary: "Đây là một tóm tắt hợp lệ có độ dài trên 20 ký tự",
      status: "Submitted",
    });

    const res = await withAuth(
      request(app).put(`/api/series/${series._id}`).send({
        title: "Tên Series Mới Sau Khi Update",
      }),
      accessToken,
    );

    expect(res.status).toBe(409);
    expect(res.body.message).toBe(
      "Hồ sơ đang ở trạng thái chờ duyệt, không thể cập nhật thông tin.",
    );
  });

  it("từ chối update series và trả về HTTP 409 khi proposal đang ở trạng thái Under Review", async () => {
    const { user: mangaka, accessToken } = await createAuthenticatedUser({
      role: "Mangaka",
      email: `concurrency-mk2-${Date.now()}@example.com`,
    });

    const series = await Series.create({
      title: "Series Concurrency Test 2",
      author_id: mangaka._id,
      status: "Draft",
    });

    await SeriesProposal.create({
      series_id: series._id,
      summary: "Đây là một tóm tắt hợp lệ có độ dài trên 20 ký tự",
      status: "Under Review",
    });

    const res = await withAuth(
      request(app).put(`/api/series/${series._id}`).send({
        description: "Mô tả mới dài hơn 10 ký tự cho series",
      }),
      accessToken,
    );

    expect(res.status).toBe(409);
    expect(res.body.message).toBe(
      "Hồ sơ đang ở trạng thái chờ duyệt, không thể cập nhật thông tin.",
    );
  });

  it("từ chối nộp proposal và trả về HTTP 409 khi proposal đã ở trạng thái Submitted / Under Review", async () => {
    const { user: mangaka, accessToken } = await createAuthenticatedUser({
      role: "Mangaka",
      email: `concurrency-mk3-${Date.now()}@example.com`,
    });

    const series = await Series.create({
      title: "Series Submit Conflict Test",
      author_id: mangaka._id,
      status: "Draft",
    });

    await SeriesProposal.create({
      series_id: series._id,
      summary: "Đây là một tóm tắt hợp lệ có độ dài trên 20 ký tự",
      status: "Submitted",
    });

    const res = await withAuth(
      request(app).post(`/api/series/${series._id}/proposal/submit`),
      accessToken,
    );

    expect(res.status).toBe(409);
    expect(res.body.message).toContain("đang trong quá trình xét duyệt");
  });

  it("xử lý race condition an toàn khi gửi đồng thời updateSeries và submitProposal", async () => {
    const { user: mangaka, accessToken } = await createAuthenticatedUser({
      role: "Mangaka",
      email: `race-${Date.now()}@example.com`,
    });

    const series = await Series.create({
      title: "Race Condition Series",
      author_id: mangaka._id,
      status: "Draft",
    });

    await SeriesProposal.create({
      series_id: series._id,
      summary: "Đây là một tóm tắt hợp lệ có độ dài trên 20 ký tự",
      status: "Draft",
    });

    // Bắn đồng thời 2 request: 1 request submit proposal và 1 request update series
    const [submitRes, updateRes] = await Promise.all([
      withAuth(
        request(app).post(`/api/series/${series._id}/proposal/submit`),
        accessToken,
      ),
      withAuth(
        request(app).put(`/api/series/${series._id}`).send({
          title: "Title After Concurrent Update",
        }),
        accessToken,
      ),
    ]);

    // Submit proposal phải thành công chuyển sang Submitted
    expect(submitRes.status).toBe(200);

    // Update series nếu chạy sau/cùng lúc với submit thì phải bị chặn với 409 Conflict
    // hoặc nếu chạy trước submit thì được lưu và title thay đổi
    if (updateRes.status === 409) {
      expect(updateRes.body.message).toBe(
        "Hồ sơ đang ở trạng thái chờ duyệt, không thể cập nhật thông tin.",
      );
    } else {
      expect(updateRes.status).toBe(200);
    }

    // Đảm bảo trạng thái cuối cùng của proposal là Submitted
    const finalProposal = await SeriesProposal.findOne({ series_id: series._id });
    expect(finalProposal.status).toBe("Submitted");
  });

  it("xử lý race condition khi gọi submitProposal 2 lần đồng thời", async () => {
    const { user: mangaka, accessToken } = await createAuthenticatedUser({
      role: "Mangaka",
      email: `race-submit-${Date.now()}@example.com`,
    });

    const series = await Series.create({
      title: "Double Submit Series",
      author_id: mangaka._id,
      status: "Draft",
    });

    await SeriesProposal.create({
      series_id: series._id,
      summary: "Đây là một tóm tắt hợp lệ có độ dài trên 20 ký tự",
      status: "Draft",
    });

    const [res1, res2] = await Promise.all([
      withAuth(
        request(app).post(`/api/series/${series._id}/proposal/submit`),
        accessToken,
      ),
      withAuth(
        request(app).post(`/api/series/${series._id}/proposal/submit`),
        accessToken,
      ),
    ]);

    const statuses = [res1.status, res2.status].sort();
    // 1 request phải thành công (200), 1 request phải bị từ chối do xung đột trạng thái (409)
    expect(statuses).toEqual([200, 409]);
  });
});

