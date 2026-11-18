import assert from "node:assert/strict";
import {
  castBoardVote,
  createSeriesDraft,
  createSubmittedSeries,
  openBoardReview,
  refreshAccessToken,
  sendApiRequestWithAuth,
  sendVoteRequest,
  signInAs,
} from "../../series_test_helpers.js";
import { signInAsAdmin } from "../coverage_helpers.js";

Feature(
  "White-Box Branch Coverage — finalizeSeries & boardFinalizeService (100% Reachable Branches)",
);

// ---------------------------------------------------------------------------
// FS-BC-01: computeDecision — Approve > Reject đúng nhưng Approve > Need Revision sai
// ---------------------------------------------------------------------------
Scenario(
  "FS-BC-01: Hòa phiếu giữa Approve và Need Revision chọn quyết định Need Revision (200)",
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
      {},
    );
    assert.equal(finalized.status, 200);
    assert.equal(finalized.body.decision, "Need Revision");
    assert.equal(finalized.body.proposal.status, "Need Revision");
  },
);

// ---------------------------------------------------------------------------
// FS-BC-02: Nhánh approved_schedule || DEFAULT_APPROVED_SCHEDULE (rỗng -> mặc định)
// ---------------------------------------------------------------------------
Scenario(
  "FS-BC-02: Gửi approved_schedule rỗng áp dụng lịch mặc định weekly (200)",
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
      { approved_schedule: "" },
    );
    assert.equal(response.status, 200);
    assert.equal(response.body.series.approved_schedule, "weekly");
  },
);

// ---------------------------------------------------------------------------
// FS-BC-03: Phân quyền route finalize (Admin được phép 200 vs Mangaka bị chặn 403)
// ---------------------------------------------------------------------------
Scenario(
  "FS-BC-03: Tài khoản Admin được phép chốt kết quả 200, tài khoản Mangaka bị từ chối 403",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSubmittedSeries(I);
    await openBoardReview(I, seriesId);
    await castBoardVote(I, "Approve");

    // Mangaka không có quyền chốt -> 403
    await signInAs(I, "mangaka");
    const forbiddenRes = await sendApiRequestWithAuth(
      I,
      `/board/series/${seriesId}/finalize`,
      "POST",
      {},
    );
    assert.equal(forbiddenRes.status, 403);

    // Admin có quyền chốt -> 200
    await signInAsAdmin(I);
    const allowedRes = await sendApiRequestWithAuth(
      I,
      `/board/series/${seriesId}/finalize`,
      "POST",
      {},
    );
    assert.equal(allowedRes.status, 200);
    assert.equal(allowedRes.body.decision, "Approve");
  },
);

// ---------------------------------------------------------------------------
// FS-BC-04: Phủ đủ 3 nhánh quyết định Approve, Reject và Need Revision
// ---------------------------------------------------------------------------
Scenario(
  "FS-BC-04: Các nhánh quyết định Approve, Reject và Need Revision cập nhật đúng trạng thái",
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

      await signInAsAdmin(I);
      const response = await sendApiRequestWithAuth(
        I,
        `/board/series/${seriesId}/finalize`,
        "POST",
        {},
      );
      assert.equal(response.status, 200, `Decision ${vote} should finalize`);
      assert.equal(response.body.decision, vote);
      assert.equal(response.body.proposal.status, proposalStatus);
      assert.equal(response.body.series.status, seriesStatus);
    }
  },
);

// ---------------------------------------------------------------------------
// FS-BC-05: Các nhánh kiểm tra điều kiện trong finalizeSeriesById (!series, !proposal, !PENDING, votes === 0)
// ---------------------------------------------------------------------------
Scenario(
  "FS-BC-05: Phủ các nhánh từ chối 404/400 khi thiếu series, thiếu proposal, sai trạng thái hoặc chưa có phiếu",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    // Tạo series chưa có proposal
    const noProposalRes = await sendApiRequestWithAuth(I, "/series", "POST", {
      title: `No Proposal Finalize ${Date.now()}`,
    });
    assert.equal(noProposalRes.status, 201);
    const noProposalSeriesId = noProposalRes.body.series._id;

    // Tạo series có proposal ở trạng thái Draft
    const { seriesId: draftSeriesId } = await createSeriesDraft(I);

    // Tạo series đã Submitted nhưng chưa có phiếu bầu nào
    const { seriesId: noVoteSeriesId } = await createSubmittedSeries(I);

    await signInAsAdmin(I);

    // 1. !series -> 404
    const missingSeries = await sendApiRequestWithAuth(
      I,
      "/board/series/000000000000000000000000/finalize",
      "POST",
      {},
    );
    assert.equal(missingSeries.status, 404);
    assert.equal(missingSeries.body.message, "Không tìm thấy series");

    // 2. !proposal -> 404
    const missingProposal = await sendApiRequestWithAuth(
      I,
      `/board/series/${noProposalSeriesId}/finalize`,
      "POST",
      {},
    );
    assert.equal(missingProposal.status, 404);
    assert.equal(missingProposal.body.message, "Không tìm thấy proposal");

    // 3. !PENDING_PROPOSAL_STATUSES.includes(proposal.status) -> 400
    const nonPending = await sendApiRequestWithAuth(
      I,
      `/board/series/${draftSeriesId}/finalize`,
      "POST",
      {},
    );
    assert.equal(nonPending.status, 400);
    assert.equal(nonPending.body.message, "Proposal đã được xử lý");

    // 4. votes.length === 0 -> 400
    const noVotes = await sendApiRequestWithAuth(
      I,
      `/board/series/${noVoteSeriesId}/finalize`,
      "POST",
      {},
    );
    assert.equal(noVotes.status, 400);
    assert.equal(noVotes.body.message, "Chưa có phiếu bầu nào");
  },
);

// ---------------------------------------------------------------------------
// FS-BC-06: Nhánh !SCHEDULE_VALUES.includes(schedule) là true (400) và false (200)
// ---------------------------------------------------------------------------
Scenario(
  "FS-BC-06: Lịch phát hành không hợp lệ trả về 400, lịch phát hành hợp lệ trả về 200",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSubmittedSeries(I);
    await openBoardReview(I, seriesId);
    await castBoardVote(I, "Approve");

    await signInAsAdmin(I);

    // true: schedule không nằm trong SCHEDULE_VALUES -> 400
    const invalidRes = await sendApiRequestWithAuth(
      I,
      `/board/series/${seriesId}/finalize`,
      "POST",
      { approved_schedule: "unsupported_schedule" },
    );
    assert.equal(invalidRes.status, 400);

    // false: schedule hợp lệ -> 200
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

// ---------------------------------------------------------------------------
// FS-BC-07: Nhánh header x-test-expire-no-votes: "1" và toàn bộ nhánh markNeedRevisionNoVotes
// ---------------------------------------------------------------------------
Scenario(
  "FS-BC-07: Phủ đủ 4 nhánh của markNeedRevisionNoVotes qua header x-test-expire-no-votes",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const noPropRes = await sendApiRequestWithAuth(I, "/series", "POST", {
      title: `Expire No Proposal ${Date.now()}`,
    });
    const noPropSeriesId = noPropRes.body.series._id;
    const { seriesId: draftSeriesId } = await createSeriesDraft(I);
    const { seriesId: submittedSeriesId } = await createSubmittedSeries(I);

    await signInAsAdmin(I);
    const token = await refreshAccessToken(I);

    const callExpire = (targetId) =>
      I.executeScript(
        async ({ id, accessToken }) => {
          const res = await fetch(
            `http://localhost:5000/api/board/series/${id}/finalize`,
            {
              method: "POST",
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
                "x-test-expire-no-votes": "1",
              },
              body: "{}",
            },
          );
          return { status: res.status, body: await res.json() };
        },
        { id: targetId, accessToken: token },
      );

    // 1. !series -> result: null
    const res1 = await callExpire("000000000000000000000000");
    assert.equal(res1.status, 200);
    assert.equal(res1.body.result, null);

    // 2. !proposal -> result: null
    const res2 = await callExpire(noPropSeriesId);
    assert.equal(res2.status, 200);
    assert.equal(res2.body.result, null);

    // 3. !PENDING_PROPOSAL_STATUSES.includes(proposal.status) -> result: null
    const res3 = await callExpire(draftSeriesId);
    assert.equal(res3.status, 200);
    assert.equal(res3.body.result, null);

    // 4. Proposal Submitted hợp lệ -> chuyển sang Need Revision
    const res4 = await callExpire(submittedSeriesId);
    assert.equal(res4.status, 200);
    assert.equal(res4.body.result.proposal.status, "Need Revision");
  },
);

// ---------------------------------------------------------------------------
// FS-BC-08: Khối catch trong finalizeSeries khi status === 500 là true (500)
// ---------------------------------------------------------------------------
Scenario(
  "FS-BC-08: Lỗi runtime không có err.status rơi vào nhánh status === 500 trả về 500",
  async ({ I }) => {
    await signInAsAdmin(I);
    const errorRes = await sendApiRequestWithAuth(
      I,
      "/board/series/invalid-object-id/finalize",
      "POST",
      {},
    );

    assert.equal(errorRes.status, 500);
    assert.equal(errorRes.body.error, "Lỗi server");
  },
);

// ---------------------------------------------------------------------------
// FS-BC-09: Nhánh fallback req.body || {} khi gửi request không có JSON body
// ---------------------------------------------------------------------------
Scenario(
  "FS-BC-09: Gửi request finalize không kèm body (req.body undefined) kích hoạt fallback {}",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSubmittedSeries(I);
    await openBoardReview(I, seriesId);
    await castBoardVote(I, "Approve");

    await signInAsAdmin(I);
    const token = await refreshAccessToken(I);

    const response = await I.executeScript(
      async ({ id, accessToken }) => {
        const res = await fetch(
          `http://localhost:5000/api/board/series/${id}/finalize`,
          {
            method: "POST",
            credentials: "include",
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );
        return { status: res.status, body: await res.json() };
      },
      { id: seriesId, accessToken: token },
    );

    assert.equal(response.status, 200);
    assert.equal(response.body.decision, "Approve");
    assert.equal(response.body.series.approved_schedule, "weekly");
  },
);
