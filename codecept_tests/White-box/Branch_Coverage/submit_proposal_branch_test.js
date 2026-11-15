import assert from "node:assert/strict";
import {
  createSeries,
  createSeriesDraft,
  createSubmittedSeries,
  refreshAccessToken,
  sendApiRequestWithAuth,
  signInAs,
} from "../../series_test_helpers.js";
import { signInAsAdmin } from "../coverage_helpers.js";

Feature("Branch coverage — submit proposal");

Scenario("SP-BC-01: a valid draft is atomically submitted", async ({ I }) => {
  await signInAs(I, "mangaka");
  const { seriesId } = await createSeriesDraft(I);
  const response = await sendApiRequestWithAuth(
    I,
    `/series/${seriesId}/proposal/submit`,
    "POST",
  );

  assert.equal(response.status, 200);
  assert.equal(response.body.proposal.status, "Submitted");
});

Scenario(
  "SP-BC-02: racing submit requests yield one success and one conflict",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSeriesDraft(I);
    const token = await refreshAccessToken(I);
    const statuses = await I.executeScript(
      async ({ id, accessToken }) => {
        const request = () =>
          fetch(`http://localhost:5000/api/series/${id}/proposal/submit`, {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: "{}",
          }).then((response) => response.status);
        return Promise.all([request(), request()]);
      },
      { id: seriesId, accessToken: token },
    );

    assert.deepEqual([...statuses].sort(), [200, 409]);
  },
);

Scenario(
  "SP-BC-03: missing required fields fail while complete data proceeds",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const incomplete = await createSeries(I);
    const rejected = await sendApiRequestWithAuth(
      I,
      `/series/${incomplete.seriesId}/proposal/submit`,
      "POST",
    );
    assert.equal(rejected.status, 400);
    assert.ok(rejected.body.missingFields.length > 0);

    const complete = await createSeriesDraft(I);
    const accepted = await sendApiRequestWithAuth(
      I,
      `/series/${complete.seriesId}/proposal/submit`,
      "POST",
    );
    assert.equal(accepted.status, 200);
    assert.equal(accepted.body.proposal.status, "Submitted");
  },
);

// ---------------------------------------------------------------------------
// SP-BC-04: Nhánh series.status === 'Cancelled' là true và false
// ---------------------------------------------------------------------------
Scenario(
  "SP-BC-04: branch series.status === 'Cancelled' is true and false",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSeriesDraft(I);

    // true: Đổi sang Cancelled
    await signInAsAdmin(I);
    await sendApiRequestWithAuth(I, `/series/${seriesId}/status`, "PATCH", {
      status: "Cancelled",
    });

    await signInAs(I, "mangaka");
    const cancelledRes = await sendApiRequestWithAuth(
      I,
      `/series/${seriesId}/proposal/submit`,
      "POST",
    );
    assert.equal(cancelledRes.status, 400);
    assert.ok(cancelledRes.body.message.includes("Series đã bị hủy"));

    // false: Series Draft bình thường
    const normal = await createSeriesDraft(I);
    const normalRes = await sendApiRequestWithAuth(
      I,
      `/series/${normal.seriesId}/proposal/submit`,
      "POST",
    );
    assert.equal(normalRes.status, 200);
  },
);

// ---------------------------------------------------------------------------
// SP-BC-05: Nhánh proposalToSubmit && !SUBMITTABLE_STATUSES.includes(status) là true và false
// ---------------------------------------------------------------------------
Scenario(
  "SP-BC-05: branch proposalToSubmit not in submittable statuses is true and false",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSubmittedSeries(I);

    // true: proposal đang ở Submitted
    const resTrue = await sendApiRequestWithAuth(
      I,
      `/series/${seriesId}/proposal/submit`,
      "POST",
    );
    assert.equal(resTrue.status, 400);

    // false: proposal ở Draft
    const draftSeries = await createSeriesDraft(I);
    const resFalse = await sendApiRequestWithAuth(
      I,
      `/series/${draftSeries.seriesId}/proposal/submit`,
      "POST",
    );
    assert.equal(resFalse.status, 200);
  },
);
