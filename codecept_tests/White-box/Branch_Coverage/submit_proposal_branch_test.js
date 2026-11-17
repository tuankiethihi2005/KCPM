import assert from "node:assert/strict";
import {
  castBoardVote,
  createSeries,
  createSeriesDraft,
  createSubmittedSeries,
  finalizeBoardReview,
  openBoardReview,
  refreshAccessToken,
  sendApiRequestWithAuth,
  signInAs,
} from "../../series_test_helpers.js";
import { signInAsAdmin } from "../coverage_helpers.js";

Feature("White-Box Branch Coverage — submitProposal (100% Reachable Branches)");

// ---------------------------------------------------------------------------
// SP-BC-01: Nộp hồ sơ Draft hợp lệ thành công (200)
// ---------------------------------------------------------------------------
Scenario(
  "SP-BC-01: Nộp hồ sơ Draft hợp lệ chuyển trạng thái sang Submitted (200)",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSeriesDraft(I);
    const response = await sendApiRequestWithAuth(
      I,
      `/series/${seriesId}/proposal/submit`,
      "POST",
    );

    assert.equal(response.status, 200);
    assert.equal(response.body.proposal.status, "Submitted");
  },
);

// ---------------------------------------------------------------------------
// SP-BC-02: Nhánh if (!proposal) khi atomic findOneAndUpdate tranh chấp (200 vs 409)
// ---------------------------------------------------------------------------
Scenario(
  "SP-BC-02: Gửi đồng thời 2 request submit phủ cả 2 nhánh của if (!proposal) (200 và 409)",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSeriesDraft(I);
    const token = await refreshAccessToken(I);
    const statuses = await I.executeScript(
      async ({ id, accessToken }) => {
        const request = () =>
          fetch(`http://localhost:5000/api/series/${id}/proposal/submit`, {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: "{}",
          }).then((response) => response.status);
        return Promise.all([request(), request()]);
      },
      { id: seriesId, accessToken: token },
    );

    assert.deepEqual([...statuses].sort(), [200, 409]);
  },
);

// ---------------------------------------------------------------------------
// SP-BC-03: Nhánh missingFields.length > 0 (400) và === 0 (200), kèm proposalToSubmit null
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// SP-BC-03: Nhánh missingFields.length > 0 (400) và === 0 (200), kèm proposalToSubmit null
// ---------------------------------------------------------------------------
Scenario(
  "SP-BC-03: Thiếu trường bắt buộc trả về 400, đủ trường bắt buộc nộp thành công 200",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const incomplete = await sendApiRequestWithAuth(I, "/series", "POST", {
      title: `Incomplete Series ${Date.now()}`,
    });
    assert.equal(incomplete.status, 201);

    const rejected = await sendApiRequestWithAuth(
      I,
      `/series/${incomplete.body.series._id}/proposal/submit`,
      "POST",
    );
    assert.equal(rejected.status, 400);
    assert.deepEqual(rejected.body.missingFields, [
      "genre",
      "target_audience",
      "summary",
    ]);

    const complete = await createSeriesDraft(I);
    const accepted = await sendApiRequestWithAuth(
      I,
      `/series/${complete.seriesId}/proposal/submit`,
      "POST",
    );
    assert.equal(accepted.status, 200);
    assert.equal(accepted.body.proposal.status, "Submitted");
  },
);
// ---------------------------------------------------------------------------
// SP-BC-04: Nhánh series.status === "Cancelled" là true (400) và false (200)
// ---------------------------------------------------------------------------
Scenario(
  "SP-BC-04: Series ở trạng thái Cancelled bị từ chối 400, Series hoạt động đi tiếp 200",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSeriesDraft(I);

    // true: Đổi Series sang Cancelled
    await signInAsAdmin(I);
    await sendApiRequestWithAuth(I, `/series/${seriesId}/status`, "PATCH", {
      status: "Cancelled",
    });

    await signInAs(I, "mangaka");
    const cancelledRes = await sendApiRequestWithAuth(
      I,
      `/series/${seriesId}/proposal/submit`,
      "POST",
    );
    assert.equal(cancelledRes.status, 400);
    assert.ok(cancelledRes.body.message.includes("Series đã bị hủy"));

    // false: Series Draft bình thường
    const normal = await createSeriesDraft(I);
    const normalRes = await sendApiRequestWithAuth(
      I,
      `/series/${normal.seriesId}/proposal/submit`,
      "POST",
    );
    assert.equal(normalRes.status, 200);
  },
);

// ---------------------------------------------------------------------------
// SP-BC-05: Nhánh proposalToSubmit && !SUBMITTABLE_STATUSES.includes(status)
// ---------------------------------------------------------------------------
Scenario(
  "SP-BC-05: Proposal đã Submitted bị từ chối 400; Proposal Draft và Need Revision nộp thành công 200",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSubmittedSeries(I);

    // true: Proposal đang ở Submitted
    const resSubmitted = await sendApiRequestWithAuth(
      I,
      `/series/${seriesId}/proposal/submit`,
      "POST",
    );
    assert.equal(resSubmitted.status, 400);

    // false (nhánh 1): Proposal ở Draft
    const draftSeries = await createSeriesDraft(I);
    const resDraft = await sendApiRequestWithAuth(
      I,
      `/series/${draftSeries.seriesId}/proposal/submit`,
      "POST",
    );
    assert.equal(resDraft.status, 200);

    // false (nhánh 2): Proposal ở Need Revision
    const revisionSeries = await createSubmittedSeries(I);
    await openBoardReview(I, revisionSeries.seriesId);
    await castBoardVote(I, "Need Revision");
    await finalizeBoardReview(I, "Need Revision");

    await signInAs(I, "mangaka");
    const resRevision = await sendApiRequestWithAuth(
      I,
      `/series/${revisionSeries.seriesId}/proposal/submit`,
      "POST",
    );
    assert.equal(resRevision.status, 200);
    assert.equal(resRevision.body.proposal.status, "Submitted");
  },
);

// ---------------------------------------------------------------------------
// SP-BC-06: Nhánh if (notifyUserIds.length === 0) gửi thông báo dự phòng tới Admin & Tantou Editor
// ---------------------------------------------------------------------------
Scenario(
  "SP-BC-06: Không có Editorial Board hoạt động kích hoạt nhánh thông báo dự phòng (200)",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSeriesDraft(I);
    const token = await refreshAccessToken(I);

    const result = await I.executeScript(
      async ({ id, accessToken }) => {
        const res = await fetch(
          `http://localhost:5000/api/series/${id}/proposal/submit`,
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
              "x-force-empty-board": "1",
            },
            body: "{}",
          },
        );
        return { status: res.status, body: await res.json() };
      },
      { id: seriesId, accessToken: token },
    );

    assert.equal(result.status, 200);
    assert.equal(result.body.proposal.status, "Submitted");
  },
);

// ---------------------------------------------------------------------------
// SP-BC-07: Nhánh lỗi runtime đi vào khối catch (err) trả về 500
// ---------------------------------------------------------------------------
Scenario(
  "SP-BC-07: Lỗi runtime trong quá trình nộp hồ sơ rơi vào khối catch trả về 500",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSeriesDraft(I);
    const token = await refreshAccessToken(I);

    const result = await I.executeScript(
      async ({ id, accessToken }) => {
        const res = await fetch(
          `http://localhost:5000/api/series/${id}/proposal/submit`,
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
              "x-force-error": "1",
            },
            body: "{}",
          },
        );
        return { status: res.status, body: await res.json() };
      },
      { id: seriesId, accessToken: token },
    );

    assert.equal(result.status, 500);
    assert.equal(result.body.error, "Lỗi server");
  },
);
