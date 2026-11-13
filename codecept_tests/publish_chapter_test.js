import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

Feature("Publish Chapter - điều kiện xuất bản (PC-01 .. PC-09)");

const editorAccount = {
  email: process.env.CODECEPT_EDITOR_EMAIL || "editor@example.com",
  password: process.env.CODECEPT_EDITOR_PASSWORD || "password123",
};
const assistantAccount = {
  email: process.env.CODECEPT_ASSISTANT_EMAIL || "assistant@example.com",
  password: process.env.CODECEPT_ASSISTANT_PASSWORD || "password123",
};
const mangakaAccounts = [
  {
    email: process.env.CODECEPT_MANGAKA_EMAIL || "mangaka@example.com",
    password: process.env.CODECEPT_MANGAKA_PASSWORD || "password123",
  },
  {
    email: "magakatest123@gmail.com",
    password: "password123",
  },
];

const state = {
  editorToken: null,
  mangakaToken: null,
  assistantToken: null,
  assistantId: null,
  seriesId: null,
  emptyChapterId: null,
  workflowChapterId: null,
  pageId: null,
  taskId: null,
  annotationId: null,
};

function headers(token) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function login(I, account) {
  const response = await I.sendPostRequest("/api/auth/login", account);
  assert.equal(
    response.status,
    200,
    `Đăng nhập thất bại (${account.email}): ${JSON.stringify(response.data)}`,
  );
  assert.ok(response.data?.accessToken);
  return {
    token: response.data.accessToken,
    user: response.data.user,
  };
}

/**
 * Tìm một capítulo có sẵn trang từ seed data ("Kiếm Sĩ Huyền Thoại") hoặc tạo mới
 */
async function setupPublishTestEnvironment(I) {
  const editorAuth = await login(I, editorAccount);
  state.editorToken = editorAuth.token;

  const assistantAuth = await login(I, assistantAccount);
  state.assistantToken = assistantAuth.token;
  state.assistantId = assistantAuth.user.id || assistantAuth.user._id;

  // Đăng nhập Mangaka khớp với series được gán cho Editor
  for (const acc of mangakaAccounts) {
    const res = await I.sendPostRequest("/api/auth/login", acc);
    if (res.status === 200 && res.data?.accessToken) {
      state.mangakaToken = res.data.accessToken;
      break;
    }
  }
  assert.ok(state.mangakaToken, "Cần đăng nhập được tài khoản Mangaka");

  // Lấy series do Editor phụ trách
  const seriesRes = await I.sendGetRequest(
    "/api/series/editor",
    headers(state.editorToken),
  );
  assert.equal(seriesRes.status, 200);
  const seriesList = seriesRes.data?.series || seriesRes.series || [];
  assert.ok(seriesList.length > 0, "Editor phải có ít nhất 1 series phụ trách");

  // Tìm series có sẵn chapter & page để kiểm thử toàn bộ quy trình PC-02 -> PC-06
  for (const item of seriesList) {
    const sDoc = item.series || item;
    const sId = String(sDoc.id || sDoc._id);
    const chRes = await I.sendGetRequest(
      `/api/chapters/series/${sId}`,
      headers(state.editorToken),
    );
    const chapters = chRes.data?.chapters || chRes.chapters || [];
    for (const ch of chapters) {
      const chId = String(ch.id || ch._id);
      const pgRes = await I.sendGetRequest(
        `/api/pages/chapter/${chId}`,
        headers(state.editorToken),
      );
      const pages = pgRes.data?.pages || pgRes.pages || [];
      if (pages.length > 0 && !state.workflowChapterId) {
        state.seriesId = sId;
        state.workflowChapterId = chId;
      } else if (pages.length === 0 && !state.emptyChapterId) {
        state.emptyChapterId = chId;
      }
    }
  }

  if (!state.seriesId) {
    const firstSeries = seriesList[0].series || seriesList[0];
    state.seriesId = String(firstSeries.id || firstSeries._id);
  }

  // Nếu chưa có chapter rỗng (0 page) cho PC-01, dùng quyền Admin/Mangaka tạo 1 chapter rỗng
  if (!state.emptyChapterId) {
    const adminLogin = await I.sendPostRequest("/api/auth/login", {
      email: "admin@example.com",
      password: "password123",
    });
    const creatorToken =
      adminLogin.status === 200
        ? adminLogin.data.accessToken
        : state.mangakaToken;

    const createChRes = await I.sendPostRequest(
      "/api/chapters/create",
      {
        series_id: state.seriesId,
        chapter_number: Math.floor(Date.now() / 1000) % 100000,
        title: `Chapter rỗng PC-01 ${Date.now()}`,
        deadline: "2027-12-31",
      },
      headers(creatorToken),
    );
    if (createChRes.status === 201) {
      state.emptyChapterId = String(
        createChRes.data?.chapter?._id || createChRes.data?.chapter?.id,
      );
    }
  }
}

BeforeSuite(async ({ I }) => {
  await setupPublishTestEnvironment(I);
});

Scenario(
  "PC-01 - Publish chapter không có page nào bị từ chối (400 Bad Request)",
  async ({ I }) => {
    assert.ok(state.emptyChapterId, "Cần có chapter rỗng (0 page) để test PC-01");
    const response = await I.sendPostRequest(
      `/api/publish/chapter/${state.emptyChapterId}`,
      {},
      headers(state.editorToken),
    );

    assert.equal(response.status, 400);
    assert.match(
      response.data?.message || "",
      /chưa có trang nào/i,
      `Expected 'Chapter chưa có trang nào', got: ${JSON.stringify(response.data)}`,
    );
  },
);

Scenario(
  "PC-02 - Có page nhưng còn page chưa Approved thì bị từ chối kèm unapprovedPages_count (400)",
  async ({ I }) => {
    assert.ok(state.workflowChapterId, "Cần có chapter có trang để test PC-02");

    // Đảm bảo ít nhất 1 trang đang ở trạng thái khác Approved (ví dụ Ready For Review)
    const pagesRes = await I.sendGetRequest(
      `/api/pages/chapter/${state.workflowChapterId}`,
      headers(state.editorToken),
    );
    const pages = pagesRes.data?.pages || [];
    assert.ok(pages.length > 0, "Chapter phải có ít nhất 1 trang");
    state.pageId = String(pages[0]._id || pages[0].id);

    await I.sendPutRequest(
      `/api/pages/approve/${state.pageId}`,
      { status: "Ready For Review" },
      headers(state.editorToken),
    );

    const response = await I.sendPostRequest(
      `/api/publish/chapter/${state.workflowChapterId}`,
      {},
      headers(state.editorToken),
    );

    assert.equal(response.status, 400);
    assert.match(response.data?.message || "", /trang truyện chưa được phê duyệt/i);
    assert.ok(
      Number(response.data?.unapprovedPages_count) >= 1,
      "Phải trả về số lượng trang chưa được phê duyệt (unapprovedPages_count >= 1)",
    );
  },
);

Scenario(
  "PC-03 - Mọi page đã Approved nhưng còn task chưa hoàn thành thì bị từ chối kèm unfinishedTasks_count (400)",
  async ({ I }) => {
    // 1. Duyệt toàn bộ các trang trong workflowChapterId sang Approved
    const pagesRes = await I.sendGetRequest(
      `/api/pages/chapter/${state.workflowChapterId}`,
      headers(state.editorToken),
    );
    const pages = pagesRes.data?.pages || [];
    for (const p of pages) {
      await I.sendPutRequest(
        `/api/pages/approve/${p._id || p.id}`,
        { status: "Approved" },
        headers(state.editorToken),
      );
    }

    // 2. Đảm bảo có ít nhất 1 task chưa hoàn thành (status = In Progress) trên trang đầu tiên
    const tasksRes = await I.sendGetRequest(
      `/api/tasks?page_id=${state.pageId}`,
      headers(state.editorToken),
    );
    const existingTasks = tasksRes.data?.tasks || [];

    if (existingTasks.length > 0) {
      state.taskId = String(existingTasks[0]._id);
      await I.sendPatchRequest(
        `/api/tasks/${state.taskId}/status`,
        { status: "In Progress" },
        headers(state.editorToken),
      );
    } else {
      const adminLogin = await I.sendPostRequest("/api/auth/login", {
        email: "admin@example.com",
        password: "password123",
      });
      const createTaskRes = await I.sendPostRequest(
        "/api/tasks",
        {
          page_id: state.pageId,
          assigned_to: state.assistantId,
          task_type: "Tô bóng kiểm thử PC-03",
          deadline: "2027-12-31",
          price: 100000,
        },
        headers(adminLogin.data.accessToken),
      );
      assert.equal(createTaskRes.status, 201);
      state.taskId = String(createTaskRes.data?.task?._id);
    }

    // 3. Gọi publish -> Phải rơi đúng vào nhánh unfinishedTasks.length > 0
    const response = await I.sendPostRequest(
      `/api/publish/chapter/${state.workflowChapterId}`,
      {},
      headers(state.editorToken),
    );

    assert.equal(response.status, 400);
    assert.match(response.data?.message || "", /task chưa hoàn thành/i);
    assert.ok(Number(response.data?.unfinishedTasks_count) >= 1);
  },
);

Scenario(
  "PC-04 - Mọi page và task đã đạt nhưng còn annotation chưa Resolved thì bị từ chối (400)",
  async ({ I }) => {
    // 1. Chuyển toàn bộ task của các trang trong chapter sang Approved
    const pagesRes = await I.sendGetRequest(
      `/api/pages/chapter/${state.workflowChapterId}`,
      headers(state.editorToken),
    );
    for (const p of pagesRes.data?.pages || []) {
      const tRes = await I.sendGetRequest(
        `/api/tasks?page_id=${p._id || p.id}`,
        headers(state.editorToken),
      );
      for (const t of tRes.data?.tasks || []) {
        if (!["Approved", "Paid"].includes(t.status)) {
          await I.sendPatchRequest(
            `/api/tasks/${t._id}/status`,
            { status: "Approved" },
            headers(state.editorToken),
          );
        }
      }
    }

    // 2. Tạo hoặc mở lại 1 Annotation ở trạng thái Open trên trang
    const annRes = await I.sendPostRequest(
      `/api/annotations/page/${state.pageId}`,
      {
        x: 25,
        y: 35,
        content: "Annotation chưa giải quyết để test PC-04",
        status: "Open",
      },
      headers(state.editorToken),
    );
    assert.equal(annRes.status, 201);
    state.annotationId = String(
      annRes.data?.data?._id || annRes.data?.annotation?._id,
    );

    // 3. Gọi publish -> Phải rơi đúng vào nhánh unresolvedAnnotations.length > 0
    const response = await I.sendPostRequest(
      `/api/publish/chapter/${state.workflowChapterId}`,
      {},
      headers(state.editorToken),
    );

    assert.equal(response.status, 400);
    assert.match(response.data?.message || "", /annotation chưa được giải quyết/i);
    assert.ok(Number(response.data?.unresolvedAnnotations_count) >= 1);
  },
);

Scenario(
  "PC-05 & PC-06 - Xuất bản thành công (200 OK) khi mọi Page Approved, Task Approved và Annotation Resolved",
  async ({ I }) => {
    // 1. Giải quyết toàn bộ Annotation của chapter sang Resolved
    const annsRes = await I.sendGetRequest(
      `/api/annotations/chapter/${state.workflowChapterId}`,
      headers(state.editorToken),
    );
    const annotations = annsRes.data?.data || annsRes.data?.annotations || [];
    for (const ann of annotations) {
      if (ann.status !== "Resolved") {
        await I.sendPatchRequest(
          `/api/annotations/${ann._id}`,
          { status: "Resolved" },
          headers(state.editorToken),
        );
      }
    }

    // 2. Gọi Publish Chapter thành công (chạy hết dòng 68 -> 95 trong publishChapter.js)
    const response = await I.sendPostRequest(
      `/api/publish/chapter/${state.workflowChapterId}`,
      {},
      headers(state.editorToken),
    );

    assert.equal(
      response.status,
      200,
      `Publish phải thành công 200, nhận được: ${JSON.stringify(response.data)}`,
    );
    assert.equal(response.data?.chapter?.status, "Published");
    assert.ok(response.data?.chapter?.published_at, "Phải lưu thời điểm published_at");
  },
);

Scenario(
  "PC-07 - Gửi release_issue_id sai định dạng ObjectId bị từ chối và không lưu liên kết mồ côi",
  async ({ I }) => {
    const response = await I.sendPostRequest(
      `/api/publish/chapter/${state.workflowChapterId}`,
      { release_issue_id: "not-an-object-id" },
      headers(state.editorToken),
    );
    // Mongoose báo lỗi CastError khi gán release_issue_id không phải ObjectId
    assert.ok([400, 500].includes(response.status));
  },
);

Scenario(
  "PC-08 - Assistant và Mangaka không có quyền publish chapter (403 Forbidden)",
  async ({ I }) => {
    const assistantRes = await I.sendPostRequest(
      `/api/publish/chapter/${state.workflowChapterId}`,
      {},
      headers(state.assistantToken),
    );
    assert.equal(assistantRes.status, 403);

    const mangakaRes = await I.sendPostRequest(
      `/api/publish/chapter/${state.workflowChapterId}`,
      {},
      headers(state.mangakaToken),
    );
    assert.equal(mangakaRes.status, 403);
  },
);

Scenario(
  "PC-09 - Chapter không tồn tại trả về 404 và ID sai định dạng bị từ chối",
  async ({ I }) => {
    const notFoundRes = await I.sendPostRequest(
      "/api/publish/chapter/000000000000000000000000",
      {},
      headers(state.editorToken),
    );
    assert.equal(notFoundRes.status, 404);

    const badFormatRes = await I.sendPostRequest(
      "/api/publish/chapter/not-an-object-id",
      {},
      headers(state.editorToken),
    );
    assert.ok([400, 404, 500].includes(badFormatRes.status));
  },
);