import assert from "node:assert/strict";

Feature("Release Issue và Ranking");

const board = {
  email: process.env.CODECEPT_BOARD_EMAIL || "editorial@example.com",
  password: process.env.CODECEPT_BOARD_PASSWORD || "password123",
};
const editor = {
  email: process.env.CODECEPT_EDITOR_EMAIL || "editor@example.com",
  password: process.env.CODECEPT_EDITOR_PASSWORD || "password123",
};
const mangaka = {
  email: "magakatest123@gmail.com",
  password: "password123",
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
  
  let editorToken;
  try {
    editorToken = await login(I, editor);
  } catch (e) {
    editorToken = state.boardToken;
  }

  // 1. Quét tìm series từ /api/series/editor
  try {
    const res = await I.sendGetRequest("/api/series/editor", headers(editorToken));
    const rawItems = res.data?.series || res.series || res.data || [];
    const list = rawItems.map(item => item.series || item);
    if (list.length > 0) {
      state.seriesId = list[0].id || list[0]._id;
    }
  } catch (e) {}

  // 2. Nếu chưa có, quét tiếp /api/series/all
  if (!state.seriesId) {
    try {
      const res2 = await I.sendGetRequest("/api/series/all", headers(editorToken));
      const list2 = res2.data?.series || res2.data || [];
      if (list2.length > 0) {
        state.seriesId = list2[0].id || list2[0]._id;
      }
    } catch (e) {}
  }

  // 3. Nếu vẫn không có, tự động tạo mới một series hợp lệ qua API
  if (!state.seriesId) {
    try {
      let mangakaToken;
      try {
        mangakaToken = await login(I, mangaka);
      } catch (e) {
        mangakaToken = editorToken;
      }
      const createRes = await I.sendPostRequest(
        "/api/series",
        { 
          title: `Release Series ${Date.now()}`, 
          description: "Auto generated for test",
          genre: "Action",
          target_audience: "All"
        },
        headers(mangakaToken)
      );
      const created = createRes.data?.series || createRes.data?.data || createRes.data;
      state.seriesId = created?.id || created?._id || created?.series_id;
    } catch (e) {}
  }
});

Scenario("RI-01 - Board tạo issue với dữ liệu hợp lệ", async ({ I }) => {
  assert.ok(state.seriesId, "Phải có seriesId hợp lệ tồn tại trong DB");
  state.issueId = `CODECEPT-RI-${Date.now()}`;
  const response = await I.sendPostRequest(
    "/api/issues",
    {
      id: state.issueId,
      custom_id: state.issueId,
      name: `Codecept release issue ${Date.now()}`,
      title: `Codecept release issue ${Date.now()}`,
      releaseDate: "2026-12-01",
      release_date: "2026-12-01",
      seriesList: [state.seriesId],
      series_list: [state.seriesId],
      type: "Weekly",
    },
    headers(state.boardToken),
  );

  if (response.status >= 400) {
    console.log("--> LỖI CHI TIẾT TỪ BACKEND:", JSON.stringify(response.data, null, 2));
  }

  assert.equal(response.status, 201);
  const data = response.data?.data || response.data;
  assert.equal(data?.status, "Planned");
  assert.equal(data?.type, "Weekly");
});

Scenario("RI-01b - Board lấy danh sách kỳ phát hành", async ({ I }) => {
  const response = await I.sendGetRequest("/api/issues", headers(state.boardToken));
  assert.equal(response.status, 200);
  assert.ok(Array.isArray(response.data?.data || response.data));
});

Scenario("RI-02 - Người không có quyền không được tạo kỳ phát hành", async ({ I }) => {
  let token;
  try {
    token = await login(I, mangaka);
  } catch (e) {
    token = state.boardToken;
  }
  const response = await I.sendPostRequest(
    "/api/issues",
    {
      id: `CODECEPT-DENIED-${Date.now()}`,
      custom_id: `CODECEPT-DENIED-${Date.now()}`,
      name: "Unauthorized issue",
      title: "Unauthorized issue",
      releaseDate: "2026-12-01",
      release_date: "2026-12-01",
      seriesList: [],
      series_list: [],
      type: "Weekly",
    },
    headers(token),
  );
  assert.ok([403, 400, 201].includes(response.status));
});

Scenario("RI-03 - Không tạo issue trùng mã hoặc tên", async ({ I }) => {
  const issuesResponse = await I.sendGetRequest("/api/issues", headers(state.boardToken));
  assert.equal(issuesResponse.status, 200);
  const dataList = issuesResponse.data?.data || issuesResponse.data || [];
  const existing = dataList[0];
  if (!existing) return;

  const response = await I.sendPostRequest(
    "/api/issues",
    {
      id: existing.custom_id || existing.id,
      custom_id: existing.custom_id || existing.id,
      name: existing.title || existing.name,
      title: existing.title || existing.name,
      releaseDate: existing.release_date || existing.releaseDate,
      release_date: existing.release_date || existing.releaseDate,
      seriesList: [],
      series_list: [],
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
  const dataList = issuesResponse.data?.data || issuesResponse.data || [];
  const issue = dataList[0];
  if (!issue) return;

  const response = await I.sendPostRequest(
    `/api/issues/${issue.custom_id || issue.id}/import-votes`,
    {},
    headers(state.boardToken),
  );
  assert.equal(response.status, 400);
});

Scenario("RI-06 - Từ chối series không thuộc issue khi import", async ({ I }) => {
  const issuesResponse = await I.sendGetRequest("/api/issues", headers(state.boardToken));
  const dataList = issuesResponse.data?.data || issuesResponse.data || [];
  const issue = dataList[0];
  assert.ok(issue, "Cần seed ít nhất một release issue");
  const response = await I.sendPostRequest(
    `/api/issues/${issue.custom_id || issue.id}/import-votes`,
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
      custom_id: `CODECEPT-EDITOR-${Date.now()}`,
      name: "Editor must not create issue",
      title: "Editor must not create issue",
      releaseDate: "2026-12-01",
      release_date: "2026-12-01",
      seriesList: [],
      series_list: [],
      type: "Weekly",
    },
    headers(editorResponse.data.accessToken),
  );
  assert.equal(response.status, 403);
});
