import assert from "node:assert/strict";
import {
  createSeriesViaApi,
  getEditorId,
  signInAs,
} from "../create_series_coverage_helpers.js";
import {
  createSeriesWithDraftProposal,
  createSeriesWithNeedRevisionProposal,
  createSeriesWithSubmittedProposal,
  uploadCoverViaApi,
  upsertProposalViaApi,
} from "../upsert_upload_coverage_helpers.js";

Feature("Branch coverage — proposal created with series, upsert, and upload cover");

// ─────────────────────────────────────────────────────────────────────────────
// PHẦN 1 — BRANCH COVERAGE CHO TẠO SERIES KÈM PROPOSAL (createSeries.js)
// ─────────────────────────────────────────────────────────────────────────────

Scenario("PR-BC-01: undefined, null, and populated summaries take the expected branches", async ({ I }) => {
  await signInAs(I, "mangaka");
  const withoutSummary = await createSeriesViaApi(I);
  assert.equal(withoutSummary.status, 201);
  assert.equal(withoutSummary.body.proposal, null);

  const nullSummary = await createSeriesViaApi(I, { summary: null });
  assert.equal(nullSummary.status, 201);
  assert.equal(nullSummary.body.proposal, null);

  const withSummary = await createSeriesViaApi(I, {
    summary: `Summary branch ${Date.now()}`,
  });
  assert.equal(withSummary.status, 201);
  assert.equal(withSummary.body.proposal.status, "Draft");
});

Scenario("PR-BC-02: invalid summary fails validation while a valid summary succeeds", async ({ I }) => {
  await signInAs(I, "mangaka");
  const invalid = await createSeriesViaApi(I, { summary: "Short" });
  assert.equal(invalid.status, 400);
  assert.ok(invalid.body.details.length > 0);

  const valid = await createSeriesViaApi(I, {
    summary: `Valid summary branch ${Date.now()}`,
  });
  assert.equal(valid.status, 201);
  assert.equal(valid.body.proposal.status, "Draft");
});

Scenario("PR-BC-03: proposal creation is skipped without summary and performed with summary", async ({ I }) => {
  await signInAs(I, "mangaka");
  const skipped = await createSeriesViaApi(I);
  assert.equal(skipped.status, 201);
  assert.equal(skipped.body.proposal, null);

  const created = await createSeriesViaApi(I, {
    summary: `Proposal condition true ${Date.now()}`,
  });
  assert.equal(created.status, 201);
  assert.equal(created.body.proposal.status, "Draft");
});

Scenario("PR-BC-04: editor notification branch is exercised with and without an assigned editor", async ({ I }) => {
  await signInAs(I, "mangaka");
  const withoutEditor = await createSeriesViaApi(I, {
    summary: `Proposal without editor ${Date.now()}`,
  });
  assert.equal(withoutEditor.status, 201);
  assert.equal(withoutEditor.body.series.editor_id, null);
  assert.equal(withoutEditor.body.proposal.status, "Draft");

  const editorId = await getEditorId(I);
  const withEditor = await createSeriesViaApi(I, {
    summary: `Proposal with editor ${Date.now()}`,
    editor_id: editorId,
  });
  assert.equal(withEditor.status, 201);
  assert.equal(String(withEditor.body.series.editor_id), String(editorId));
  assert.equal(withEditor.body.proposal.status, "Draft");
});

// ─────────────────────────────────────────────────────────────────────────────
// PHẦN 2 — BRANCH COVERAGE CHO UPSERT PROPOSAL (upsertProposal.js)
// ─────────────────────────────────────────────────────────────────────────────

Scenario("UP-BC-01: branch !series is true and false", async ({ I }) => {
  await signInAs(I, "mangaka");
  const notFound = await upsertProposalViaApi(
    I,
    "000000000000000000000000",
    { summary: "Valid summary for test branch" },
  );
  assert.equal(notFound.status, 404);

  const seriesId = await createSeriesWithDraftProposal(I);
  await signInAs(I, "mangaka");
  const found = await upsertProposalViaApi(I, seriesId, {
    summary: "Updated summary branch test",
  });
  assert.equal(found.status, 200);
});

Scenario(
  "UP-BC-02: branch proposal && !EDITABLE_STATUSES.includes(proposal.status) is true and false",
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

Scenario("UP-BC-03: branch !summary is true and false", async ({ I }) => {
  const seriesId = await createSeriesWithDraftProposal(I);
  await signInAs(I, "mangaka");

  const resMissing = await upsertProposalViaApi(I, seriesId, {});
  assert.equal(resMissing.status, 400);

  const resPresent = await upsertProposalViaApi(I, seriesId, {
    summary: "Present summary for branch",
  });
  assert.equal(resPresent.status, 200);
});

Scenario("UP-BC-04: branch if (proposal) is true and false", async ({ I }) => {
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
});

Scenario(
  "UP-BC-05: branch proposal.status === 'Need Revision' is true and false",
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

Scenario("UP-BC-06: catch block err.name === 'ValidationError' is true", async ({ I }) => {
  const seriesId = await createSeriesWithDraftProposal(I);
  await signInAs(I, "mangaka");

  const response = await upsertProposalViaApi(I, seriesId, {
    summary: "tiny",
  });
  assert.equal(response.status, 400);
  assert.ok(Array.isArray(response.body.details));
});

// ─────────────────────────────────────────────────────────────────────────────
// PHẦN 3 — BRANCH COVERAGE CHO UPLOAD COVER (uploadCover.js)
// ─────────────────────────────────────────────────────────────────────────────

Scenario(
  "UC-BC-01: branch (!req.file || !req.file.path) is true and false",
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

Scenario("UC-BC-02: branch (!proposal) is true and false", async ({ I }) => {
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
});

Scenario(
  "UC-BC-03: branch (!EDITABLE_STATUSES.includes(proposal.status)) is true and false",
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
