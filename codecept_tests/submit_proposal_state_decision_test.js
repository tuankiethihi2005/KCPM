import assert from "node:assert/strict";
import {
  castBoardVote,
  createSeries,
  createSeriesDraft,
  createSubmittedSeries,
  finalizeBoardReview,
  openBoardReview,
  sendApiRequestWithAuth,
  signInAs,
} from "./series_test_helpers.js";

async function getProposal(I, seriesId) {
  const response = await sendApiRequestWithAuth(
    I,
    `/series/${seriesId}`,
    "GET",
  );
  assert.equal(response.status, 200);
  return response.body.proposal;
}

async function setProposalStatus(I, seriesId, status) {
  if (status === "Submitted") return;

  await openBoardReview(I, seriesId);
  const vote = status === "Rejected" ? "Reject" : "Approve";
  await castBoardVote(I, vote);

  if (status === "Approved" || status === "Rejected") {
    await finalizeBoardReview(I, vote);
  }
}

Feature("Nộp Proposal — chuyển đổi trạng thái và bảng quyết định");

Scenario(
  "SP-SD-01 / R1: Proposal Draft hợp lệ chuyển sang Submitted và ghi thời hạn",
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
    assert.ok(response.body.proposal.submitted_at);
    assert.ok(response.body.proposal.review_deadline);
    assert.equal((await getProposal(I, seriesId)).status, "Submitted");
  },
);

Scenario(
  "SP-SD-02 / R1: Proposal Need Revision hợp lệ được nộp lại thành Submitted",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSubmittedSeries(I);
    await openBoardReview(I, seriesId);
    await castBoardVote(I, "Need Revision");
    await finalizeBoardReview(I, "Need Revision");

    await signInAs(I, "mangaka");
    const response = await sendApiRequestWithAuth(
      I,
      `/series/${seriesId}/proposal/submit`,
      "POST",
    );

    assert.equal(response.status, 200);
    assert.equal(response.body.proposal.status, "Submitted");
  },
);

Scenario(
  "SP-SD-03 / R2: thiếu summary, genre hoặc target audience bị từ chối, trạng thái vẫn Draft",
  async ({ I }) => {
    await signInAs(I, "mangaka");

    const noProposal = await createSeries(I);
    const missingSummary = await sendApiRequestWithAuth(
      I,
      `/series/${noProposal.seriesId}/proposal/submit`,
      "POST",
    );
    assert.equal(missingSummary.status, 400);
    assert.ok(missingSummary.body.missingFields.includes("summary"));

    const missingSeriesFields = await createSeriesDraft(I, {
      genre: "",
      targetAudience: "",
    });
    const response = await sendApiRequestWithAuth(
      I,
      `/series/${missingSeriesFields.seriesId}/proposal/submit`,
      "POST",
    );
    assert.equal(response.status, 400);
    assert.ok(response.body.missingFields.includes("genre"));
    assert.ok(response.body.missingFields.includes("target_audience"));
    assert.equal(
      (await getProposal(I, missingSeriesFields.seriesId)).status,
      "Draft",
    );
  },
);

Scenario(
  "SP-SD-04 / R3: không cho nộp lại khi Proposal ở Submitted, Under Review hoặc trạng thái cuối",
  async ({ I }) => {
    for (const status of ["Submitted", "Under Review", "Approved", "Rejected"]) {
      await signInAs(I, "mangaka");
      const { seriesId } = await createSubmittedSeries(I);
      await setProposalStatus(I, seriesId, status);
      await signInAs(I, "mangaka");

      const response = await sendApiRequestWithAuth(
        I,
        `/series/${seriesId}/proposal/submit`,
        "POST",
      );

      assert.equal(response.status, 400, `Submitting should be blocked in ${status}`);
      assert.equal((await getProposal(I, seriesId)).status, status);
    }
  },
);

Scenario(
  "SP-SD-05 / R4: Series đã hủy hoặc không tồn tại bị từ chối nộp",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSeriesDraft(I);

    await signInAs(I, "editorial");
    const cancel = await sendApiRequestWithAuth(
      I,
      `/series/${seriesId}/status`,
      "PATCH",
      { status: "Cancelled" },
    );
    assert.equal(cancel.status, 200);

    await signInAs(I, "mangaka");
    const cancelled = await sendApiRequestWithAuth(
      I,
      `/series/${seriesId}/proposal/submit`,
      "POST",
    );
    assert.equal(cancelled.status, 400);
    assert.equal((await getProposal(I, seriesId)).status, "Draft");

    const missing = await sendApiRequestWithAuth(
      I,
      "/series/000000000000000000000000/proposal/submit",
      "POST",
    );
    assert.equal(missing.status, 404);
  },
);
