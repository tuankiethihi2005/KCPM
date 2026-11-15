import assert from "node:assert/strict";
import {
  createSeriesDraft,
  createSubmittedSeries,
  refreshAccessToken,
  sendApiRequestWithAuth,
  signInAs,
} from "../../series_test_helpers.js";
import { createSeriesViaApi, signInAsAdmin } from "../coverage_helpers.js";

Feature("White-Box Statement Coverage — submitProposal (100% Statements)");

// ---------------------------------------------------------------------------
// SP-ST-01: Gửi đồng thời 2 request submit → 1 thành công (200), 1 xung đột (409)
// ---------------------------------------------------------------------------
Scenario(
  "SP-ST-01: Gửi đồng thời hai request submit trả về 200 và 409",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSeriesDraft(I);
    const accessToken = await refreshAccessToken(I);
    const responses = await I.executeScript(
      async ({ seriesId: id, token }) => {
        const submit = () =>
          fetch(`http://localhost:5000/api/series/${id}/proposal/submit`, {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({}),
          }).then((response) => response.status);
        return Promise.all([submit(), submit()]);
      },
      { seriesId, token: accessToken },
    );

    assert.deepEqual([...responses].sort(), [200, 409]);
    const current = await sendApiRequestWithAuth(
      I,
      `/series/${seriesId}`,
      "GET",
    );
    assert.equal(current.body.proposal.status, "Submitted");
  },
);

// ---------------------------------------------------------------------------
// SP-ST-02: Series đã bị hủy (status = "Cancelled") → 400
// ---------------------------------------------------------------------------
Scenario(
  "SP-ST-02: Series ở trạng thái Cancelled không thể nộp trả về 400",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSeriesDraft(I);

    await signInAsAdmin(I);
    await sendApiRequestWithAuth(I, `/series/${seriesId}/status`, "PATCH", {
      status: "Cancelled",
    });

    await signInAs(I, "mangaka");
    const response = await sendApiRequestWithAuth(
      I,
      `/series/${seriesId}/proposal/submit`,
      "POST",
    );
    assert.equal(response.status, 400);
    assert.equal(
      response.body.message,
      "Series đã bị hủy, không thể nộp proposal",
    );
  },
);

// ---------------------------------------------------------------------------
// SP-ST-03: Proposal đang trong quá trình xét duyệt (Submitted) → 400
// ---------------------------------------------------------------------------
Scenario(
  "SP-ST-03: Proposal không thuộc SUBMITTABLE_STATUSES trả về 400",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSubmittedSeries(I);

    const response = await sendApiRequestWithAuth(
      I,
      `/series/${seriesId}/proposal/submit`,
      "POST",
    );
    assert.equal(response.status, 400);
    assert.ok(response.body.message.includes("Không thể nộp proposal"));
  },
);

// ---------------------------------------------------------------------------
// SP-ST-04: Thiếu các trường bắt buộc (genre, target_audience, summary) → 400
// ---------------------------------------------------------------------------
Scenario(
  "SP-ST-04: Thiếu trường bắt buộc trả về 400 kèm mảng missingFields",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const createRes = await createSeriesViaApi(I);
    assert.equal(createRes.status, 201);
    const seriesId = createRes.body.series._id;

    const response = await sendApiRequestWithAuth(
      I,
      `/series/${seriesId}/proposal/submit`,
      "POST",
    );
    assert.equal(response.status, 400);
    assert.deepEqual(response.body.missingFields, [
      "genre",
      "target_audience",
      "summary",
    ]);
  },
);

// ---------------------------------------------------------------------------
// SP-ST-05: Nộp proposal hoàn chỉnh thành công (gửi thông báo Editorial Board) → 200
// ---------------------------------------------------------------------------
Scenario(
  "SP-ST-05: Nộp proposal hoàn chỉnh thành công trả về 200",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSeriesDraft(I);

    const response = await sendApiRequestWithAuth(
      I,
      `/series/${seriesId}/proposal/submit`,
      "POST",
    );
    assert.equal(response.status, 200);
    assert.equal(response.body.message, "Nộp hồ sơ xét duyệt thành công");
    assert.equal(response.body.proposal.status, "Submitted");
  },
);

// ---------------------------------------------------------------------------
// SP-ST-06: Nộp thành công khi không có Editorial Board Active (fallback Admin/Editor) → 200
// ---------------------------------------------------------------------------
Scenario(
  "SP-ST-06: Nộp thành công khi không có Editorial Board kích hoạt fallback thông báo",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSeriesDraft(I);
    const token = await refreshAccessToken(I);

    const response = await I.executeScript(
      async ({ id, accessToken }) => {
        const res = await fetch(
          `http://localhost:5000/api/series/${id}/proposal/submit`,
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
              "x-force-empty-board": "1",
            },
            body: JSON.stringify({}),
          },
        );
        return { status: res.status, body: await res.json() };
      },
      { id: seriesId, accessToken: token },
    );

    assert.equal(response.status, 200);
    assert.equal(response.body.message, "Nộp hồ sơ xét duyệt thành công");
  },
);

// ---------------------------------------------------------------------------
// SP-ST-07: Lỗi runtime trong khối try rơi vào catch trả về 500
// ---------------------------------------------------------------------------
Scenario(
  "SP-ST-07: Lỗi runtime trong khối try rơi vào catch trả về 500",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSeriesDraft(I);
    const token = await refreshAccessToken(I);

    const response = await I.executeScript(
      async ({ id, accessToken }) => {
        const res = await fetch(
          `http://localhost:5000/api/series/${id}/proposal/submit`,
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
              "x-force-error": "1",
            },
            body: JSON.stringify({}),
          },
        );
        return { status: res.status, body: await res.json() };
      },
      { id: seriesId, accessToken: token },
    );

    assert.equal(response.status, 500);
    assert.equal(response.body.error, "Lỗi server");
  },
);
