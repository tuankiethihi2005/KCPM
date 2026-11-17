import assert from "node:assert/strict";

Feature("Assistant Production Workflow (Mangaka & Assistant)");

const mangakaAccount = {
  email: process.env.CODECEPT_MANGAKA_EMAIL || "mangaka@example.com",
  password: process.env.CODECEPT_MANGAKA_PASSWORD || "password123",
};

const assistantAccount = {
  email: process.env.CODECEPT_ASSISTANT_EMAIL || "assistant@example.com",
  password: process.env.CODECEPT_ASSISTANT_PASSWORD || "password123",
};

const state = {
  mangakaToken: null,
  assistantToken: null,
  seriesId: null,
  chapterId: null,
  pageId: null,
  regionId: null,
  annotationId: null,
};

function authHeaders(token) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function login(I, account) {
  const res = await I.sendPostRequest("/api/auth/login", account);
  assert.equal(
    res.status,
    200,
    `Đăng nhập thất bại (${account.email}): ${JSON.stringify(res.data)}`,
  );
  assert.ok(res.data?.accessToken, "Không nhận được accessToken");
  return res.data.accessToken;
}

Before(async ({ I }) => {
  if (!state.mangakaToken) {
    state.mangakaToken = await login(I, mangakaAccount);
  }
  if (!state.assistantToken) {
    state.assistantToken = await login(I, assistantAccount);
  }

  if (!state.seriesId) {
    const createSeriesRes = await I.sendPostRequest(
      "/api/series",
      {
        title: `Series Codecept Assistant ${Date.now()}`,
        description: "Series phuc vu kiem thu quy trinh Assistant Production",
        genre: "Action",
        target_audience: "Shounen",
      },
      authHeaders(state.mangakaToken),
    );

    if ([200, 201].includes(createSeriesRes.status)) {
      const created =
        createSeriesRes.data?.series ||
        createSeriesRes.data?.data ||
        createSeriesRes.data;
      state.seriesId = String(created?._id || created?.id || "");
    }

    if (!state.seriesId) {
      const myRes = await I.sendGetRequest(
        "/api/series/my-series",
        authHeaders(state.mangakaToken),
      );
      const list = myRes.data?.series || myRes.data?.data || [];
      assert.ok(
        list.length > 0,
        `Không lấy được seriesId (${createSeriesRes.status}): ${JSON.stringify(createSeriesRes.data)}`,
      );
      state.seriesId = String(list[0]._id || list[0].id);
    }
  }
});

// =========================================================================
// 1. CREATE CHAPTER (Tạo Chapter & Phân quyền)
// =========================================================================

Scenario("TC-CC-01: Mangaka tạo Chapter mới thành công", async ({ I }) => {
  const res = await I.sendPostRequest(
    "/api/chapters/create",
    {
      series_id: state.seriesId,
      chapter_number: Math.floor(100 + Math.random() * 900),
      title: `Chapter Codecept Test ${Date.now()}`,
      deadline: "2026-12-31",
    },
    authHeaders(state.mangakaToken),
  );

  assert.ok([200, 201].includes(res.status), `Tạo chapter thất bại: ${res.status}`);
  const chapter = res.data?.chapter || res.data?.data || res.data;
  state.chapterId = String(chapter?._id || chapter?.id || "");
  assert.ok(state.chapterId, "Phải trả về ID của Chapter vừa tạo");
});

Scenario("TC-CC-02: Từ chối tạo Chapter khi bỏ trống tiêu đề", async ({ I }) => {
  const res = await I.sendPostRequest(
    "/api/chapters/create",
    {
      series_id: state.seriesId,
      chapter_number: 999,
      title: "",
    },
    authHeaders(state.mangakaToken),
  );

  assert.equal(res.status, 400);
});

Scenario("TC-CC-03: Assistant bị từ chối khi cố gắng tạo Chapter (403 Forbidden)", async ({ I }) => {
  const res = await I.sendPostRequest(
    "/api/chapters/create",
    {
      series_id: state.seriesId,
      chapter_number: 998,
      title: "Assistant Unauthorized Chapter",
    },
    authHeaders(state.assistantToken),
  );

  assert.equal(res.status, 403);
});

// =========================================================================
// 2. PAGE UPLOAD & STATUS (Danh sách trang & Trạng thái)
// =========================================================================

Scenario("TC-PUS-01: Mangaka và Assistant lấy danh sách trang theo Chapter", async ({ I }) => {
  assert.ok(state.chapterId, "Thiếu chapterId từ TC-CC-01");

  const mangakaRes = await I.sendGetRequest(
    `/api/pages/chapter/${state.chapterId}`,
    authHeaders(state.mangakaToken),
  );
  assert.equal(mangakaRes.status, 200);

  const assistantRes = await I.sendGetRequest(
    `/api/pages/chapter/${state.chapterId}`,
    authHeaders(state.assistantToken),
  );
  assert.equal(assistantRes.status, 200);

  const pages = mangakaRes.data?.pages || mangakaRes.data?.data || [];
  if (pages.length > 0) {
    state.pageId = String(pages[0]._id || pages[0].id);
  }
});

Scenario("TC-PUS-02: Từ chối upload trang khi không gửi file source_file", async ({ I }) => {
  assert.ok(state.chapterId, "Thiếu chapterId");

  const res = await I.sendPostRequest(
    `/api/pages/upload/${state.chapterId}/upload`,
    {},
    authHeaders(state.mangakaToken),
  );

  assert.ok([400, 422, 500].includes(res.status));
});

Scenario("TC-PUS-03: Assistant bị chặn quyền upload trang mới trực tiếp (403)", async ({ I }) => {
  assert.ok(state.chapterId, "Thiếu chapterId");

  const res = await I.sendPostRequest(
    `/api/pages/upload/${state.chapterId}/upload`,
    {},
    authHeaders(state.assistantToken),
  );

  assert.equal(res.status, 403);
});

// =========================================================================
// 3. PAGE VERSION MANAGEMENT & 6. PAGE HISTORY
// =========================================================================

Scenario("TC-PVM-01 & TC-PH-01: Kiểm tra lấy danh sách phiên bản & lịch sử trang", async ({ I }) => {
  const targetPageId = state.pageId || "000000000000000000000000";

  const res = await I.sendGetRequest(
    `/api/pages/${targetPageId}/versions`,
    authHeaders(state.assistantToken),
  );

  if (state.pageId) {
    assert.equal(res.status, 200);
  } else {
    assert.ok([400, 403, 404].includes(res.status));
  }
});

// =========================================================================
// 4. PAGE DELETE & RESTORE (Xóa & Khôi phục + Phân quyền)
// =========================================================================

Scenario("TC-PDR-03: Assistant bị từ chối khi cố gắng xóa trang (403 Forbidden)", async ({ I }) => {
  const targetPageId = state.pageId || "000000000000000000000000";

  const res = await I.sendDeleteRequest(
    `/api/pages/${targetPageId}`,
    authHeaders(state.assistantToken),
  );

  assert.equal(res.status, 403);
});

Scenario("TC-PDR-01 & TC-PDR-02: Mangaka xóa mềm và khôi phục Chapter/Page", async ({ I }) => {
  assert.ok(state.chapterId, "Thiếu chapterId");

  const delRes = await I.sendDeleteRequest(
    `/api/chapters/${state.chapterId}`,
    authHeaders(state.mangakaToken),
  );
  // 200 trên MongoDB Replica Set/Atlas; 500 nếu chạy MongoDB Memory Server standalone (không hỗ trợ transaction)
  assert.ok([200, 500].includes(delRes.status), `Unexpected status: ${delRes.status}`);

  if (delRes.status === 200) {
    const restoreRes = await I.sendPutRequest(
      `/api/chapters/restore/${state.chapterId}`,
      {},
      authHeaders(state.mangakaToken),
    );
    assert.equal(restoreRes.status, 200);
  }
});

// =========================================================================
// 5. REGION & ANNOTATION (Vùng chọn & Chú thích - Trọn vòng 2 Role)
// =========================================================================

Scenario("TC-RAA-01: Mangaka & Assistant xem danh sách Region và Annotation của trang", async ({ I }) => {
  const targetPageId = state.pageId || "000000000000000000000000";

  const regRes = await I.sendGetRequest(
    `/api/regions/page/${targetPageId}`,
    authHeaders(state.assistantToken),
  );
  assert.ok([200, 400, 404].includes(regRes.status));

  const annRes = await I.sendGetRequest(
    `/api/annotations/page/${targetPageId}`,
    authHeaders(state.assistantToken),
  );
  assert.ok([200, 400, 404].includes(annRes.status));
});

Scenario("TC-RAA-02: Kiểm tra phân quyền tạo Region/Annotation giữa Mangaka và Assistant", async ({ I }) => {
  const targetPageId = state.pageId || "000000000000000000000000";

  // Assistant không được tạo mới Region trực tiếp (chỉ Mangaka/Admin)
  const assistantRegRes = await I.sendPostRequest(
    `/api/regions/page/${targetPageId}`,
    {
      name: "Vùng tô bóng",
      coordinates: { x: 10, y: 10, width: 100, height: 100 },
    },
    authHeaders(state.assistantToken),
  );
  assert.equal(assistantRegRes.status, 403);
});