import assert from "node:assert/strict";
import {
  createSeriesDraft,
  createSubmittedSeries,
  openBoardReview,
  sendApiRequestWithAuth,
  sendVoteRequest,
  signInAs,
} from "../../series_test_helpers.js";
import { signInAsAdmin } from "../coverage_helpers.js";
import { createSeriesViaApi } from "../create_series_coverage_helpers.js";

Feature("Branch coverage — editorial board vote");

// ---------------------------------------------------------------------------
// EBV-BC-01: Middleware phân quyền role Admin vs Mangaka
// ---------------------------------------------------------------------------
Scenario(
  "EBV-BC-01: Admin is allowed while Mangaka is forbidden from voting",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const allowedSeries = await createSubmittedSeries(I);
    await signInAsAdmin(I);
    const allowed = await sendVoteRequest(I, allowedSeries.seriesId, {
      vote: "Approve",
    });
    assert.equal(allowed.status, 201);

    await signInAs(I, "mangaka");
    const forbiddenSeries = await createSubmittedSeries(I);
    const forbidden = await sendVoteRequest(I, forbiddenSeries.seriesId, {
      vote: "Approve",
    });
    assert.equal(forbidden.status, 403);
  },
);

// ---------------------------------------------------------------------------
// EBV-BC-02: Nhánh existingVote (false: tạo mới 201, true: cập nhật 200)
// ---------------------------------------------------------------------------
Scenario(
  "EBV-BC-02: first vote creates a record and a later vote updates it",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSubmittedSeries(I);
    await signInAs(I, "editorial");
    const first = await sendVoteRequest(I, seriesId, { vote: "Approve" });
    assert.equal(first.status, 201);
    assert.equal(
      (await sendApiRequestWithAuth(I, `/series/${seriesId}`, "GET")).body
        .proposal.status,
      "Under Review",
    );

    const updated = await sendVoteRequest(I, seriesId, {
      vote: "Need Revision",
      comment: "Updated vote",
    });
    assert.equal(updated.status, 200);
    assert.equal(updated.body.vote._id, first.body.vote._id);
    assert.equal(updated.body.vote.vote, "Need Revision");
  },
);

// ---------------------------------------------------------------------------
// EBV-BC-14: Nhánh !vote và !INITIAL_VOTES.includes(vote)
// ---------------------------------------------------------------------------
Scenario(
  "EBV-BC-14: valid vote values are accepted and missing or unsupported values are rejected",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSubmittedSeries(I);
    await signInAs(I, "editorial");

    for (const invalidBody of [{}, { vote: "Unsupported" }]) {
      const rejected = await sendVoteRequest(I, seriesId, invalidBody);
      assert.equal(rejected.status, 400);
    }

    const accepted = await sendVoteRequest(I, seriesId, { vote: "Reject" });
    assert.equal(accepted.status, 201);
    assert.equal(accepted.body.vote.vote, "Reject");
  },
);

// ---------------------------------------------------------------------------
// EBV-BC-03: Nhánh !series là true và false
// ---------------------------------------------------------------------------
Scenario("EBV-BC-03: branch !series is true and false", async ({ I }) => {
  await signInAs(I, "mangaka");
  const { seriesId } = await createSubmittedSeries(I);

  await signInAsAdmin(I);
  // Nhánh true: series not found
  const notFound = await sendVoteRequest(I, "000000000000000000000000", {
    vote: "Approve",
  });
  assert.equal(notFound.status, 404);

  // Nhánh false: series found
  const found = await sendVoteRequest(I, seriesId, { vote: "Approve" });
  assert.equal(found.status, 201);
});

// ---------------------------------------------------------------------------
// EBV-BC-04: Nhánh !proposal là true và false
// ---------------------------------------------------------------------------
Scenario("EBV-BC-04: branch !proposal is true and false", async ({ I }) => {
  await signInAs(I, "mangaka");
  // Tạo series không có proposal
  const createRes = await createSeriesViaApi(I);
  const seriesWithoutPropId = createRes.body.series._id;
  // Tạo series có proposal
  const { seriesId: seriesWithPropId } = await createSubmittedSeries(I);

  await signInAsAdmin(I);
  // Nhánh true: không có proposal
  const noProp = await sendVoteRequest(I, seriesWithoutPropId, {
    vote: "Approve",
  });
  assert.equal(noProp.status, 400);
  assert.equal(noProp.body.message, "Series chưa có proposal để bỏ phiếu");

  // Nhánh false: có proposal
  const withProp = await sendVoteRequest(I, seriesWithPropId, {
    vote: "Approve",
  });
  assert.equal(withProp.status, 201);
});

// ---------------------------------------------------------------------------
// EBV-BC-05: Nhánh proposal.status === 'Draft' là true và false
// ---------------------------------------------------------------------------
Scenario(
  "EBV-BC-05: branch proposal.status === 'Draft' is true and false",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId: draftSeriesId } = await createSeriesDraft(I);
    const { seriesId: submittedSeriesId } = await createSubmittedSeries(I);

    await signInAsAdmin(I);
    // Nhánh true: proposal là Draft
    const draftRes = await sendVoteRequest(I, draftSeriesId, {
      vote: "Approve",
    });
    assert.equal(draftRes.status, 400);
    assert.equal(draftRes.body.message, "Proposal không có trạng thái hợp lệ");

    // Nhánh false: proposal không phải Draft (Submitted)
    const submittedRes = await sendVoteRequest(I, submittedSeriesId, {
      vote: "Approve",
    });
    assert.equal(submittedRes.status, 201);
  },
);

// ---------------------------------------------------------------------------
// EBV-BC-06: Nhánh !VOTABLE_PROPOSAL_STATUSES.includes(proposal.status) là true và false
// ---------------------------------------------------------------------------
Scenario(
  "EBV-BC-06: branch !VOTABLE_PROPOSAL_STATUSES.includes(proposal.status) is true and false",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSubmittedSeries(I);

    await openBoardReview(I, seriesId);
    await signInAsAdmin(I);
    await sendVoteRequest(I, seriesId, { vote: "Approve" });

    // Finalize series để chuyển sang Approved (không votable)
    const finalized = await sendApiRequestWithAuth(
      I,
      `/board/series/${seriesId}/finalize`,
      "POST",
    );
    assert.equal(finalized.status, 200);

    // Nhánh true: Proposal status là Approved (ngoài VOTABLE_PROPOSAL_STATUSES)
    const nonVotableRes = await sendVoteRequest(I, seriesId, {
      vote: "Reject",
    });
    assert.equal(nonVotableRes.status, 400);
    assert.equal(
      nonVotableRes.body.message,
      "Series không ở trạng thái chờ duyệt",
    );
  },
);

// ---------------------------------------------------------------------------
// EBV-BC-07: Nhánh proposal.status === 'Submitted' là true và false
// ---------------------------------------------------------------------------
Scenario(
  "EBV-BC-07: branch proposal.status === 'Submitted' is true (transitions to Under Review) and false (already Under Review)",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSubmittedSeries(I);

    // Vote 1 (Editorial Board member): status đang là Submitted → vào nhánh true → đổi sang Under Review
    await signInAs(I, "editorial");
    const vote1 = await sendVoteRequest(I, seriesId, { vote: "Approve" });
    assert.equal(vote1.status, 201);

    const check1 = await sendApiRequestWithAuth(
      I,
      `/series/${seriesId}`,
      "GET",
    );
    assert.equal(check1.body.proposal.status, "Under Review");

    // Vote 2 (Admin member): status hiện tại là Under Review → vào nhánh false của (proposal.status === "Submitted")
    await signInAsAdmin(I);
    const vote2 = await sendVoteRequest(I, seriesId, { vote: "Need Revision" });
    assert.equal(vote2.status, 201);

    const check2 = await sendApiRequestWithAuth(
      I,
      `/series/${seriesId}`,
      "GET",
    );
    assert.equal(check2.body.proposal.status, "Under Review");
  },
);
