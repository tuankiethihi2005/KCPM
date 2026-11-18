import assert from "node:assert/strict";
import {
  castBoardVote,
  createSeriesDraft,
  createSubmittedSeries,
  openBoardReview,
  sendApiRequestWithAuth,
  sendVoteRequest,
  signInAs,
  finalizeBoardReview,
} from "../../series_test_helpers.js";
import { signInAsAdmin } from "../coverage_helpers.js";
import { createSeriesViaApi } from "../coverage_helpers.js";

Feature("White-Box Branch Coverage — castVote (100% Branches)");

// ---------------------------------------------------------------------------
// EBV-BC-01: Nhánh !vote và !INITIAL_VOTES.includes(vote) là true và false
// ---------------------------------------------------------------------------
Scenario(
  "EBV-BC-01: Thiếu vote hoặc giá trị vote không hợp lệ trả về 400, vote hợp lệ tạo phiếu 201",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSubmittedSeries(I);
    await signInAs(I, "editorial");

    for (const invalidBody of [
      {},
      { vote: "Unsupported" },
      { vote: "Reject", comment: 123 },
      { vote: "Reject", comment: "x".repeat(2001) },
    ]) {
      const rejected = await sendVoteRequest(I, seriesId, invalidBody);
      assert.equal(rejected.status, 400);
    }

    const accepted = await sendVoteRequest(I, seriesId, { vote: "Reject" });
    assert.equal(accepted.status, 201);
    assert.equal(accepted.body.vote.vote, "Reject");
  },
);

// ---------------------------------------------------------------------------
// EBV-BC-02: Nhánh !series là true (404) và false (201)
// ---------------------------------------------------------------------------
Scenario(
  "EBV-BC-02: Series không tồn tại trả về 404, Series hợp lệ đi tiếp 201",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSubmittedSeries(I);

    await signInAsAdmin(I);
    const notFound = await sendVoteRequest(I, "000000000000000000000000", {
      vote: "Approve",
    });
    assert.equal(notFound.status, 404);

    const found = await sendVoteRequest(I, seriesId, { vote: "Approve" });
    assert.equal(found.status, 201);
  },
);

// ---------------------------------------------------------------------------
// EBV-BC-03: Nhánh !proposal là true (400) và false (201)
// ---------------------------------------------------------------------------
Scenario(
  "EBV-BC-03: Series chưa có proposal trả về 400, Series đã có proposal đi tiếp 201",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const createRes = await createSeriesViaApi(I);
    const seriesWithoutPropId = createRes.body.series._id;
    const { seriesId: seriesWithPropId } = await createSubmittedSeries(I);

    await signInAsAdmin(I);
    const noProp = await sendVoteRequest(I, seriesWithoutPropId, {
      vote: "Approve",
    });
    assert.equal(noProp.status, 400);
    assert.equal(noProp.body.message, "Series chưa có proposal để bỏ phiếu");

    const withProp = await sendVoteRequest(I, seriesWithPropId, {
      vote: "Approve",
    });
    assert.equal(withProp.status, 201);
  },
);

// ---------------------------------------------------------------------------
// EBV-BC-04: Nhánh proposal.status === "Draft" là true (400) và false (201)
// ---------------------------------------------------------------------------
Scenario(
  "EBV-BC-04: Proposal ở trạng thái Draft bị từ chối 400, Proposal Submitted đi tiếp 201",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId: draftSeriesId } = await createSeriesDraft(I);
    const { seriesId: submittedSeriesId } = await createSubmittedSeries(I);

    await signInAsAdmin(I);
    const draftRes = await sendVoteRequest(I, draftSeriesId, {
      vote: "Approve",
    });
    assert.equal(draftRes.status, 400);
    assert.equal(draftRes.body.message, "Proposal không có trạng thái hợp lệ");

    const submittedRes = await sendVoteRequest(I, submittedSeriesId, {
      vote: "Approve",
    });
    assert.equal(submittedRes.status, 201);
  },
);

// ---------------------------------------------------------------------------
// EBV-BC-05: Nhánh !VOTABLE_PROPOSAL_STATUSES.includes(proposal.status) là true (400) và false (201)
// ---------------------------------------------------------------------------
Scenario(
  "EBV-BC-05: Proposal đã chốt Approved bị từ chối 400, Proposal chờ duyệt đi tiếp 201",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSubmittedSeries(I);

    // Chốt proposal sang Approved thông qua luồng xét duyệt chuẩn
    await openBoardReview(I, seriesId);
    await castBoardVote(I, "Approve");
    await finalizeBoardReview(I, "Approve");

    // Nhánh true: Proposal status là Approved (ngoài VOTABLE_PROPOSAL_STATUSES) -> 400
    await signInAsAdmin(I);
    const nonVotableRes = await sendVoteRequest(I, seriesId, {
      vote: "Reject",
    });
    assert.equal(nonVotableRes.status, 400);
    assert.equal(
      nonVotableRes.body.message,
      "Series không ở trạng thái chờ duyệt",
    );

    // Nhánh false: Proposal status là Submitted (thuộc VOTABLE_PROPOSAL_STATUSES) -> 201
    await signInAs(I, "mangaka");
    const { seriesId: votableSeriesId } = await createSubmittedSeries(I);
    await signInAsAdmin(I);
    const votableRes = await sendVoteRequest(I, votableSeriesId, {
      vote: "Approve",
    });
    assert.equal(votableRes.status, 201);
  },
);

// ---------------------------------------------------------------------------
// EBV-BC-06: Nhánh if (existingVote) là false (tạo mới 201) và true (cập nhật 200)
// ---------------------------------------------------------------------------
Scenario(
  "EBV-BC-06: Bỏ phiếu lần đầu tạo bản ghi mới 201, bỏ phiếu lại cập nhật phiếu cũ 200",
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
// EBV-BC-07: Nhánh proposal.status === "Submitted" là true (chuyển Under Review) và false (giữ Under Review)
// ---------------------------------------------------------------------------
Scenario(
  "EBV-BC-07: Phiếu đầu tiên chuyển Submitted sang Under Review, phiếu thứ hai giữ nguyên Under Review",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSubmittedSeries(I);

    // Phiếu 1 (Editorial Board): status đang là Submitted -> vào nhánh true -> chuyển sang Under Review
    await signInAs(I, "editorial");
    const vote1 = await sendVoteRequest(I, seriesId, { vote: "Approve" });
    assert.equal(vote1.status, 201);

    const check1 = await sendApiRequestWithAuth(
      I,
      `/series/${seriesId}`,
      "GET",
    );
    assert.equal(check1.body.proposal.status, "Under Review");

    // Phiếu 2 (Admin): status đã là Under Review -> vào nhánh false -> giữ nguyên Under Review
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

// ---------------------------------------------------------------------------
// EBV-BC-08: Middleware phân quyền role Admin (201) vs Mangaka (403)
// ---------------------------------------------------------------------------
Scenario(
  "EBV-BC-08: Tài khoản Admin được phép bỏ phiếu 201, tài khoản Mangaka bị từ chối 403",
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
// EBV-BC-09: Nhánh lỗi ngoại lệ catch (err) trả về 500
// ---------------------------------------------------------------------------
Scenario(
  "EBV-BC-09: Gửi ID sai định dạng ObjectId kích hoạt CastError vào khối catch trả về 500",
  async ({ I }) => {
    await signInAsAdmin(I);
    const errorRes = await sendVoteRequest(I, "invalid-object-id", {
      vote: "Approve",
    });

    assert.equal(errorRes.status, 500);
    assert.equal(errorRes.body.error, "Lỗi server");
  },
);
