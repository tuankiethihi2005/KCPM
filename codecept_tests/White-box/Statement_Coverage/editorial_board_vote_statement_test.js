import assert from "node:assert/strict";
import {
  createSeriesDraft,
  createSubmittedSeries,
  openBoardReview,
  sendApiRequestWithAuth,
  sendVoteRequest,
  signInAs,
} from "../../series_test_helpers.js";
import { createSeriesViaApi, signInAsAdmin } from "../coverage_helpers.js";

Feature("White-Box Statement Coverage — castVote (100% Statements)");

// ---------------------------------------------------------------------------
// EBV-ST-01: Admin bỏ phiếu hợp lệ đầu tiên trên proposal Submitted → 201
// Phủ dòng: dòng 67-83 (tạo vote mới, đổi status proposal sang Under Review)
// ---------------------------------------------------------------------------
Scenario(
  "EBV-ST-01: Admin bỏ phiếu hợp lệ đầu tiên trên proposal Submitted trả về 201",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSeriesDraft(I);
    const submitted = await sendApiRequestWithAuth(
      I,
      `/series/${seriesId}/proposal/submit`,
      "POST",
    );
    assert.equal(submitted.status, 200);

    await signInAsAdmin(I);
    const response = await sendVoteRequest(I, seriesId, {
      vote: "Approve",
      comment: "Statement coverage vote",
    });
    assert.equal(response.status, 201);
    assert.equal(response.body.vote.vote, "Approve");

    const current = await sendApiRequestWithAuth(
      I,
      `/series/${seriesId}`,
      "GET",
    );
    assert.equal(current.body.proposal.status, "Under Review");
  },
);

// ---------------------------------------------------------------------------
// EBV-ST-02: Thiếu trường vote → 400
// Phủ dòng: dòng 14-16 if (!vote) return res.status(400)
// ---------------------------------------------------------------------------
Scenario("EBV-ST-02: Thiếu trường vote trả về 400", async ({ I }) => {
  await signInAs(I, "mangaka");
  const { seriesId } = await createSubmittedSeries(I);

  await signInAsAdmin(I);
  const response = await sendVoteRequest(I, seriesId, {});
  assert.equal(response.status, 400);
  assert.equal(response.body.message, "vote là bắt buộc");
});

// ---------------------------------------------------------------------------
// EBV-ST-03: vote không thuộc INITIAL_VOTES → 400
// Phủ dòng: dòng 18-22 if (!INITIAL_VOTES.includes(vote)) return res.status(400)
// ---------------------------------------------------------------------------
Scenario(
  "EBV-ST-03: Giá trị vote ngoài danh sách hợp lệ trả về 400",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSubmittedSeries(I);

    await signInAsAdmin(I);
    const response = await sendVoteRequest(I, seriesId, {
      vote: "InvalidChoice",
    });
    assert.equal(response.status, 400);
    assert.ok(response.body.message.includes("vote phải là:"));
  },
);

// ---------------------------------------------------------------------------
// EBV-ST-04: Series không tồn tại → 404
// Phủ dòng: dòng 24-27 if (!series) return res.status(404)
// ---------------------------------------------------------------------------
Scenario("EBV-ST-04: Không tìm thấy series trả về 404", async ({ I }) => {
  await signInAsAdmin(I);
  const response = await sendVoteRequest(I, "000000000000000000000000", {
    vote: "Approve",
  });
  assert.equal(response.status, 404);
  assert.equal(response.body.message, "Không tìm thấy series");
});

// ---------------------------------------------------------------------------
// EBV-ST-05: Series chưa có proposal để bỏ phiếu → 400
// Phủ dòng: dòng 29-37 if (!proposal) return res.status(400)
// ---------------------------------------------------------------------------
Scenario("EBV-ST-05: Series chưa có proposal trả về 400", async ({ I }) => {
  await signInAs(I, "mangaka");
  const createRes = await createSeriesViaApi(I);
  assert.equal(createRes.status, 201);
  const seriesId = createRes.body.series._id;

  await signInAsAdmin(I);
  const response = await sendVoteRequest(I, seriesId, {
    vote: "Approve",
  });
  assert.equal(response.status, 400);
  assert.equal(response.body.message, "Series chưa có proposal để bỏ phiếu");
});

// ---------------------------------------------------------------------------
// EBV-ST-06: Proposal đang ở trạng thái Draft → 400
// Phủ dòng: dòng 39-43 if (proposal.status === "Draft") return res.status(400)
// ---------------------------------------------------------------------------
Scenario("EBV-ST-06: Proposal ở trạng thái Draft trả về 400", async ({ I }) => {
  await signInAs(I, "mangaka");
  const { seriesId } = await createSeriesDraft(I);

  await signInAsAdmin(I);
  const response = await sendVoteRequest(I, seriesId, {
    vote: "Approve",
  });
  assert.equal(response.status, 400);
  assert.equal(response.body.message, "Proposal không có trạng thái hợp lệ");
});

// ---------------------------------------------------------------------------
// EBV-ST-07: Proposal không ở trạng thái chờ duyệt (đã finalize) → 400
// Phủ dòng: dòng 45-49 if (!VOTABLE_PROPOSAL_STATUSES.includes(proposal.status))
// ---------------------------------------------------------------------------
Scenario(
  "EBV-ST-07: Proposal đã finalize (Approved) không thể bỏ phiếu trả về 400",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSubmittedSeries(I);

    await openBoardReview(I, seriesId);
    await signInAsAdmin(I);
    await sendVoteRequest(I, seriesId, { vote: "Approve" });

    const finalizeRes = await sendApiRequestWithAuth(
      I,
      `/board/series/${seriesId}/finalize`,
      "POST",
      {},
    );
    assert.equal(finalizeRes.status, 200);

    const response = await sendVoteRequest(I, seriesId, {
      vote: "Reject",
    });
    assert.equal(response.status, 400);
    assert.equal(response.body.message, "Series không ở trạng thái chờ duyệt");
  },
);

// ---------------------------------------------------------------------------
// EBV-ST-08: Thành viên đã có phiếu bầu, bỏ phiếu lại cập nhật phiếu → 200
// Phủ dòng: dòng 51-65 if (existingVote) { ... return res.status(200)... }
// ---------------------------------------------------------------------------
Scenario(
  "EBV-ST-08: Thành viên đã có phiếu bầu gửi lại vote cập nhật phiếu trả về 200",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSubmittedSeries(I);

    await signInAsAdmin(I);
    const firstVote = await sendVoteRequest(I, seriesId, {
      vote: "Approve",
      comment: "First comment",
    });
    assert.equal(firstVote.status, 201);

    const updateVote = await sendVoteRequest(I, seriesId, {
      vote: "Need Revision",
      comment: "Updated comment",
    });
    assert.equal(updateVote.status, 200);
    assert.equal(updateVote.body.message, "Cập nhật phiếu bầu thành công");
    assert.equal(updateVote.body.vote.vote, "Need Revision");
    assert.equal(updateVote.body.vote.comment, "Updated comment");
  },
);

// ---------------------------------------------------------------------------
// EBV-ST-09: Lỗi CastError từ DB (id sai định dạng ObjectId) rơi vào catch → 500
// Phủ dòng: dòng 84-86 catch (err) { return res.status(500)... }
// ---------------------------------------------------------------------------
Scenario(
  "EBV-ST-09: Lỗi CastError khi id sai định dạng ObjectId rơi vào catch trả về 500",
  async ({ I }) => {
    await signInAsAdmin(I);
    const response = await sendVoteRequest(I, "invalid-object-id", {
      vote: "Approve",
    });
    assert.equal(response.status, 500);
    assert.equal(response.body.error, "Lỗi server");
  },
);
