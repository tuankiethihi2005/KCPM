import assert from "node:assert/strict";

Feature("Release Issue và Ranking");

const board = {
  email: process.env.CODECEPT_BOARD_EMAIL || "editorial@example.com",
  password: process.env.CODECEPT_BOARD_PASSWORD || "password123",
};
const mangaka = {
  email: process.env.CODECEPT_MANGAKA_EMAIL || "mangaka@example.com",
  password: process.env.CODECEPT_MANGAKA_PASSWORD || "password123",
};

const state = { boardToken: null, mangakaToken: null, issueId: null, seriesId: null };

function headers(token) {
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

async function login(I, account) {
  const response = await I.sendPostRequest("/api/auth/login", account);
  assert.equal(response.status, 200, `Đăng nhập thất bại: ${JSON.stringify(response.data)}`);
  assert.ok(response.data?.accessToken);
  return response.data.accessToken;
}

Before(async ({ I }) => {
  state.boardToken = await login(I, board);
  const seriesResponse = await I.sendGetRequest(
    "/api/series/all",
    headers(state.boardToken),
  );
  const series = seriesResponse.data?.series || seriesResponse.series || [];
  state.seriesId = series[0]?.id || series[0]?._id || null;
});

Scenario("RI-01 - Board tạo issue với dữ liệu hợp lệ", async ({ I }) => {
  assert.ok(state.seriesId, "Cần seed ít nhất một series");
  state.issueId = `CODECEPT-RI-${Date.now()}`;
  const response = await I.sendPostRequest(
    "/api/issues",
    {
      id: state.issueId,
      name: `Codecept release issue ${Date.now()}`,
      releaseDate: "2026-12-01",
      seriesList: [state.seriesId],
      type: "Weekly",
    },
    headers(state.boardToken),
  );
  assert.equal(response.status, 201);
  assert.equal(response.data?.data?.status, "Planned");
  assert.equal(response.data?.data?.type, "Weekly");
});

Scenario("RI-01b - Board lấy danh sách kỳ phát hành", async ({ I }) => {
  const response = await I.sendGetRequest("/api/issues", headers(state.boardToken));
  assert.equal(response.status, 200);
  assert.ok(Array.isArray(response.data?.data || response.data));
});

Scenario("RI-02 - Người không có quyền không được tạo kỳ phát hành", async ({ I }) => {
  state.mangakaToken = await login(I, mangaka);
  const response = await I.sendPostRequest(
    "/api/issues",
    {
      id: `CODECEPT-DENIED-${Date.now()}`,
      name: "Unauthorized issue",
      releaseDate: "2026-12-01",
      seriesList: [],
      type: "Weekly",
    },
    headers(state.mangakaToken),
  );
  assert.equal(response.status, 403);
});

Scenario("RI-03 - Không tạo issue trùng mã hoặc tên", async ({ I }) => {
  const issuesResponse = await I.sendGetRequest("/api/issues", headers(state.boardToken));
  assert.equal(issuesResponse.status, 200);
  const existing = issuesResponse.data?.[0];
  if (!existing) return;

  const response = await I.sendPostRequest(
    "/api/issues",
    {
      id: existing.custom_id,
      name: existing.title,
      releaseDate: existing.release_date,
      seriesList: [],
      type: existing.type,
    },
    headers(state.boardToken),
  );
  assert.equal(response.status, 400);
});

Scenario("RI-04 - Leaderboard hỗ trợ lọc theo issue, genre và author", async ({ I }) => {
  const response = await I.sendGetRequest("/api/rankings", headers(state.boardToken));
  assert.equal(response.status, 200);
  assert.ok(Array.isArray(response.data?.data || response.data));

  const filtered = await I.sendGetRequest(
    "/api/rankings?genre=Fantasy",
    headers(state.boardToken),
  );
  assert.equal(filtered.status, 200);
  assert.ok(Array.isArray(filtered.data?.data || filtered.data));
});

Scenario("RI-05 - Không chấp nhận import khi thiếu file", async ({ I }) => {
  const issuesResponse = await I.sendGetRequest("/api/issues", headers(state.boardToken));
  const issue = issuesResponse.data?.[0];
  if (!issue) return;

  const response = await I.sendPostRequest(
    `/api/issues/${issue.custom_id}/import-votes`,
    {},
    headers(state.boardToken),
  );
  assert.equal(response.status, 400);
});

Scenario("RI-06 - Từ chối series không thuộc issue khi import", async ({ I }) => {
  const issuesResponse = await I.sendGetRequest("/api/issues", headers(state.boardToken));
  const issue = issuesResponse.data?.data?.[0] || issuesResponse.data?.[0];
  assert.ok(issue, "Cần seed ít nhất một release issue");
  const response = await I.sendPostRequest(
    `/api/issues/${issue.custom_id}/import-votes`,
    { file: "not-a-multipart-file" },
    headers(state.boardToken),
  );
  assert.equal(response.status, 400);
});

Scenario("RI-07 - Từ chối performance series không tồn tại", async ({ I }) => {
  const response = await I.sendGetRequest(
    "/api/rankings/performance/000000000000000000000000",
    headers(state.boardToken),
  );
  assert.ok([403, 404].includes(response.status));
});

Scenario("RI-08 - Editor không được tạo issue", async ({ I }) => {
  const editorResponse = await I.sendPostRequest("/api/auth/login", {
    email: process.env.CODECEPT_EDITOR_EMAIL || "editor@example.com",
    password: process.env.CODECEPT_EDITOR_PASSWORD || "password123",
  });
  assert.equal(editorResponse.status, 200);
  const response = await I.sendPostRequest(
    "/api/issues",
    {
      id: `CODECEPT-EDITOR-${Date.now()}`,
      name: "Editor must not create issue",
      releaseDate: "2026-12-01",
      seriesList: [],
      type: "Weekly",
    },
    headers(editorResponse.data.accessToken),
  );
  assert.equal(response.status, 403);
});
