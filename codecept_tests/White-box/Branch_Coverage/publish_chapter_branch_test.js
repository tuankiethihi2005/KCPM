import assert from "node:assert/strict";
import { refreshAccessToken } from "../../series_test_helpers.js";
import { signInAsAdmin } from "../coverage_helpers.js";
import {
  prepareEmptyChapter,
  prepareReadyChapter,
  publishHeaders,
} from "../Statement_Coverage/publish_chapter_coverage_helper.js";

Feature("White-Box Branch Coverage — publishChapter");

// ---------------------------------------------------------------------------
// PC-BC-01: Nhánh task trạng thái Paid được chấp nhận hoàn thành
// ---------------------------------------------------------------------------
Scenario(
  "PC-BC-01: Task ở trạng thái Paid được tính là hợp lệ và xuất bản thành công (200)",
  async ({ I }) => {
    const { chapterId, tasks, token } = await prepareReadyChapter(I, {
      reserve: false,
      requireTasks: true,
    });
    assert.ok(tasks.some((task) => task.status === "Paid"));

    const response = await I.sendPostRequest(
      `/api/publish/chapter/${chapterId}`,
      {},
      publishHeaders(token),
    );
    assert.equal(response.status, 200);
    assert.equal(response.data.chapter.status, "Published");
  },
);

// ---------------------------------------------------------------------------
// PC-BC-02: Đầy đủ các nhánh của release_issue_id (400, 404, 200 có ID, 200 bỏ trống)
// ---------------------------------------------------------------------------
Scenario("PC-BC-02: Phủ đủ các nhánh của release_issue_id", async ({ I }) => {
  const { chapterId, token } = await prepareReadyChapter(I, {
    reserve: false,
  });
  const headers = publishHeaders(token);

  // 1. Sai định dạng ObjectId -> 400
  const invalidFormatRes = await I.sendPostRequest(
    `/api/publish/chapter/${chapterId}`,
    { release_issue_id: "invalid-issue-id" },
    headers,
  );
  assert.equal(invalidFormatRes.status, 400);

  // 2. Không tồn tại -> 404
  const notFoundRes = await I.sendPostRequest(
    `/api/publish/chapter/${chapterId}`,
    { release_issue_id: "000000000000000000000000" },
    headers,
  );
  assert.equal(notFoundRes.status, 404);

  // 3. Tạo ReleaseIssue thật -> 200
  await signInAsAdmin(I);
  const adminHeaders = publishHeaders(await refreshAccessToken(I));
  const customId = `PC-BC-02-${Date.now()}`;
  const createIssueRes = await I.sendPostRequest(
    "/api/issues",
    {
      id: customId,
      name: `Issue Branch Test ${Date.now()}`,
      releaseDate: "2027-12-31",
      type: "Weekly",
    },
    adminHeaders,
  );
  assert.equal(createIssueRes.status, 201);

  const issuesRes = await I.sendGetRequest("/api/issues", adminHeaders);
  const createdIssue = (issuesRes.data?.data || []).find(
    (issue) => issue.custom_id === customId,
  );
  assert.ok(createdIssue?._id);
  const releaseIssueId = String(createdIssue._id);

  const linkedPublish = await I.sendPostRequest(
    `/api/publish/chapter/${chapterId}`,
    { release_issue_id: releaseIssueId },
    headers,
  );
  assert.equal(linkedPublish.status, 200);
  assert.equal(
    String(linkedPublish.data.chapter.release_issue_id),
    releaseIssueId,
  );

  // 4. Không truyền release_issue_id -> 200
  const plainPublish = await I.sendPostRequest(
    `/api/publish/chapter/${chapterId}`,
    {},
    headers,
  );
  assert.equal(plainPublish.status, 200);
  assert.equal(
    String(plainPublish.data.chapter.release_issue_id),
    releaseIssueId,
  );
});

// ---------------------------------------------------------------------------
// PC-BC-03: Các nhánh điều kiện page, task, annotation (400 và 200)
// ---------------------------------------------------------------------------
Scenario(
  "PC-BC-03: Phủ cả 2 nhánh đạt và chưa đạt của page, task và annotation",
  async ({ I }) => {
    const { chapterId, pages, tasks, token } = await prepareReadyChapter(I, {
      reserve: false,
      requireTasks: true,
    });
    const pageId = String(pages[0]._id || pages[0].id);
    const taskId = String(tasks[0]._id || tasks[0].id);
    const headers = publishHeaders(token);

    // Page chưa duyệt -> 400, duyệt lại -> tiếp tục
    await I.sendPutRequest(
      `/api/pages/approve/${pageId}`,
      { status: "Ready For Review" },
      headers,
    );
    const unapprovedPage = await I.sendPostRequest(
      `/api/publish/chapter/${chapterId}`,
      {},
      headers,
    );
    assert.equal(unapprovedPage.status, 400);
    await I.sendPutRequest(
      `/api/pages/approve/${pageId}`,
      { status: "Approved" },
      headers,
    );

    // Task chưa hoàn thành -> 400, đặt Paid -> tiếp tục
    await I.sendPatchRequest(
      `/api/tasks/${taskId}/status`,
      { status: "In Progress" },
      headers,
    );
    const unfinishedTask = await I.sendPostRequest(
      `/api/publish/chapter/${chapterId}`,
      {},
      headers,
    );
    assert.equal(unfinishedTask.status, 400);
    await I.sendPatchRequest(
      `/api/tasks/${taskId}/status`,
      { status: "Paid" },
      headers,
    );

    // Annotation chưa giải quyết -> 400, đặt Resolved -> tiếp tục
    const created = await I.sendPostRequest(
      `/api/annotations/page/${pageId}`,
      {
        x: 25,
        y: 35,
        content: "Branch coverage unresolved annotation",
        status: "Open",
      },
      headers,
    );
    assert.equal(created.status, 201);
    const annotationId =
      created.data?.data?._id ||
      created.data?.annotation?._id ||
      created.data?._id;

    const unresolved = await I.sendPostRequest(
      `/api/publish/chapter/${chapterId}`,
      {},
      headers,
    );
    assert.equal(unresolved.status, 400);

    await I.sendPatchRequest(
      `/api/annotations/${annotationId}`,
      { status: "Resolved" },
      headers,
    );
  },
);

// ---------------------------------------------------------------------------
// PC-BC-04: Nhánh if (pages.length === 0) là true (400) và false (200)
// ---------------------------------------------------------------------------
Scenario(
  "PC-BC-04: Chapter chưa có trang nào trả về 400, Chapter có trang hợp lệ trả về 200",
  async ({ I }) => {
    const empty = await prepareEmptyChapter(I);
    const emptyRes = await I.sendPostRequest(
      `/api/publish/chapter/${empty.chapterId}`,
      {},
      publishHeaders(empty.token),
    );
    assert.equal(emptyRes.status, 400);

    const ready = await prepareReadyChapter(I, { reserve: false });
    const readyRes = await I.sendPostRequest(
      `/api/publish/chapter/${ready.chapterId}`,
      {},
      publishHeaders(ready.token),
    );
    assert.equal(readyRes.status, 200);
  },
);

// ---------------------------------------------------------------------------
// PC-BC-05: Nhánh lỗi ngoại lệ catch (error) trả về 500
// ---------------------------------------------------------------------------
Scenario(
  "PC-BC-05: Lỗi runtime khi body không phải JSON rơi vào khối catch trả về 500",
  async ({ I }) => {
    const { chapterId, token } = await prepareReadyChapter(I, {
      reserve: false,
    });
    const response = await I.sendPostRequest(
      `/api/publish/chapter/${chapterId}`,
      "non-json-body",
      {
        "Content-Type": "text/plain",
        Authorization: `Bearer ${token}`,
      },
    );

    assert.equal(response.status, 500);
    assert.equal(response.data.message, "Lỗi server");
  },
);

// ---------------------------------------------------------------------------
// PC-BC-06: Các nhánh bị middleware chặn (!isValid, !chapter, !series, !series.editor_id)
// ---------------------------------------------------------------------------
// Scenario(
//   "PC-BC-06: Phủ nhánh chapter_id sai định dạng (400), không tìm thấy chapter (404), không tìm thấy series (200) và series không có editor (200)",
//   async () => {
//     const mongoose = backendRequire("mongoose");
//     const Chapter = mongoose.model("Chapter");
//     const Page = mongoose.model("Page");
//     const Task = mongoose.model("Task");
//     const Annotation = mongoose.model("Annotation");
//     const Series = mongoose.model("Series");
//     const NotificationService = backendRequire(
//       path.resolve(
//         __dirname,
//         "../../../backend/src/services/notificationService.js",
//       ),
//     );

//     const origChapterFindById = Chapter.findById;
//     const origPageFind = Page.find;
//     const origTaskFind = Task.find;
//     const origAnnotationFind = Annotation.find;
//     const origSeriesFindById = Series.findById;
//     const origNotify = NotificationService.createNotification;

//     try {
//       // 1. !mongoose.Types.ObjectId.isValid(chapter_id) -> true (400)
//       const resInvalidId = createMockRes();
//       await publishChapter(
//         { params: { chapter_id: "invalid-object-id" }, body: {} },
//         resInvalidId,
//       );
//       assert.equal(resInvalidId.statusCode, 400);

//       // 2. !chapter -> true (404)
//       Chapter.findById = async () => null;
//       const resNoChapter = createMockRes();
//       await publishChapter(
//         { params: { chapter_id: "000000000000000000000000" }, body: {} },
//         resNoChapter,
//       );
//       assert.equal(resNoChapter.statusCode, 404);

//       // Thiết lập dữ liệu mock hợp lệ cho 2 case bên dưới
//       Chapter.findById = async () => ({
//         _id: "000000000000000000000001",
//         series_id: "000000000000000000000002",
//         title: "Mock Chapter",
//         status: "Draft",
//         save: async () => {},
//       });
//       Page.find = async () => [
//         { _id: "000000000000000000000003", status: "Approved" },
//       ];
//       Task.find = async () => [];
//       Annotation.find = async () => [];
//       NotificationService.createNotification = async () => ({});

//       // 3. if (series) -> false (Series.findById trả về null)
//       Series.findById = async () => null;
//       const resNoSeries = createMockRes();
//       await publishChapter(
//         { params: { chapter_id: "000000000000000000000001" }, body: {} },
//         resNoSeries,
//       );
//       assert.equal(resNoSeries.statusCode, 200);

//       // 4. if (series.editor_id) -> false (series không gán editor_id)
//       Series.findById = async () => ({
//         _id: "000000000000000000000002",
//         title: "Series Without Editor",
//         author_id: "000000000000000000000009",
//         editor_id: null,
//       });
//       const resNoEditor = createMockRes();
//       await publishChapter(
//         { params: { chapter_id: "000000000000000000000001" }, body: {} },
//         resNoEditor,
//       );
//       assert.equal(resNoEditor.statusCode, 200);
//     } finally {
//       Chapter.findById = origChapterFindById;
//       Page.find = origPageFind;
//       Task.find = origTaskFind;
//       Annotation.find = origAnnotationFind;
//       Series.findById = origSeriesFindById;
//       NotificationService.createNotification = origNotify;
//     }
//   },
// );
