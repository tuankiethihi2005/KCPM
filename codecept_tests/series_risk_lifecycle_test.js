import assert from "node:assert/strict";

Feature("Series Risk và Lifecycle");

const board = {
  email: process.env.CODECEPT_BOARD_EMAIL || "editorial@example.com",
  password: process.env.CODECEPT_BOARD_PASSWORD || "password123",
};
const editor = {
  email: process.env.CODECEPT_EDITOR_EMAIL || "editor@example.com",
  password: process.env.CODECEPT_EDITOR_PASSWORD || "password123",
};

const state = { boardToken: null, editorToken: null, seriesId: null };

function headers(token) {
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

async function login(I, account) {
  const response = await I.sendPostRequest("/api/auth/login", account);
  assert.equal(response.status, 200, `Đăng nhập thất bại: ${JSON.stringify(response.data)}`);
  assert.ok(response.data?.accessToken);
  return response.data.accessToken;
}

async function findSeries(I, token) {
  const response = await I.sendGetRequest("/api/series/all", headers(token));
  assert.equal(response.status, 200);
  const series = response.data?.series || response.series || [];
  assert.ok(series.length > 0, "Cần seed ít nhất một series");
  state.seriesId = String(series[0].id || series[0]._id);
}

Before(async ({ I }) => {
  state.boardToken = await login(I, board);
  await findSeries(I, state.boardToken);
});

Scenario("SL-01 - Board lấy danh sách series có rủi ro", async ({ I }) => {
  const response = await I.sendGetRequest("/api/series/at-risk", headers(state.boardToken));
  assert.equal(response.status, 200);
  assert.ok(Array.isArray(response.series));
  assert.equal(response.count, response.series.length);
  for (const series of response.series) {
    assert.ok(
      ["Warning", "Critical"].includes(series.risk_status) ||
        series.status === "At Risk",
    );
  }
});

Scenario("SL-02 - Series an toàn không xuất hiện trong danh sách rủi ro", async ({ I }) => {
  const allResponse = await I.sendGetRequest("/api/series/all", headers(state.boardToken));
  const riskResponse = await I.sendGetRequest("/api/series/at-risk", headers(state.boardToken));
  assert.equal(allResponse.status, 200);
  assert.equal(riskResponse.status, 200);
  const allSeries = allResponse.data?.series || allResponse.series || [];
  const riskyIds = new Set(
    riskResponse.series.map((series) => String(series._id || series.id)),
  );
  for (const series of allSeries) {
    const document = series.series || series;
    if (document.risk_status === "Safe" && document.status !== "At Risk") {
      assert.equal(riskyIds.has(String(document._id || document.id)), false);
    }
  }
});

Scenario("SL-04 - Vote lifecycle hợp lệ được lưu", async ({ I }) => {
  const response = await I.sendPostRequest(
    `/api/series/${state.seriesId}/lifecycle-vote`,
    { vote: "Need Improvement Plan", comment: "Codecept lifecycle test" },
    headers(state.boardToken),
  );
  assert.ok([200, 201].includes(response.status));
  assert.ok(response.data || response.vote);
});

Scenario("SL-05 - Board cập nhật vote hiện hành không tạo bản ghi trùng", async ({ I }) => {
  const before = await I.sendGetRequest(
    `/api/series/${state.seriesId}/lifecycle-votes`,
    headers(state.boardToken),
  );
  assert.equal(before.status, 200);
  const first = await I.sendPostRequest(
    `/api/series/${state.seriesId}/lifecycle-vote`,
    { vote: "Continue", comment: "first" },
    headers(state.boardToken),
  );
  assert.ok([200, 201].includes(first.status));
  const second = await I.sendPostRequest(
    `/api/series/${state.seriesId}/lifecycle-vote`,
    { vote: "Hiatus", comment: "updated" },
    headers(state.boardToken),
  );
  assert.equal(second.status, 200);

  const tally = await I.sendGetRequest(
    `/api/series/${state.seriesId}/lifecycle-votes`,
    headers(state.boardToken),
  );
  assert.equal(tally.status, 200);
  assert.ok(tally.votes.length <= before.votes.length + 1);
  assert.equal(tally.tally.Hiatus >= 1, true);
});

Scenario("SL-06 - Vote lifecycle thiếu hoặc sai enum bị từ chối", async ({ I }) => {
  const missing = await I.sendPostRequest(
    `/api/series/${state.seriesId}/lifecycle-vote`,
    {},
    headers(state.boardToken),
  );
  assert.equal(missing.status, 400);

  const invalid = await I.sendPostRequest(
    `/api/series/${state.seriesId}/lifecycle-vote`,
    { vote: "Delete Forever" },
    headers(state.boardToken),
  );
  assert.equal(invalid.status, 400);
});

Scenario("SL-12 - Lấy tally lifecycle vote", async ({ I }) => {
  const response = await I.sendGetRequest(
    `/api/series/${state.seriesId}/lifecycle-votes`,
    headers(state.boardToken),
  );
  assert.equal(response.status, 200);
  assert.ok(Array.isArray(response.votes));
  assert.ok(response.tally && typeof response.tally === "object");
});

Scenario("SL-10 - Editor không được vote lifecycle hoặc đổi status", async ({ I }) => {
  state.editorToken = await login(I, editor);

  const voteResponse = await I.sendPostRequest(
    `/api/series/${state.seriesId}/lifecycle-vote`,
    { vote: "Cancel" },
    headers(state.editorToken),
  );
  assert.equal(voteResponse.status, 403);

  const statusResponse = await I.sendPatchRequest(
    `/api/series/${state.seriesId}/status`,
    { status: "At Risk" },
    headers(state.editorToken),
  );
  assert.equal(statusResponse.status, 403);
});

Scenario("SL-09 - Status, schedule và risk ngoài enum bị từ chối", async ({ I }) => {
  const response = await I.sendPatchRequest(
    `/api/series/${state.seriesId}/status`,
    {
      status: "Deleted",
      approved_schedule: "invalid",
      risk_status: "Unknown",
    },
    headers(state.boardToken),
  );
  assert.equal(response.status, 400);
});

Scenario("SL-07 - Vote cho series không tồn tại bị từ chối", async ({ I }) => {
  const response = await I.sendPostRequest(
    "/api/series/000000000000000000000000/lifecycle-vote",
    { vote: "Continue" },
    headers(state.boardToken),
  );
  assert.equal(response.status, 404);
});

Scenario("SL-08 - Board cập nhật status và schedule/risk hợp lệ", async ({ I }) => {
  const response = await I.sendPatchRequest(
    `/api/series/${state.seriesId}/status`,
    { status: "At Risk", approved_schedule: "monthly", risk_status: "Warning" },
    headers(state.boardToken),
  );
  assert.equal(response.status, 200);
  assert.equal(response.series.status, "At Risk");
  assert.equal(response.series.approved_schedule, "monthly");
  assert.equal(response.series.risk_status, "Warning");
});

Scenario("SL-11 - Retry cập nhật status giữ trạng thái nhất quán", async ({ I }) => {
  const payload = {
    status: "At Risk",
    approved_schedule: "monthly",
    risk_status: "Warning",
  };
  const first = await I.sendPatchRequest(
    `/api/series/${state.seriesId}/status`,
    payload,
    headers(state.boardToken),
  );
  const second = await I.sendPatchRequest(
    `/api/series/${state.seriesId}/status`,
    payload,
    headers(state.boardToken),
  );
  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  assert.equal(second.series.status, payload.status);
  assert.equal(second.series.approved_schedule, payload.approved_schedule);
  assert.equal(second.series.risk_status, payload.risk_status);
});
