import assert from "node:assert/strict";
import {
  sendApiRequestWithAuth,
  signInAs,
} from "./series_test_helpers.js";

function createSeriesPayload(title, extra = {}) {
  return {
    title,
    genre: "Fantasy",
    target_audience: "Young adult",
    ...extra,
  };
}

Feature("Tạo Series — chuyển đổi trạng thái và bảng quyết định");

Scenario(
  "CS-SD-01 / R1: summary không có hoặc chỉ có khoảng trắng tạo Series Draft, không tạo Proposal",
  async ({ I }) => {
    await signInAs(I, "mangaka");

    for (const [index, extra] of [{}, { summary: "   " }].entries()) {
      const response = await sendApiRequestWithAuth(
        I,
        "/series",
        "POST",
        createSeriesPayload(`CS-SD-01 ${Date.now()} ${index}`, extra),
      );

      assert.equal(response.status, 201);
      assert.equal(response.body.series.status, "Draft");
      assert.equal(response.body.proposal, null);
    }
  },
);

Scenario(
  "CS-SD-02 / R2: summary hợp lệ tạo Series và Proposal cùng ở Draft",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const summary = "A valid proposal summary with enough characters.";
    const response = await sendApiRequestWithAuth(
      I,
      "/series",
      "POST",
      createSeriesPayload(`CS-SD-02 ${Date.now()}`, { summary }),
    );

    assert.equal(response.status, 201);
    assert.equal(response.body.series.status, "Draft");
    assert.equal(response.body.proposal.status, "Draft");
    assert.equal(response.body.proposal.summary, summary);
  },
);

Scenario(
  "CS-SD-03 / R3: validation thất bại từ chối tạo và không để lại Series một phần",
  async ({ I }) => {
    await signInAs(I, "mangaka");

    for (const [index, invalidFields] of [
      { summary: "too short" },
      { editor_id: "not-an-object-id" },
    ].entries()) {
      const title = `CS-SD-03 ${Date.now()} ${index}`;
      const rejected = await sendApiRequestWithAuth(
        I,
        "/series",
        "POST",
        createSeriesPayload(title, invalidFields),
      );
      assert.equal(rejected.status, 400);

      const retry = await sendApiRequestWithAuth(
        I,
        "/series",
        "POST",
        createSeriesPayload(title),
      );
      assert.equal(retry.status, 201);
      assert.equal(retry.body.series.status, "Draft");
      assert.equal(retry.body.proposal, null);
    }
  },
);
