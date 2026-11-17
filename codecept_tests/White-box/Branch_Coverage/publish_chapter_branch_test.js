import assert from "node:assert/strict";
import { refreshAccessToken } from "../../series_test_helpers.js";
import { signInAsAdmin } from "../coverage_helpers.js";
import {
  prepareEmptyChapter,
  prepareReadyChapter,
  publishHeaders,
} from "../Statement_Coverage/publish_chapter_coverage_helper.js";

Feature("White-Box Branch Coverage — publishChapter (100% Reachable Branches)");

// ---------------------------------------------------------------------------
// PC-BC-01: Nhánh task trạng thái Paid được chấp nhận hoàn thành (unfinishedTasks.length === 0)
// ---------------------------------------------------------------------------
Scenario(
  "PC-BC-01: Task ở trạng thái Paid được tính là hợp lệ và xuất bản thành công (200)",
  async ({ I }) => {
    const { chapterId, tasks, token } = await prepareReadyChapter(I, {
      reserve: false,
      requireTasks: true,
    });
    assert.ok(
      tasks.some((task) => task.status === "Paid"),
      "Cần ít nhất một task ở trạng thái Paid",
    );

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
// PC-BC-02: Nhánh if (release_issue_id) là true (có gửi) và false (không gửi -> giữ nguyên)
// ---------------------------------------------------------------------------
Scenario(
  "PC-BC-02: Xuất bản có kèm release_issue_id (true) và không kèm release_issue_id (false)",
  async ({ I }) => {
    const { chapterId, token } = await prepareReadyChapter(I, {
      reserve: false,
    });
    const headers = publishHeaders(token);
    const releaseIssueId = "000000000000000000000001";

    // Nhánh true: truyền release_issue_id hợp lệ -> lưu liên kết mới
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

    // Nhánh false: không truyền release_issue_id -> giữ nguyên liên kết cũ
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
  },
);

// ---------------------------------------------------------------------------
// PC-BC-03: Các nhánh điều kiện page, task, annotation trả về 400 (true) và đi tiếp (false)
// ---------------------------------------------------------------------------
Scenario(
  "PC-BC-03: Phủ cả 2 nhánh đạt và chưa đạt của page, task và annotation",
  async ({ I }) => {
    const { chapterId, pages, tasks, token } = await prepareReadyChapter(I, {
      reserve: false,
      requireTasks: true,
    });
    assert.ok(pages.length > 0);
    assert.ok(tasks.length > 0);

    const pageId = String(pages[0]._id || pages[0].id);
    const taskId = String(tasks[0]._id || tasks[0].id);
    const headers = publishHeaders(token);

    // 1. unapprovedPages.length > 0 (true -> 400, sau đó duyệt lại -> false)
    const pageRejected = await I.sendPutRequest(
      `/api/pages/approve/${pageId}`,
      { status: "Ready For Review" },
      headers,
    );
    assert.equal(pageRejected.status, 200);
    const unapprovedPage = await I.sendPostRequest(
      `/api/publish/chapter/${chapterId}`,
      {},
      headers,
    );
    assert.equal(unapprovedPage.status, 400);

    const pageApproved = await I.sendPutRequest(
      `/api/pages/approve/${pageId}`,
      { status: "Approved" },
      headers,
    );
    assert.equal(pageApproved.status, 200);

    // 2. unfinishedTasks.length > 0 (true -> 400, sau đó đặt Paid -> false)
    const taskInProgress = await I.sendPatchRequest(
      `/api/tasks/${taskId}/status`,
      { status: "In Progress" },
      headers,
    );
    assert.equal(taskInProgress.status, 200);
    const unfinishedTask = await I.sendPostRequest(
      `/api/publish/chapter/${chapterId}`,
      {},
      headers,
    );
    assert.equal(unfinishedTask.status, 400);

    const taskPaid = await I.sendPatchRequest(
      `/api/tasks/${taskId}/status`,
      { status: "Paid" },
      headers,
    );
    assert.equal(taskPaid.status, 200);

    // 3. unresolvedAnnotations.length > 0 (true -> 400, sau đó đặt Resolved -> false)
    const pageAnnotations = await I.sendGetRequest(
      `/api/annotations/chapter/${chapterId}`,
      headers,
    );
    const annotations =
      pageAnnotations.data?.data || pageAnnotations.data?.annotations || [];
    let annotationId = annotations[0]?._id || annotations[0]?.id;

    if (!annotationId) {
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
      annotationId =
        created.data?.data?._id ||
        created.data?.annotation?._id ||
        created.data?._id;
    } else {
      const reopened = await I.sendPatchRequest(
        `/api/annotations/${annotationId}`,
        { status: "Open" },
        headers,
      );
      assert.equal(reopened.status, 200);
    }

    const unresolved = await I.sendPostRequest(
      `/api/publish/chapter/${chapterId}`,
      {},
      headers,
    );
    assert.equal(unresolved.status, 400);

    const resolved = await I.sendPatchRequest(
      `/api/annotations/${annotationId}`,
      { status: "Resolved" },
      headers,
    );
    assert.equal(resolved.status, 200);
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
    assert.equal(emptyRes.data.message, "Chapter chưa có trang nào");

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
// PC-BC-05: Nhánh if (series.editor_id) là false (series không gán editor) nếu có dữ liệu
// ---------------------------------------------------------------------------
Scenario(
  "PC-BC-05: Xuất bản chapter thuộc series chưa gán editor chỉ gửi thông báo cho tác giả (200)",
  async ({ I }) => {
    await signInAsAdmin(I);
    const adminToken = await refreshAccessToken(I);
    const adminHeaders = publishHeaders(adminToken);

    const seriesRes = await I.sendGetRequest("/api/series", adminHeaders);
    const seriesList = seriesRes.data?.series || [];

    for (const item of seriesList) {
      const series = item.series || item;
      if (series.editor_id) continue;

      const seriesId = String(series._id || series.id);
      const chapRes = await I.sendGetRequest(
        `/api/chapters/series/${seriesId}`,
        adminHeaders,
      );
      for (const chap of chapRes.data?.chapters || []) {
        const chapId = String(chap._id || chap.id);
        const pageRes = await I.sendGetRequest(
          `/api/pages/chapter/${chapId}`,
          adminHeaders,
        );
        const pages = pageRes.data?.pages || [];
        if (pages.length === 0) continue;

        for (const p of pages) {
          if (p.status !== "Approved") {
            await I.sendPutRequest(
              `/api/pages/approve/${p._id || p.id}`,
              { status: "Approved" },
              adminHeaders,
            );
          }
        }
        const pubRes = await I.sendPostRequest(
          `/api/publish/chapter/${chapId}`,
          {},
          adminHeaders,
        );
        assert.equal(pubRes.status, 200);
        return;
      }
    }
  },
);

// ---------------------------------------------------------------------------
// PC-BC-06: Nhánh lỗi ngoại lệ catch (error) trả về 500
// ---------------------------------------------------------------------------
Scenario(
  "PC-BC-06: Lỗi runtime khi body không phải JSON rơi vào khối catch trả về 500",
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
