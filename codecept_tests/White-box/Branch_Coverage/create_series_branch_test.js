import assert from "node:assert/strict";
import {
  createSeriesViaApi,
  getEditorId,
  getNonEditorUserId,
  signInAs,
  uniqueSeriesPayload,
} from "../create_series_coverage_helpers.js";

Feature("Branch coverage — create series");

Scenario("CS-BC-01: missing and present titles take the expected branches", async ({ I }) => {
  await signInAs(I, "mangaka");
  const missing = await createSeriesViaApi(I, { title: undefined });
  assert.equal(missing.status, 400);

  const valid = await createSeriesViaApi(I);
  assert.equal(valid.status, 201);
});

Scenario("CS-BC-02: title markup is rejected while a plain title is accepted", async ({ I }) => {
  await signInAs(I, "mangaka");
  const rejected = await createSeriesViaApi(I, { title: `Markup <title> ${Date.now()}` });
  assert.equal(rejected.status, 400);

  const accepted = await createSeriesViaApi(I);
  assert.equal(accepted.status, 201);
});

Scenario("CS-BC-03: duplicate and unique titles take opposite branches", async ({ I }) => {
  await signInAs(I, "mangaka");
  const payload = uniqueSeriesPayload();
  assert.equal((await createSeriesViaApi(I, payload)).status, 201);
  assert.equal(
    (await createSeriesViaApi(I, { title: payload.title })).status,
    400,
  );
  assert.equal((await createSeriesViaApi(I)).status, 201);
});

Scenario("CS-BC-04: omitting editor_id bypasses lookup and a valid ID is assigned", async ({ I }) => {
  await signInAs(I, "mangaka");
  const withoutEditor = await createSeriesViaApi(I);
  assert.equal(withoutEditor.status, 201);
  assert.equal(withoutEditor.body.series.editor_id, null);

  const editorId = await getEditorId(I);
  const withEditor = await createSeriesViaApi(I, { editor_id: editorId });
  assert.equal(withEditor.status, 201);
  assert.equal(String(withEditor.body.series.editor_id), String(editorId));
});

Scenario("CS-BC-05: each editor ID validation branch is exercised", async ({ I }) => {
  await signInAs(I, "mangaka");
  const nonEditorId = await getNonEditorUserId(I);
  const invalidIds = [
    "not-an-object-id",
    "000000000000000000000000",
    nonEditorId,
  ];
  for (const editorId of invalidIds) {
    assert.equal(
      (await createSeriesViaApi(I, { editor_id: editorId })).status,
      400,
    );
  }

  const editorId = await getEditorId(I);
  const valid = await createSeriesViaApi(I, { editor_id: editorId });
  assert.equal(valid.status, 201);
  assert.equal(String(valid.body.series.editor_id), String(editorId));
});

Scenario("CS-BC-06: optional text fields can be omitted, whitespace, or populated", async ({ I }) => {
  await signInAs(I, "mangaka");
  const omitted = await createSeriesViaApi(I);
  assert.equal(omitted.status, 201);
  assert.equal(omitted.body.series.description, undefined);

  const whitespace = await createSeriesViaApi(I, {
    description: "   ",
    genre: "   ",
    target_audience: "   ",
  });
  assert.equal(whitespace.status, 201);
  assert.equal(whitespace.body.series.genre, undefined);

  const populated = await createSeriesViaApi(I, {
    description: "A sufficiently long description",
    genre: "Fantasy",
    target_audience: "Young adult",
  });
  assert.equal(populated.status, 201);
  assert.equal(populated.body.series.genre, "Fantasy");
});

Scenario("CS-BC-07: non-string numeric titles are currently cast and accepted", async ({ I }) => {
  await signInAs(I, "mangaka");
  const numericTitle = Date.now();
  const response = await createSeriesViaApi(I, { title: numericTitle });

  assert.equal(response.status, 201);
  assert.equal(response.body.series.title, String(numericTitle));
});
