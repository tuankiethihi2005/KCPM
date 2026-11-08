import assert from "node:assert/strict";

Feature("Editorial Feedback - Tantou Editor");

const credentials = {
  editor: {
    email: process.env.CODECEPT_EDITOR_EMAIL || "editor@example.com",
    password: process.env.CODECEPT_EDITOR_PASSWORD || "password123",
  },
  assistant: {
    email: process.env.CODECEPT_ASSISTANT_EMAIL || "assistant@example.com",
    password: process.env.CODECEPT_ASSISTANT_PASSWORD || "password123",
  },
  outsiderEditor: {
    email: process.env.CODECEPT_OUTSIDER_EDITOR_EMAIL || "other-editor@example.com",
    password: process.env.CODECEPT_OUTSIDER_EDITOR_PASSWORD || "password123",
  },
};

const testState = {
  editorToken: null,
  assistantToken: null,
  seriesId: null,
  chapterId: null,
  pageId: null,
};

function authHeaders(token) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

function responseData(response) {
  return (
    response.annotation ||
    response.chapter ||
    response.page ||
    response.data?.annotation ||
    response.data?.chapter ||
    response.data?.page ||
    response.data?.data ||
    response.data
  );
}

function annotationList(response) {
  const value =
    response.data?.annotations ||
    response.data?.data ||
    response.annotations ||
    response.data ||
    [];
  if (Array.isArray(value)) return value;
  if (Array.isArray(value.annotations)) return value.annotations;
  if (Array.isArray(value.data)) return value.data;
  return [];
}

function entityId(value) {
  if (!value) return null;
  if (typeof value === "string") return value;
  return value.id || value._id?.toString?.() || value._id || null;
}

async function login(I, account) {
  const response = await I.sendPostRequest("/api/auth/login", account);
  assert.equal(
    response.status,
    200,
    `Đăng nhập thất bại: ${JSON.stringify(response.data)}`,
  );
  assert.ok(response.data?.accessToken, "Login response phải có accessToken");
  return response.data.accessToken;
}

async function listAnnotations(I, token) {
  const response = await I.sendGetRequest(
    `/api/annotations/page/${testState.pageId}`,
    authHeaders(token),
  );
  assert.equal(response.status, 200);
  return annotationList(response);
}

async function createAnnotation(I, token, overrides = {}) {
  const response = await I.sendPostRequest(
    `/api/annotations/page/${testState.pageId}`,
    {
      x: 10,
      y: 10,
      content: "default feedback",
      ...overrides,
    },
    authHeaders(token),
  );
  return response;
}

async function prepareExistingPage(I, token) {
  const seriesResponse = await I.sendGetRequest(
    "/api/series/editor",
    authHeaders(token),
  );
  assert.equal(
    seriesResponse.status,
    200,
    `Không lấy được series của editor: ${JSON.stringify(seriesResponse.data)}`,
  );

  const series =
    seriesResponse.data?.series ||
    seriesResponse.data ||
    seriesResponse.series ||
    [];
  assert.ok(
    series.length > 0,
    "Cần seed ít nhất một series được gán cho Tantou Editor",
  );

  for (const candidate of series) {
    // /api/series/editor wraps each result as { series, proposal }.
    const seriesDocument = candidate.series || candidate;
    const seriesId = entityId(seriesDocument);
    if (!seriesId) continue;

    const chapterResponse = await I.sendGetRequest(
      `/api/chapters/series/${seriesId}`,
      authHeaders(token),
    );
    if (chapterResponse.status !== 200) continue;

    const chapters =
      chapterResponse.data?.chapters ||
      chapterResponse.data ||
      chapterResponse.chapters ||
      [];
    for (const chapter of chapters) {
      const chapterId = entityId(chapter);
      if (!chapterId) continue;
      const pageResponse = await I.sendGetRequest(
        `/api/pages/chapter/${chapterId}`,
        authHeaders(token),
      );
      if (pageResponse.status !== 200) continue;

      const pages =
        pageResponse.data?.pages ||
        pageResponse.data ||
        pageResponse.pages ||
        [];
      if (pages.length > 0) {
        testState.seriesId = String(seriesId);
        testState.chapterId = String(chapterId);
        testState.pageId = String(entityId(pages[0]));
        if (!testState.pageId) continue;
        return;
      }
    }
  }

  throw new Error(
    "Không tìm thấy page để kiểm thử. Hãy seed một series, chapter và page trước khi chạy.",
  );
}

Before(async ({ I }) => {
  testState.editorToken = await login(I, credentials.editor);
  await prepareExistingPage(I, testState.editorToken);
});

// EF-01: feedback hợp lệ, tọa độ thập phân.
Scenario("EF-01 - Tạo feedback hợp lệ", async ({ I }) => {
  const response = await createAnnotation(I, testState.editorToken, {
    x: 100.5,
    y: 200,
    content: "Panel này cần chỉnh lại bố cục",
  });
  const annotation = responseData(response);

  assert.equal(response.status, 201);
  assert.equal(annotation.status, "Open");
  assert.equal(String(entityId(annotation.page_id)), testState.pageId);
  assert.equal(String(entityId(annotation.chapter_id)), testState.chapterId);
  assert.ok(annotation.created_by);
  assert.equal(Number(annotation.x), 100.5);
  assert.equal(Number(annotation.y), 200);
});

// EF-02: giá trị biên 0 và Unicode.
Scenario("EF-02 - Tạo feedback tại biên (0,0) với Unicode", async ({ I }) => {
  const content = "修正してください ✓ - Panel";
  const response = await createAnnotation(I, testState.editorToken, {
    x: 0,
    y: 0,
    content,
  });
  const annotation = responseData(response);

  assert.equal(response.status, 201);
  assert.equal(Number(annotation.x), 0);
  assert.equal(Number(annotation.y), 0);
  assert.equal(annotation.content, content);

  const annotations = await listAnnotations(I, testState.editorToken);
  const found = annotations.find(
    (item) => String(entityId(item)) === String(entityId(annotation)),
  );
  assert.ok(found, "Feedback vừa tạo không xuất hiện trong danh sách");
  assert.equal(found.content, content);
});

// EF-03: thiếu tọa độ hoặc nội dung.
Scenario(
  "EF-03 - Từ chối feedback thiếu tọa độ hoặc nội dung",
  async ({ I }) => {
    const before = (await listAnnotations(I, testState.editorToken)).length;
    const invalidPayloads = [
      { y: 10, content: "missing x" },
      { x: 10, content: "missing y" },
      { x: 10, y: 10 },
      { x: 10, y: 10, content: "   " },
      { x: 10, y: 10, content: "" },
    ];

    for (const payload of invalidPayloads) {
      const response = await I.sendPostRequest(
        `/api/annotations/page/${testState.pageId}`,
        payload,
        authHeaders(testState.editorToken),
      );
      assert.equal(response.status, 400, JSON.stringify(payload));
    }

    const after = (await listAnnotations(I, testState.editorToken)).length;
    assert.equal(after, before, "Feedback không hợp lệ đã được lưu");
  },
);

// EF-04: sai kiểu dữ liệu và status ngoài enum.
Scenario(
  "EF-04 - Từ chối dữ liệu sai kiểu và status ngoài enum",
  async ({ I }) => {
    const seedResponse = await createAnnotation(I, testState.editorToken, {
      content: "seed",
    });
    assert.equal(seedResponse.status, 201);
    const seed = responseData(seedResponse);
    const seedId = seed.id || seed._id;

    for (const payload of [
      { x: "abc", y: 10, content: "invalid x" },
      { x: 10, y: "abc", content: "invalid y" },
    ]) {
      const response = await I.sendPostRequest(
        `/api/annotations/page/${testState.pageId}`,
        payload,
        authHeaders(testState.editorToken),
      );
      assert.equal(response.status, 400, JSON.stringify(payload));
    }

    const patchResponse = await I.sendPatchRequest(
      `/api/annotations/${seedId}`,
      { status: "Done" },
      authHeaders(testState.editorToken),
    );
    assert.equal(patchResponse.status, 400);

    const annotations = await listAnnotations(I, testState.editorToken);
    const unchanged = annotations.find(
      (item) => String(entityId(item)) === String(seedId),
    );
    assert.ok(unchanged);
    assert.equal(unchanged.status, "Open");
  },
);

// EF-05: state machine của annotation.
Scenario(
  "EF-05 - Chuyển Open -> In Progress -> Resolved -> Reopened",
  async ({ I }) => {
    const seedResponse = await createAnnotation(I, testState.editorToken, {
      content: "state test",
    });
    assert.equal(seedResponse.status, 201);
    const seed = responseData(seedResponse);
    const id = seed.id || seed._id;

    for (const status of ["In Progress", "Resolved", "Reopened"]) {
      const response = await I.sendPatchRequest(
        `/api/annotations/${id}`,
        { status },
        authHeaders(testState.editorToken),
      );
      assert.equal(response.status, 200);
      assert.equal(responseData(response).status, status);
    }
  },
);

// EF-06: cập nhật một phần.
Scenario("EF-06 - PATCH chỉ thay đổi trường được gửi lên", async ({ I }) => {
  const seedResponse = await createAnnotation(I, testState.editorToken, {
    content: "original content",
    x: 50,
    y: 60,
    category: "lettering",
    deadline: "2030-01-01T00:00:00Z",
  });
  assert.equal(seedResponse.status, 201);
  const seed = responseData(seedResponse);
  const id = seed.id || seed._id;

  const contentResponse = await I.sendPatchRequest(
    `/api/annotations/${id}`,
    { content: "updated content" },
    authHeaders(testState.editorToken),
  );
  assert.equal(contentResponse.status, 200);
  assert.equal(responseData(contentResponse).content, "updated content");
  assert.equal(Number(responseData(contentResponse).x), 50);
  assert.equal(Number(responseData(contentResponse).y), 60);
  assert.equal(responseData(contentResponse).category, "lettering");
  assert.ok(responseData(contentResponse).deadline);

  const deadlineResponse = await I.sendPatchRequest(
    `/api/annotations/${id}`,
    { deadline: null },
    authHeaders(testState.editorToken),
  );
  assert.equal(deadlineResponse.status, 200);
  assert.equal(responseData(deadlineResponse).deadline, null);
});

// EF-08: Assistant được đọc theo route nhưng không được ghi.
Scenario(
  "EF-08 - Assistant không được tạo, sửa hoặc xóa feedback",
  async ({ I }) => {
    testState.assistantToken = await login(I, credentials.assistant);
    const seedResponse = await createAnnotation(I, testState.editorToken, {
      content: "assistant permission test",
    });
    assert.equal(seedResponse.status, 201);
    const seed = responseData(seedResponse);
    const id = seed.id || seed._id;

    const readResponse = await I.sendGetRequest(
      `/api/annotations/page/${testState.pageId}`,
      authHeaders(testState.assistantToken),
    );
    assert.ok([200, 403, 404].includes(readResponse.status));
    if (readResponse.status === 200) {
      const annotations = annotationList(readResponse);
      assert.ok(
        annotations.every((item) => String(item.page_id) === testState.pageId),
      );
    }

    const createResponse = await I.sendPostRequest(
      `/api/annotations/page/${testState.pageId}`,
      { x: 1, y: 1, content: "not allowed" },
      authHeaders(testState.assistantToken),
    );
    assert.equal(createResponse.status, 403);

    const patchResponse = await I.sendPatchRequest(
      `/api/annotations/${id}`,
      { status: "Resolved" },
      authHeaders(testState.assistantToken),
    );
    assert.equal(patchResponse.status, 403);
  },
);

// EF-07: editor không phụ trách series không được truy cập dữ liệu ghi.
Scenario(
  "EF-07 - Editor ngoài scope không được xem hoặc sửa feedback",
  async ({ I }) => {
    const outsiderResponse = await I.sendPostRequest(
      "/api/auth/login",
      credentials.outsiderEditor,
    );
    assert.equal(
      outsiderResponse.status,
      200,
      "Cần seed CODECEPT_OUTSIDER_EDITOR_EMAIL thuộc series khác để kiểm tra scope",
    );
    const outsiderToken = outsiderResponse.data.accessToken;

    const readResponse = await I.sendGetRequest(
      `/api/annotations/page/${testState.pageId}`,
      authHeaders(outsiderToken),
    );
    assert.ok([403, 404].includes(readResponse.status));

    const createResponse = await I.sendPostRequest(
      `/api/annotations/page/${testState.pageId}`,
      { x: 1, y: 1, content: "outside scope" },
      authHeaders(outsiderToken),
    );
    assert.ok([403, 404].includes(createResponse.status));
  },
);

// EF-09: soft delete và restore.
Scenario("EF-09 - Xóa và khôi phục feedback", async ({ I }) => {
  const seedResponse = await createAnnotation(I, testState.editorToken, {
    content: "delete restore test",
    x: 12,
    y: 34,
  });
  assert.equal(seedResponse.status, 201);
  const seed = responseData(seedResponse);
  const id = seed.id || seed._id;
  const createdAt = seed.createdAt || seed.created_at;
  assert.ok(createdAt);

  const deleteResponse = await I.sendDeleteRequest(
    `/api/annotations/${id}`,
    authHeaders(testState.editorToken),
  );
  assert.equal(deleteResponse.status, 200);

  const afterDelete = await listAnnotations(I, testState.editorToken);
  assert.equal(
    afterDelete.some((item) => String(entityId(item)) === String(id)),
    false,
  );

  const restoreResponse = await I.sendPatchRequest(
    `/api/annotations/${id}/restore`,
    {},
    authHeaders(testState.editorToken),
  );
  assert.equal(restoreResponse.status, 200);

  const afterRestore = await listAnnotations(I, testState.editorToken);
  const restored = afterRestore.find(
    (item) => String(entityId(item)) === String(id),
  );
  assert.ok(restored);
  assert.equal(restored.content, "delete restore test");
  assert.equal(Number(restored.x), 12);
  assert.equal(Number(restored.y), 34);
  assert.equal(
    new Date(restored.createdAt || restored.created_at).getTime(),
    new Date(createdAt).getTime(),
  );
});

// EF-10: endpoint progress trả về items/progress, không phải data/completionPercent.
Scenario("EF-10 - Kiểm tra tiến độ series", async ({ I }) => {
  const response = await I.sendGetRequest(
    "/api/series/progress",
    authHeaders(testState.editorToken),
  );
  assert.equal(response.status, 200);

  const items = response.data?.items || response.items || [];
  const series = items.find(
    (item) => String(item.id || item._id) === testState.seriesId,
  );
  assert.ok(series, "Series của editor không có trong progress response");
  assert.ok(Number.isFinite(Number(series.progress)));
  assert.ok(Number(series.progress) >= 0 && Number(series.progress) <= 100);
  assert.ok(Number.isInteger(Number(series.overdueTasks)));
});
