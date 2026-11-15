import assert from "node:assert/strict";
import {
  prepareReadyChapter,
  publishHeaders,
} from "../Statement_Coverage/publish_chapter_coverage_helper.js";

Feature("Branch coverage — publish chapter");

Scenario("PC-BC-01: a Paid task is accepted as complete", async ({ I }) => {
  const { chapterId, tasks, token } = await prepareReadyChapter(I);
  assert.ok(tasks.some((task) => task.status === "Paid"), "A Paid task is required");

  const response = await I.sendPostRequest(
    `/api/publish/chapter/${chapterId}`,
    {},
    publishHeaders(token),
  );
  assert.equal(response.status, 200);
  assert.equal(response.data.chapter.status, "Published");
});

Scenario("PC-BC-02: release_issue_id is optional and is stored when provided", async ({ I }) => {
  const withoutIssue = await prepareReadyChapter(I);
  const plainPublish = await I.sendPostRequest(
    `/api/publish/chapter/${withoutIssue.chapterId}`,
    {},
    publishHeaders(withoutIssue.token),
  );
  assert.equal(plainPublish.status, 200);
  assert.ok(!plainPublish.data.chapter.release_issue_id);

  const withIssue = await prepareReadyChapter(I);
  const releaseIssueId = "000000000000000000000001";
  const linkedPublish = await I.sendPostRequest(
    `/api/publish/chapter/${withIssue.chapterId}`,
    { release_issue_id: releaseIssueId },
    publishHeaders(withIssue.token),
  );
  assert.equal(linkedPublish.status, 200);
  assert.equal(String(linkedPublish.data.chapter.release_issue_id), releaseIssueId);
});

Scenario("PC-BC-03: page, task, and annotation guards reject incomplete data", async ({ I }) => {
  const { chapterId, pages, tasks, token } = await prepareReadyChapter(I);
  assert.ok(pages.length > 0);
  assert.ok(tasks.length > 0, "A task is required to exercise its unfinished branch");

  const pageId = String(pages[0]._id || pages[0].id);
  const headers = publishHeaders(token);
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

  const taskInProgress = await I.sendPatchRequest(
    `/api/tasks/${tasks[0]._id || tasks[0].id}/status`,
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
    `/api/tasks/${tasks[0]._id || tasks[0].id}/status`,
    { status: "Paid" },
    headers,
  );
  assert.equal(taskPaid.status, 200);

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
});

// ---------------------------------------------------------------------------
// PC-BC-04: Nhánh !chapter là true và false
// ---------------------------------------------------------------------------
Scenario("PC-BC-04: branch !chapter is true and false", async ({ I }) => {
  const { chapterId, token } = await prepareReadyChapter(I);
  const headers = publishHeaders(token);

  // true: chapter không tồn tại
  const notFound = await I.sendPostRequest(
    `/api/publish/chapter/000000000000000000000000`,
    {},
    headers,
  );
  assert.equal(notFound.status, 404);

  // false: chapter tồn tại
  const found = await I.sendPostRequest(
    `/api/publish/chapter/${chapterId}`,
    {},
    headers,
  );
  assert.equal(found.status, 200);
});
