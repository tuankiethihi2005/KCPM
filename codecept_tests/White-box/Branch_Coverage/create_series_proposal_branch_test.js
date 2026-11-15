import assert from "node:assert/strict";
import { refreshAccessToken } from "../../series_test_helpers.js";
import {
  createSeriesViaApi,
  signInAs,
  createSeriesWithDraftProposal,
  createSeriesWithNeedRevisionProposal,
  createSeriesWithSubmittedProposal,
  uploadCoverViaApi,
  upsertProposalViaApi,
} from "../coverage_helpers.js";

Feature(
  "White-Box Branch Coverage — Tạo Proposal kèm Series, lưu/cập nhật Proposal và upload ảnh bìa",
);

// ─────────────────────────────────────────────────────────────────────────────
// BRANCH COVERAGE CHO UPSERT PROPOSAL (upsertProposal.js)
// ─────────────────────────────────────────────────────────────────────────────

Scenario(
  "UP-BC-01: Nhánh kiểm tra !series là true (404) và false (200)",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const notFound = await upsertProposalViaApi(I, "000000000000000000000000", {
      summary: "Valid summary for test branch",
    });
    assert.equal(notFound.status, 404);

    const seriesId = await createSeriesWithDraftProposal(I);
    await signInAs(I, "mangaka");
    const found = await upsertProposalViaApi(I, seriesId, {
      summary: "Updated summary branch test",
    });
    assert.equal(found.status, 200);
  },
);

Scenario(
  "UP-BC-02: Nhánh proposal && !EDITABLE_STATUSES.includes(proposal.status) là true và false",
  async ({ I }) => {
    const submittedId = await createSeriesWithSubmittedProposal(I);
    await signInAs(I, "mangaka");
    const resSubmitted = await upsertProposalViaApi(I, submittedId, {
      summary: "Attempting to edit submitted proposal",
    });
    assert.equal(resSubmitted.status, 400);

    const draftId = await createSeriesWithDraftProposal(I);
    await signInAs(I, "mangaka");
    const resDraft = await upsertProposalViaApi(I, draftId, {
      summary: "Editing draft proposal branch",
    });
    assert.equal(resDraft.status, 200);
  },
);

Scenario(
  "UP-BC-03: Nhánh !summary là true (400) và false (200)",
  async ({ I }) => {
    const seriesId = await createSeriesWithDraftProposal(I);
    await signInAs(I, "mangaka");

    const resMissing = await upsertProposalViaApi(I, seriesId, {});
    assert.equal(resMissing.status, 400);

    const resPresent = await upsertProposalViaApi(I, seriesId, {
      summary: "Present summary for branch",
    });
    assert.equal(resPresent.status, 200);
  },
);

Scenario(
  "UP-BC-04: Nhánh if (proposal) là true (cập nhật) và false (tạo mới)",
  async ({ I }) => {
    const existingPropSeriesId = await createSeriesWithDraftProposal(I);
    await signInAs(I, "mangaka");
    const resTrue = await upsertProposalViaApi(I, existingPropSeriesId, {
      summary: "Updating existing proposal",
    });
    assert.equal(resTrue.status, 200);

    const createRes = await createSeriesViaApi(I);
    const noPropSeriesId = createRes.body.series._id;
    const resFalse = await upsertProposalViaApi(I, noPropSeriesId, {
      summary: "Creating new proposal for series",
    });
    assert.equal(resFalse.status, 200);
  },
);

Scenario(
  "UP-BC-05: Nhánh proposal.status === 'Need Revision' là true và false",
  async ({ I }) => {
    const needRevisionId = await createSeriesWithNeedRevisionProposal(I);
    const resNeedRev = await upsertProposalViaApi(I, needRevisionId, {
      summary: "Revised summary from need revision",
    });
    assert.equal(resNeedRev.status, 200);
    assert.equal(resNeedRev.body.proposal.status, "Draft");

    const draftId = await createSeriesWithDraftProposal(I);
    await signInAs(I, "mangaka");
    const resDraft = await upsertProposalViaApi(I, draftId, {
      summary: "Summary from draft status",
    });
    assert.equal(resDraft.status, 200);
    assert.equal(resDraft.body.proposal.status, "Draft");
  },
);

Scenario(
  "UP-BC-06: Khối catch với err.name === 'ValidationError' là true (400) và false (500)",
  async ({ I }) => {
    const seriesId = await createSeriesWithDraftProposal(I);
    await signInAs(I, "mangaka");

    // Nhánh true: ValidationError -> 400
    const validationRes = await upsertProposalViaApi(I, seriesId, {
      summary: "tiny",
    });
    assert.equal(validationRes.status, 400);
    assert.ok(Array.isArray(validationRes.body.details));

    // Nhánh false: Lỗi runtime khác (TypeError khi body không phải JSON) -> 500
    const token = await refreshAccessToken(I);
    const serverErrRes = await I.executeScript(
      async ({ id, accessToken }) => {
        const res = await fetch(
          `http://localhost:5000/api/series/${id}/proposal`,
          {
            method: "PUT",
            credentials: "include",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "text/plain",
            },
            body: "non-json-body",
          },
        );
        return { status: res.status, body: await res.json() };
      },
      { id: seriesId, accessToken: token },
    );

    assert.equal(serverErrRes.status, 500);
    assert.equal(serverErrRes.body.error, "Lỗi server");
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// BRANCH COVERAGE CHO UPLOAD COVER (uploadCover.js)
// ─────────────────────────────────────────────────────────────────────────────

Scenario(
  "UC-BC-01: Nhánh (!req.file || !req.file.path) là true (400) và false (200)",
  async ({ I }) => {
    const seriesId = await createSeriesWithDraftProposal(I);
    await signInAs(I, "mangaka");

    const resNoFile = await uploadCoverViaApi(I, seriesId, {
      attachFile: false,
    });
    assert.equal(resNoFile.status, 400);
    assert.equal(resNoFile.body.message, "Không có file cover được upload");

    const resWithFile = await uploadCoverViaApi(I, seriesId, {
      attachFile: true,
    });
    assert.equal(resWithFile.status, 200);
    assert.equal(resWithFile.body.message, "Upload cover thành công");
  },
);

Scenario(
  "UC-BC-02: Nhánh (!proposal) là true (400) và false (200)",
  async ({ I }) => {
    await signInAs(I, "mangaka");

    const createRes = await createSeriesViaApi(I);
    const seriesWithoutProposalId = createRes.body.series._id;

    const resNoProp = await uploadCoverViaApi(I, seriesWithoutProposalId, {
      attachFile: true,
    });
    assert.equal(resNoProp.status, 400);
    assert.equal(
      resNoProp.body.message,
      "Cần tạo proposal trước khi upload cover",
    );

    const seriesWithProposalId = await createSeriesWithDraftProposal(I);
    await signInAs(I, "mangaka");
    const resWithProp = await uploadCoverViaApi(I, seriesWithProposalId, {
      attachFile: true,
    });
    assert.equal(resWithProp.status, 200);
  },
);

Scenario(
  "UC-BC-03: Nhánh (!EDITABLE_STATUSES.includes(proposal.status)) là true (400) và false (200)",
  async ({ I }) => {
    const submittedSeriesId = await createSeriesWithSubmittedProposal(I);
    await signInAs(I, "mangaka");

    const resSubmitted = await uploadCoverViaApi(I, submittedSeriesId, {
      attachFile: true,
    });
    assert.equal(resSubmitted.status, 400);
    assert.ok(resSubmitted.body.message.includes("Submitted"));

    const draftSeriesId = await createSeriesWithDraftProposal(I);
    await signInAs(I, "mangaka");
    const resDraft = await uploadCoverViaApi(I, draftSeriesId, {
      attachFile: true,
    });
    assert.equal(resDraft.status, 200);

    const needRevisionSeriesId = await createSeriesWithNeedRevisionProposal(I);
    const resNeedRev = await uploadCoverViaApi(I, needRevisionSeriesId, {
      attachFile: true,
    });
    assert.equal(resNeedRev.status, 200);
  },
);
