import assert from "node:assert/strict";
import {
  prepareEmptyChapter,
  prepareReadyChapter,
  publishHeaders,
} from "./publish_chapter_coverage_helper.js";

Feature("White-Box Statement Coverage — publishChapter (100% Statements)");

// ---------------------------------------------------------------------------
// PC-ST-01: Chapter chưa có trang nào → 400
// Phủ dòng: dòng 16-20 if (pages.length === 0) return res.status(400)
// ---------------------------------------------------------------------------
Scenario("PC-ST-01: Chapter chưa có trang nào trả về 400", async ({ I }) => {
  const { chapterId, token } = await prepareEmptyChapter(I);
  const response = await I.sendPostRequest(
    `/api/publish/chapter/${chapterId}`,
    {},
    publishHeaders(token),
  );

  assert.equal(response.status, 400);
  assert.equal(response.data.message, "Chapter chưa có trang nào");
});

// ---------------------------------------------------------------------------
// PC-ST-02: Trang truyện chưa được phê duyệt → 400
// Phủ dòng: dòng 23-33 if (unapprovedPages.length > 0) return res.status(400)
// ---------------------------------------------------------------------------
Scenario(
  "PC-ST-02: Trang truyện chưa được phê duyệt trả về 400",
  async ({ I }) => {
    const { chapterId, pages, token } = await prepareReadyChapter(I, {
      reserve: false,
    });
    const headers = publishHeaders(token);
    const pageId = String(pages[0]._id || pages[0].id);

    await I.sendPutRequest(
      `/api/pages/approve/${pageId}`,
      { status: "Ready For Review" },
      headers,
    );

    const response = await I.sendPostRequest(
      `/api/publish/chapter/${chapterId}`,
      {},
      headers,
    );
    assert.equal(response.status, 400);
    assert.ok(
      response.data.message.includes(
        "Vẫn còn trang truyện chưa được phê duyệt",
      ),
    );

    await I.sendPutRequest(
      `/api/pages/approve/${pageId}`,
      { status: "Approved" },
      headers,
    );
  },
);

// ---------------------------------------------------------------------------
// PC-ST-03: Task chưa hoàn thành → 400
// Phủ dòng: dòng 36-46 if (unfinishedTasks.length > 0) return res.status(400)
// ---------------------------------------------------------------------------
Scenario("PC-ST-03: Task chưa hoàn thành trả về 400", async ({ I }) => {
  const { chapterId, tasks, token } = await prepareReadyChapter(I, {
    reserve: false,
    requireTasks: true,
  });
  const headers = publishHeaders(token);
  const taskId = String(tasks[0]._id || tasks[0].id);

  await I.sendPatchRequest(
    `/api/tasks/${taskId}/status`,
    { status: "In Progress" },
    headers,
  );

  const response = await I.sendPostRequest(
    `/api/publish/chapter/${chapterId}`,
    {},
    headers,
  );
  assert.equal(response.status, 400);
  assert.ok(response.data.message.includes("Vẫn còn task chưa hoàn thành"));

  await I.sendPatchRequest(
    `/api/tasks/${taskId}/status`,
    { status: "Paid" },
    headers,
  );
});

// ---------------------------------------------------------------------------
// PC-ST-04: Annotation chưa giải quyết → 400
// Phủ dòng: dòng 49-60 if (unresolvedAnnotations.length > 0) return res.status(400)
// ---------------------------------------------------------------------------
Scenario(
  "PC-ST-04: Annotation chưa được giải quyết trả về 400",
  async ({ I }) => {
    const { chapterId, pages, token } = await prepareReadyChapter(I, {
      reserve: false,
    });
    const headers = publishHeaders(token);
    const pageId = String(pages[0]._id || pages[0].id);

    const created = await I.sendPostRequest(
      `/api/annotations/page/${pageId}`,
      {
        x: 10,
        y: 10,
        content: "Unresolved annotation statement test",
        status: "Open",
      },
      headers,
    );
    const annotationId =
      created.data?.data?._id ||
      created.data?.annotation?._id ||
      created.data?._id;

    const response = await I.sendPostRequest(
      `/api/publish/chapter/${chapterId}`,
      {},
      headers,
    );
    assert.equal(response.status, 400);
    assert.ok(
      response.data.message.includes("Vẫn còn annotation chưa được giải quyết"),
    );

    if (annotationId) {
      await I.sendPatchRequest(
        `/api/annotations/${annotationId}`,
        { status: "Resolved" },
        headers,
      );
    }
  },
);

// ---------------------------------------------------------------------------
// PC-ST-05: Xuất bản chapter đủ điều kiện kèm release_issue_id → 200
// Phủ dòng: dòng 63-89 (cập nhật Published, release_issue_id, gửi thông báo)
// ---------------------------------------------------------------------------
Scenario(
  "PC-ST-05: Xuất bản chapter đủ điều kiện kèm release_issue_id trả về 200",
  async ({ I }) => {
    const { chapterId, token } = await prepareReadyChapter(I, {
      reserve: true,
    });
    const releaseIssueId = "000000000000000000000001";
    const response = await I.sendPostRequest(
      `/api/publish/chapter/${chapterId}`,
      { release_issue_id: releaseIssueId },
      publishHeaders(token),
    );

    assert.equal(response.status, 200);
    assert.equal(response.data.message, "Xuất bản chapter thành công");
    assert.equal(response.data.chapter.status, "Published");
    assert.ok(response.data.chapter.published_at);
    assert.equal(
      String(response.data.chapter.release_issue_id),
      releaseIssueId,
    );
  },
);

// ---------------------------------------------------------------------------
// PC-ST-06: Lỗi TypeError (body không phải JSON) rơi vào catch → 500
// Phủ dòng: dòng 90-94 catch (error) { return res.status(500)... }
// ---------------------------------------------------------------------------
Scenario(
  "PC-ST-06: Lỗi runtime khi body không phải JSON trả về 500",
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
