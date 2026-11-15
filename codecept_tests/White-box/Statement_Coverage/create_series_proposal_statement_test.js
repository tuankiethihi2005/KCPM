import assert from "node:assert/strict";
import {
  createSeriesViaApi,
  createSeriesWithDraftProposal,
  createSeriesWithNeedRevisionProposal,
  createSeriesWithSubmittedProposal,
  signInAs,
  uploadCoverViaApi,
  upsertProposalViaApi,
} from "../coverage_helpers.js";

Feature(
  "White-Box Statement Coverage — Proposal (upsertProposal & uploadCover)",
);

// ─────────────────────────────────────────────────────────────────────────────
// PHẦN 1 — LƯU / CẬP NHẬT PROPOSAL (upsertProposal.js — 100% Statements)
// ─────────────────────────────────────────────────────────────────────────────

Scenario(
  "UP-ST-01: Series không tồn tại trả về 404 — upsertProposal.js dòng 11-14",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const response = await upsertProposalViaApi(I, "000000000000000000000000", {
      summary: "Valid proposal summary content",
    });

    assert.equal(response.status, 404);
    assert.equal(response.body.message, "Không tìm thấy series");
  },
);

Scenario(
  "UP-ST-02: Proposal đang ở trạng thái Submitted trả về 400 — upsertProposal.js dòng 21-25",
  async ({ I }) => {
    const seriesId = await createSeriesWithSubmittedProposal(I);
    await signInAs(I, "mangaka");

    const response = await upsertProposalViaApi(I, seriesId, {
      summary: "Updated proposal summary content",
    });

    assert.equal(response.status, 400);
    assert.ok(response.body.message.includes("Submitted"));
  },
);

Scenario(
  "UP-ST-03: Thiếu summary trả về 400 — upsertProposal.js dòng 27-29",
  async ({ I }) => {
    const seriesId = await createSeriesWithDraftProposal(I);
    await signInAs(I, "mangaka");

    const response = await upsertProposalViaApi(I, seriesId, { summary: "" });

    assert.equal(response.status, 400);
    assert.equal(response.body.message, "summary là bắt buộc");
  },
);

Scenario(
  "UP-ST-04: Cập nhật proposal Need Revision chuyển về Draft — upsertProposal.js dòng 31-38, 49",
  async ({ I }) => {
    const seriesId = await createSeriesWithNeedRevisionProposal(I);
    const updatedSummary = `Revised proposal summary ${Date.now()}`;

    const response = await upsertProposalViaApi(I, seriesId, {
      summary: updatedSummary,
      characters: "Updated character",
      art_style: "Digital",
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.message, "Lưu proposal thành công");
    assert.equal(response.body.proposal.status, "Draft");
    assert.equal(response.body.proposal.summary, updatedSummary);
  },
);

Scenario(
  "UP-ST-05: Tạo mới proposal cho Series chưa có proposal — upsertProposal.js dòng 39-47, 49",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const createRes = await createSeriesViaApi(I);
    assert.equal(createRes.status, 201);
    const seriesId = createRes.body.series._id;

    const newSummary = `Brand new proposal summary ${Date.now()}`;
    const response = await upsertProposalViaApi(I, seriesId, {
      summary: newSummary,
      characters: "Hero",
      art_style: "Manga",
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.message, "Lưu proposal thành công");
    assert.equal(response.body.proposal.status, "Draft");
    assert.equal(response.body.proposal.summary, newSummary);
  },
);

Scenario(
  "UP-ST-06: Lỗi ValidationError khi lưu proposal trả về 400 — upsertProposal.js dòng 51-56",
  async ({ I }) => {
    const seriesId = await createSeriesWithDraftProposal(I);
    await signInAs(I, "mangaka");

    const response = await upsertProposalViaApi(I, seriesId, {
      summary: "Too short",
    });

    assert.equal(response.status, 400);
    assert.equal(response.body.message, "Dữ liệu proposal không hợp lệ");
    assert.ok(Array.isArray(response.body.details));
  },
);

Scenario(
  "UP-ST-07: Lỗi CastError từ DB (id sai định dạng) rơi vào nhánh 500 — upsertProposal.js dòng 58",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const response = await upsertProposalViaApi(I, "invalid-object-id", {
      summary: "Valid proposal summary content",
    });

    assert.equal(response.status, 500);
    assert.equal(response.body.error, "Lỗi server");
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// PHẦN 2 — UPLOAD ẢNH BÌA PROPOSAL (uploadCover.js — 100% Statements)
// ─────────────────────────────────────────────────────────────────────────────

Scenario(
  "UC-ST-01: Không đính kèm file trả về 400 — uploadCover.js dòng 8-10",
  async ({ I }) => {
    const seriesId = await createSeriesWithDraftProposal(I);
    await signInAs(I, "mangaka");

    const response = await uploadCoverViaApi(I, seriesId, {
      attachFile: false,
    });

    assert.equal(response.status, 400);
    assert.equal(response.body.message, "Không có file cover được upload");
  },
);

Scenario(
  "UC-ST-02: Series chưa có proposal trả về 400 — uploadCover.js dòng 16-20",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const createRes = await createSeriesViaApi(I);
    assert.equal(createRes.status, 201);
    const seriesId = createRes.body.series._id;

    const response = await uploadCoverViaApi(I, seriesId, {
      attachFile: true,
    });

    assert.equal(response.status, 400);
    assert.equal(
      response.body.message,
      "Cần tạo proposal trước khi upload cover",
    );
  },
);

Scenario(
  "UC-ST-03: Proposal ở trạng thái Submitted trả về 400 — uploadCover.js dòng 22-26",
  async ({ I }) => {
    const seriesId = await createSeriesWithSubmittedProposal(I);
    await signInAs(I, "mangaka");

    const response = await uploadCoverViaApi(I, seriesId, {
      attachFile: true,
    });

    assert.equal(response.status, 400);
    assert.ok(response.body.message.includes("Submitted"));
  },
);

Scenario(
  "UC-ST-04: Upload file PNG hợp lệ cho proposal Draft trả về 200 — uploadCover.js dòng 28-35",
  async ({ I }) => {
    const seriesId = await createSeriesWithDraftProposal(I);
    await signInAs(I, "mangaka");

    const response = await uploadCoverViaApi(I, seriesId, {
      attachFile: true,
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.message, "Upload cover thành công");
    assert.ok(response.body.cover_image);
    assert.ok(response.body.proposal);
  },
);
