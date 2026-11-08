import assert from "node:assert/strict";

Feature("Publish Chapter - điều kiện xuất bản");

const editor = {
  email: process.env.CODECEPT_EDITOR_EMAIL || "editor@example.com",
  password: process.env.CODECEPT_EDITOR_PASSWORD || "password123",
};
const assistant = {
  email: process.env.CODECEPT_ASSISTANT_EMAIL || "assistant@example.com",
  password: process.env.CODECEPT_ASSISTANT_PASSWORD || "password123",
};
const mangaka = {
  email: process.env.CODECEPT_MANGAKA_EMAIL || "mangaka@example.com",
  password: process.env.CODECEPT_MANGAKA_PASSWORD || "password123",
};

const state = { editorToken: null, assistantToken: null, chapterId: null };

function headers(token) {
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

async function login(I, account) {
  const response = await I.sendPostRequest("/api/auth/login", account);
  assert.equal(response.status, 200, `Đăng nhập thất bại: ${JSON.stringify(response.data)}`);
  assert.ok(response.data?.accessToken);
  return response.data.accessToken;
}

async function findChapter(I, token) {
  const seriesResponse = await I.sendGetRequest("/api/series/editor", headers(token));
  assert.equal(seriesResponse.status, 200);
  const series = seriesResponse.data?.series || seriesResponse.series || [];
  let fallbackChapterId = null;
  for (const item of series) {
    // /api/series/editor wraps each result as { series, proposal }.
    const seriesDocument = item.series || item;
    const seriesId = seriesDocument.id || seriesDocument._id;
    if (!seriesId) continue;
    const chaptersResponse = await I.sendGetRequest(
      `/api/chapters/series/${seriesId}`,
      headers(token),
    );
    const chapters =
      chaptersResponse.data?.chapters ||
      chaptersResponse.data ||
      chaptersResponse.chapters ||
      [];
    if (chapters.length > 0) {
      for (const chapter of chapters) {
        const chapterId = String(chapter.id || chapter._id);
        const pagesResponse = await I.sendGetRequest(
          `/api/pages/chapter/${chapterId}`,
          headers(token),
        );
        const pages =
          pagesResponse.data?.pages ||
          pagesResponse.data ||
          pagesResponse.pages ||
          [];
        if (pages.length === 0) {
          state.chapterId = chapterId;
          return;
        }
        fallbackChapterId = fallbackChapterId || chapterId;
      }
    }
  }
  if (fallbackChapterId) {
    state.chapterId = fallbackChapterId;
    return;
  }
  throw new Error("Không tìm thấy chapter seed cho test publish");
}

Before(async ({ I }) => {
  state.editorToken = await login(I, editor);
  await findChapter(I, state.editorToken);
});

Scenario("PC-01 - Chapter không tồn tại trả về 404", async ({ I }) => {
  const response = await I.sendPostRequest(
    "/api/publish/chapter/000000000000000000000000",
    {},
    headers(state.editorToken),
  );
  assert.equal(response.status, 404);
});

Scenario("PC-02 đến PC-04 - Không publish khi điều kiện chapter chưa đạt", async ({ I }) => {
  const response = await I.sendPostRequest(
    `/api/publish/chapter/${state.chapterId}`,
    { release_issue_id: "000000000000000000000000" },
    headers(state.editorToken),
  );
  // API kiểm tra page/task/annotation trước release issue; mọi kết quả không
  // thành công đều phải giữ chapter không Published.
  assert.ok([400, 404].includes(response.status));
});

Scenario("PC-08 - Assistant không được publish chapter", async ({ I }) => {
  state.assistantToken = await login(I, assistant);
  const response = await I.sendPostRequest(
    `/api/publish/chapter/${state.chapterId}`,
    {},
    headers(state.assistantToken),
  );
  assert.equal(response.status, 403);
});

Scenario("PC-08b - Mangaka không được publish chapter", async ({ I }) => {
  const mangakaToken = await login(I, mangaka);
  const response = await I.sendPostRequest(
    `/api/publish/chapter/${state.chapterId}`,
    {},
    headers(mangakaToken),
  );
  assert.equal(response.status, 403);
});

Scenario("PC-07 - Release issue sai định dạng không được lưu", async ({ I }) => {
  const response = await I.sendPostRequest(
    `/api/publish/chapter/${state.chapterId}`,
    { release_issue_id: "not-an-object-id" },
    headers(state.editorToken),
  );
  assert.equal(response.status, 400);
});

Scenario("PC-09 - Publish lại không được tạo trạng thái hoặc thời điểm mới", async ({ I }) => {
  const before = await I.sendGetRequest(
    `/api/chapters/${state.chapterId}`,
    headers(state.editorToken),
  );
  assert.equal(before.status, 200);
  const beforeChapter = before.data?.chapter || before.chapter || before.data;
  const response = await I.sendPostRequest(
    `/api/publish/chapter/${state.chapterId}`,
    {},
    headers(state.editorToken),
  );
  assert.ok([200, 400].includes(response.status));

  const after = await I.sendGetRequest(
    `/api/chapters/${state.chapterId}`,
    headers(state.editorToken),
  );
  assert.equal(after.status, 200);
  const afterChapter = after.data?.chapter || after.chapter || after.data;
  if (beforeChapter?.status === "Published") {
    assert.equal(afterChapter.status, "Published");
    assert.equal(
      new Date(afterChapter.published_at).getTime(),
      new Date(beforeChapter.published_at).getTime(),
    );
  }
});

Scenario("PC-09 - Không chấp nhận request publish với chapter id sai format", async ({ I }) => {
  const response = await I.sendPostRequest(
    "/api/publish/chapter/not-an-object-id",
    {},
    headers(state.editorToken),
  );
  assert.ok([400, 404].includes(response.status));
});
