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

async function getSeriesRecord(I, seriesId) {
  const response = await sendApiRequestWithAuth(
    I,
    `/series/${seriesId}`,
    "GET",
  );
  assert.equal(response.status, 200);
  return response.body;
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

Feature("Cập nhật Series — chuyển đổi trạng thái và bảng quyết định");

Scenario(
  "US-SD-01 / R1: cập nhật được khi chưa có Proposal hoặc Proposal đang Draft",
  async ({ I }) => {
    await signInAs(I, "mangaka");

    const noProposal = await createSeries(I);
    const noProposalUpdate = await sendApiRequestWithAuth(
      I,
      `/series/${noProposal.seriesId}`,
      "PUT",
      { title: `US-SD-01 no proposal ${Date.now()}` },
    );
    assert.equal(noProposalUpdate.status, 200);
    assert.equal(noProposalUpdate.body.series.status, "Draft");
    assert.equal((await getSeriesRecord(I, noProposal.seriesId)).proposal, null);

    const draft = await createSeriesDraft(I);
    const draftUpdate = await sendApiRequestWithAuth(
      I,
      `/series/${draft.seriesId}`,
      "PUT",
      { title: `US-SD-01 draft ${Date.now()}` },
    );
    assert.equal(draftUpdate.status, 200);
    assert.equal(
      (await getSeriesRecord(I, draft.seriesId)).proposal.status,
      "Draft",
    );
  },
);

Scenario(
  "US-SD-02 / R1: cập nhật ở Need Revision không đổi trạng thái; lưu Proposal mới chuyển về Draft",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSubmittedSeries(I);
    await openBoardReview(I, seriesId);
    await castBoardVote(I, "Need Revision");
    await finalizeBoardReview(I, "Need Revision");

    await signInAs(I, "mangaka");
    const updateSeries = await sendApiRequestWithAuth(
      I,
      `/series/${seriesId}`,
      "PUT",
      { title: `US-SD-02 revision ${Date.now()}` },
    );
    assert.equal(updateSeries.status, 200);
    assert.equal((await getSeriesRecord(I, seriesId)).proposal.status, "Need Revision");

    const saveProposal = await sendApiRequestWithAuth(
      I,
      `/series/${seriesId}/proposal`,
      "PUT",
      { summary: `Revised summary with enough characters ${Date.now()}` },
    );
    assert.equal(saveProposal.status, 200);
    assert.equal(saveProposal.body.proposal.status, "Draft");
  },
);

Scenario(
  "US-SD-03 / R2: từ chối cập nhật Series và Proposal ở Submitted, Under Review, Approved hoặc Rejected",
  async ({ I }) => {
    for (const status of ["Submitted", "Under Review", "Approved", "Rejected"]) {
      await signInAs(I, "mangaka");
      const { seriesId } = await createSubmittedSeries(I);
      await setProposalStatus(I, seriesId, status);
      await signInAs(I, "mangaka");

      const updateSeries = await sendApiRequestWithAuth(
        I,
        `/series/${seriesId}`,
        "PUT",
        { title: `US-SD-03 blocked ${status} ${Date.now()}` },
      );
      const saveProposal = await sendApiRequestWithAuth(
        I,
        `/series/${seriesId}/proposal`,
        "PUT",
        { summary: `Blocked proposal save ${status} ${Date.now()}` },
      );

      assert.equal(updateSeries.status, 400, `Series update should be blocked in ${status}`);
      assert.equal(saveProposal.status, 400, `Proposal save should be blocked in ${status}`);
      assert.equal((await getSeriesRecord(I, seriesId)).proposal.status, status);
    }
  },
);

Scenario(
  "US-SD-04 / R3: Series không tồn tại bị từ chối cập nhật",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const response = await sendApiRequestWithAuth(
      I,
      "/series/000000000000000000000000",
      "PUT",
      { title: "Missing series update" },
    );

    assert.equal(response.status, 404);
  },
);

Scenario(
  "US-SD-05 / R4: validation lỗi từ chối toàn bộ cập nhật, không lưu một phần",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId, title } = await createSeriesDraft(I);
    const response = await sendApiRequestWithAuth(
      I,
      `/series/${seriesId}`,
      "PUT",
      { title: "x", description: "Valid description that must not be saved" },
    );

    assert.equal(response.status, 400);
    const record = await getSeriesRecord(I, seriesId);
    assert.equal(record.series.title, title);
    assert.equal(record.series.description || "", "");
    assert.equal(record.proposal.status, "Draft");
  },
);
