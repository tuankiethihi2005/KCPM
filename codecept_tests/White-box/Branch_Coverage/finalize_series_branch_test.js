import assert from "node:assert/strict";
import {
  castBoardVote,
  createSubmittedSeries,
  openBoardReview,
  sendApiRequestWithAuth,
  sendVoteRequest,
  signInAs,
} from "../../series_test_helpers.js";
import { signInAsAdmin } from "../coverage_helpers.js";

Feature("Branch coverage — finalize series");

Scenario(
  "FS-BC-01: Approve tied with Need Revision falls through to Need Revision",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSubmittedSeries(I);
    await openBoardReview(I, seriesId);
    await castBoardVote(I, "Approve");

    await signInAsAdmin(I);
    const secondVote = await sendVoteRequest(I, seriesId, {
      vote: "Need Revision",
      comment: "Tie-break branch",
    });
    assert.equal(secondVote.status, 201);

    const finalized = await sendApiRequestWithAuth(
      I,
      `/board/series/${seriesId}/finalize`,
      "POST",
    );
    assert.equal(finalized.status, 200);
    assert.equal(finalized.body.decision, "Need Revision");
    assert.equal(finalized.body.proposal.status, "Need Revision");
  },
);

Scenario(
  "FS-BC-02: empty approved_schedule takes the default schedule branch",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSubmittedSeries(I);
    await openBoardReview(I, seriesId);
    await castBoardVote(I, "Approve");

    const response = await sendApiRequestWithAuth(
      I,
      `/board/series/${seriesId}/finalize`,
      "POST",
      { approved_schedule: "" },
    );
    assert.equal(response.status, 200);
    assert.equal(response.body.series.approved_schedule, "weekly");
  },
);

Scenario(
  "FS-BC-03: Admin is authorized to finalize a proposal",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSubmittedSeries(I);
    await openBoardReview(I, seriesId);
    await castBoardVote(I, "Approve");

    await signInAsAdmin(I);
    const response = await sendApiRequestWithAuth(
      I,
      `/board/series/${seriesId}/finalize`,
      "POST",
    );
    assert.equal(response.status, 200);
    assert.equal(response.body.decision, "Approve");
  },
);

Scenario(
  "FS-BC-04: Approve, Reject, and Need Revision decisions are all reachable",
  async ({ I }) => {
    const expected = [
      ["Approve", "Approved", "Active"],
      ["Reject", "Rejected", "Draft"],
      ["Need Revision", "Need Revision", "Draft"],
    ];

    for (const [vote, proposalStatus, seriesStatus] of expected) {
      await signInAs(I, "mangaka");
      const { seriesId } = await createSubmittedSeries(I);
      await openBoardReview(I, seriesId);
      await castBoardVote(I, vote);

      const response = await sendApiRequestWithAuth(
        I,
        `/board/series/${seriesId}/finalize`,
        "POST",
      );
      assert.equal(response.status, 200, `Decision ${vote} should finalize`);
      assert.equal(response.body.decision, vote);
      assert.equal(response.body.proposal.status, proposalStatus);
      assert.equal(response.body.series.status, seriesStatus);
    }
  },
);

// ---------------------------------------------------------------------------
// FS-BC-05: Nhánh status === 500 là false trong catch của finalizeSeries
// Khi service ném lỗi có error.status (400 hoặc 404), trả về res.status(status).json(...)
// ---------------------------------------------------------------------------
Scenario(
  "FS-BC-05: service throws status 400/404 routed to status response instead of 500",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSubmittedSeries(I);
    await openBoardReview(I, seriesId);

    // Chưa có phiếu bầu → ném lỗi status 400
    const response = await sendApiRequestWithAuth(
      I,
      `/board/series/${seriesId}/finalize`,
      "POST",
    );
    assert.equal(response.status, 400);
    assert.equal(response.body.message, "Chưa có phiếu bầu nào");
  },
);

// ---------------------------------------------------------------------------
// FS-BC-06: Nhánh SCHEDULE_VALUES.includes(schedule) là false và true
// ---------------------------------------------------------------------------
Scenario(
  "FS-BC-06: branch SCHEDULE_VALUES.includes(schedule) is false and true",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSubmittedSeries(I);
    await openBoardReview(I, seriesId);
    await castBoardVote(I, "Approve");

    // false: schedule sai
    const invalidRes = await sendApiRequestWithAuth(
      I,
      `/board/series/${seriesId}/finalize`,
      "POST",
      { approved_schedule: "unsupported_schedule" },
    );
    assert.equal(invalidRes.status, 400);

    // true: schedule đúng
    const validRes = await sendApiRequestWithAuth(
      I,
      `/board/series/${seriesId}/finalize`,
      "POST",
      { approved_schedule: "monthly" },
    );
    assert.equal(validRes.status, 200);
    assert.equal(validRes.body.series.approved_schedule, "monthly");
  },
);
