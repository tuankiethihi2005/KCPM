import assert from "node:assert/strict";
import {
  createSeriesDraft,
  createSubmittedSeries,
  sendApiRequestWithAuth,
  signInAs,
} from "../../series_test_helpers.js";

Feature("Branch coverage — update series");

Scenario(
  "US-BC-01: omitted optional fields are preserved and empty fields are cleared",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSeriesDraft(I, {
      description: "Description to preserve",
      genre: "Fantasy",
      targetAudience: "Young adult",
    });
    const omitted = await sendApiRequestWithAuth(
      I,
      `/series/${seriesId}`,
      "PUT",
      {},
    );
    assert.equal(omitted.status, 200);
    assert.equal(omitted.body.series.description, "Description to preserve");
    assert.equal(omitted.body.series.genre, "Fantasy");

    const cleared = await sendApiRequestWithAuth(
      I,
      `/series/${seriesId}`,
      "PUT",
      { description: "", genre: "", target_audience: "" },
    );
    assert.equal(cleared.status, 200);
    assert.equal(cleared.body.series.description || "", "");
    assert.equal(cleared.body.series.genre || "", "");
    assert.equal(cleared.body.series.target_audience || "", "");
  },
);

Scenario(
  "US-BC-02: editor_id omitted, null, empty, and valid ID take their expected branches",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const editors = await sendApiRequestWithAuth(I, "/series/editors", "GET");
    assert.ok(
      editors.body.editors.length > 0,
      "A seeded Tantou Editor is required",
    );
    const editorId = editors.body.editors[0]._id;
    const { seriesId } = await createSeriesDraft(I);
    const assign = await sendApiRequestWithAuth(
      I,
      `/series/${seriesId}`,
      "PUT",
      { editor_id: editorId },
    );
    assert.equal(assign.status, 200);

    const omitted = await sendApiRequestWithAuth(
      I,
      `/series/${seriesId}`,
      "PUT",
      {},
    );
    assert.equal(String(omitted.body.series.editor_id), String(editorId));
    for (const value of [null, ""]) {
      const unassign = await sendApiRequestWithAuth(
        I,
        `/series/${seriesId}`,
        "PUT",
        { editor_id: value },
      );
      assert.equal(unassign.status, 200);
      assert.equal(unassign.body.series.editor_id, null);
    }
    const reassigned = await sendApiRequestWithAuth(
      I,
      `/series/${seriesId}`,
      "PUT",
      { editor_id: editorId },
    );
    assert.equal(reassigned.status, 200);
    assert.equal(String(reassigned.body.series.editor_id), String(editorId));
  },
);

Scenario(
  "US-BC-03: optional descriptions, genres, and audiences take empty and non-empty branches",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSeriesDraft(I);
    for (const [field, validValue] of [
      ["description", "A sufficiently long description"],
      ["genre", "Fantasy"],
      ["target_audience", "Young adult"],
    ]) {
      const empty = await sendApiRequestWithAuth(
        I,
        `/series/${seriesId}`,
        "PUT",
        { [field]: "" },
      );
      assert.equal(empty.status, 200);
      assert.equal(empty.body.series[field] || "", "");
      const nonEmpty = await sendApiRequestWithAuth(
        I,
        `/series/${seriesId}`,
        "PUT",
        { [field]: validValue },
      );
      assert.equal(nonEmpty.status, 200);
      assert.equal(nonEmpty.body.series[field], validValue);
    }
  },
);

// ---------------------------------------------------------------------------
// US-BC-04: Nhánh proposal đang ở trạng thái chờ duyệt (Pending) là true/false
// ---------------------------------------------------------------------------
Scenario(
  "US-BC-04: branch pending proposal status is true and false",
  async ({ I }) => {
    await signInAs(I, "mangaka");

    // true: series đã nộp hồ sơ (Submitted)
    const submitted = await createSubmittedSeries(I);
    const resTrue = await sendApiRequestWithAuth(
      I,
      `/series/${submitted.seriesId}`,
      "PUT",
      { title: "Any Title" },
    );
    assert.equal(resTrue.status, 409);

    // false: series ở trạng thái Draft
    const draft = await createSeriesDraft(I);
    const resFalse = await sendApiRequestWithAuth(
      I,
      `/series/${draft.seriesId}`,
      "PUT",
      { title: `Valid Title ${Date.now()}` },
    );
    assert.equal(resFalse.status, 200);
  },
);

// ---------------------------------------------------------------------------
// US-BC-05: Nhánh validation title (rỗng, ngắn hơn 2, markup, trùng tên)
// ---------------------------------------------------------------------------
Scenario("US-BC-05: branch title validation checks", async ({ I }) => {
  await signInAs(I, "mangaka");
  const { seriesId } = await createSeriesDraft(I);

  // rỗng
  const emptyRes = await sendApiRequestWithAuth(
    I,
    `/series/${seriesId}`,
    "PUT",
    { title: "   " },
  );
  assert.equal(emptyRes.status, 400);

  // < 2 ký tự
  const shortRes = await sendApiRequestWithAuth(
    I,
    `/series/${seriesId}`,
    "PUT",
    { title: "X" },
  );
  assert.equal(shortRes.status, 400);

  // markup
  const markupRes = await sendApiRequestWithAuth(
    I,
    `/series/${seriesId}`,
    "PUT",
    { title: "<b>X</b>" },
  );
  assert.equal(markupRes.status, 400);
});

// ---------------------------------------------------------------------------
// US-BC-06: Nhánh validation editor_id format
// ---------------------------------------------------------------------------
Scenario("US-BC-06: branch editor_id invalid format", async ({ I }) => {
  await signInAs(I, "mangaka");
  const { seriesId } = await createSeriesDraft(I);

  const invalidRes = await sendApiRequestWithAuth(
    I,
    `/series/${seriesId}`,
    "PUT",
    { editor_id: "not_a_valid_id" },
  );
  assert.equal(invalidRes.status, 400);
  assert.ok(invalidRes.body.message.includes("không đúng định dạng"));
});
