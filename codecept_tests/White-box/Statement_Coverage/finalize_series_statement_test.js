import assert from "node:assert/strict";
import {
  castBoardVote,
  createSeriesDraft,
  createSubmittedSeries,
  openBoardReview,
  refreshAccessToken,
  sendApiRequestWithAuth,
  signInAs,
} from "../../series_test_helpers.js";
import { createSeriesViaApi, signInAsAdmin } from "../coverage_helpers.js";

Feature("White-Box Statement Coverage — finalizeSeries (100% Statements)");

// ---------------------------------------------------------------------------
// FS-ST-01: Quyết định Approve với approved_schedule rỗng → fallback weekly
// ---------------------------------------------------------------------------
Scenario(
  "FS-ST-01: Approve với approved_schedule rỗng đặt lịch mặc định weekly trả về 200",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSubmittedSeries(I);
    await openBoardReview(I, seriesId);
    await castBoardVote(I, "Approve");

    const response = await sendApiRequestWithAuth(
      I,
      `/board/series/${seriesId}/finalize`,
      "POST",
      { approved_schedule: "" },
    );
    assert.equal(response.status, 200);
    assert.equal(response.body.decision, "Approve");
    assert.equal(response.body.series.approved_schedule, "weekly");
    assert.equal(response.body.proposal.status, "Approved");
    assert.equal(response.body.series.status, "Active");
  },
);

// ---------------------------------------------------------------------------
// FS-ST-02: Quyết định Reject → Proposal Rejected, Series Draft
// ---------------------------------------------------------------------------
Scenario(
  "FS-ST-02: Quyết định Reject chuyển Proposal thành Rejected và Series về Draft",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSubmittedSeries(I);
    await openBoardReview(I, seriesId);
    await castBoardVote(I, "Reject");

    const response = await sendApiRequestWithAuth(
      I,
      `/board/series/${seriesId}/finalize`,
      "POST",
      {},
    );
    assert.equal(response.status, 200);
    assert.equal(response.body.decision, "Reject");
    assert.equal(response.body.proposal.status, "Rejected");
    assert.equal(response.body.series.status, "Draft");
  },
);

// ---------------------------------------------------------------------------
// FS-ST-03: Quyết định Need Revision → Proposal Need Revision
// ---------------------------------------------------------------------------
Scenario(
  "FS-ST-03: Quyết định Need Revision cập nhật Proposal sang Need Revision",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSubmittedSeries(I);
    await openBoardReview(I, seriesId);
    await castBoardVote(I, "Need Revision");

    const response = await sendApiRequestWithAuth(
      I,
      `/board/series/${seriesId}/finalize`,
      "POST",
      {},
    );
    assert.equal(response.status, 200);
    assert.equal(response.body.decision, "Need Revision");
    assert.equal(response.body.proposal.status, "Need Revision");
  },
);

// ---------------------------------------------------------------------------
// FS-ST-04: Chưa có phiếu bầu nào → Service ném lỗi 400
// ---------------------------------------------------------------------------
Scenario(
  "FS-ST-04: Chốt kết quả khi chưa có phiếu bầu trả về 400",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSubmittedSeries(I);
    await openBoardReview(I, seriesId);

    const response = await sendApiRequestWithAuth(
      I,
      `/board/series/${seriesId}/finalize`,
      "POST",
      {},
    );
    assert.equal(response.status, 400);
    assert.equal(response.body.message, "Chưa có phiếu bầu nào");
  },
);

// ---------------------------------------------------------------------------
// FS-ST-05: Series không tồn tại → Service ném lỗi 404
// ---------------------------------------------------------------------------
Scenario("FS-ST-05: Không tìm thấy series trả về 404", async ({ I }) => {
  await signInAsAdmin(I);
  const response = await sendApiRequestWithAuth(
    I,
    `/board/series/000000000000000000000000/finalize`,
    "POST",
    {},
  );
  assert.equal(response.status, 404);
  assert.equal(response.body.message, "Không tìm thấy series");
});

// ---------------------------------------------------------------------------
// FS-ST-06: approved_schedule không hợp lệ khi Approve → 400
// ---------------------------------------------------------------------------
Scenario(
  "FS-ST-06: approved_schedule không hợp lệ trả về 400",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSubmittedSeries(I);
    await openBoardReview(I, seriesId);
    await castBoardVote(I, "Approve");

    const response = await sendApiRequestWithAuth(
      I,
      `/board/series/${seriesId}/finalize`,
      "POST",
      { approved_schedule: "invalid_schedule_choice" },
    );
    assert.equal(response.status, 400);
    assert.ok(response.body.message.includes("Approve cần approved_schedule:"));
  },
);

// ---------------------------------------------------------------------------
// FS-ST-07: Series chưa có proposal nào → Service ném lỗi 404
// ---------------------------------------------------------------------------
Scenario("FS-ST-07: Series chưa có proposal trả về 404", async ({ I }) => {
  await signInAs(I, "mangaka");
  const createRes = await createSeriesViaApi(I);
  assert.equal(createRes.status, 201);
  const seriesId = createRes.body.series._id;

  await signInAsAdmin(I);
  const response = await sendApiRequestWithAuth(
    I,
    `/board/series/${seriesId}/finalize`,
    "POST",
    {},
  );
  assert.equal(response.status, 404);
  assert.equal(response.body.message, "Không tìm thấy proposal");
});

// ---------------------------------------------------------------------------
// FS-ST-08: Proposal không ở trạng thái chờ duyệt (Draft) → Service ném lỗi 400
// ---------------------------------------------------------------------------
Scenario(
  "FS-ST-08: Proposal chưa ở trạng thái chờ duyệt (Draft) trả về 400",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSeriesDraft(I);

    await signInAsAdmin(I);
    const response = await sendApiRequestWithAuth(
      I,
      `/board/series/${seriesId}/finalize`,
      "POST",
      {},
    );
    assert.equal(response.status, 400);
    assert.equal(response.body.message, "Proposal đã được xử lý");
  },
);

// ---------------------------------------------------------------------------
// FS-ST-09: Lỗi TypeError (body không phải JSON) rơi vào catch status 500
// ---------------------------------------------------------------------------
Scenario(
  "FS-ST-09: Lỗi runtime khi body không phải JSON trả về 500",
  async ({ I }) => {
    await signInAsAdmin(I);
    const token = await refreshAccessToken(I);

    const response = await I.executeScript(async (accessToken) => {
      const res = await fetch(
        "http://localhost:5000/api/board/series/000000000000000000000000/finalize",
        {
          method: "POST",
          credentials: "include",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "text/plain",
          },
          body: "non-json-body",
        },
      );
      return { status: res.status, body: await res.json() };
    }, token);

    assert.equal(response.status, 500);
    assert.equal(response.body.error, "Lỗi server");
  },
);

// ---------------------------------------------------------------------------
// FS-ST-10: Luồng hết hạn không phiếu (markNeedRevisionNoVotes) trên đủ 4 nhánh
// ---------------------------------------------------------------------------
Scenario(
  "FS-ST-10: Xử lý hết hạn xét duyệt không có phiếu (markNeedRevisionNoVotes)",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const noPropSeries = await createSeriesViaApi(I);
    const draftSeries = await createSeriesDraft(I);
    const submittedSeries = await createSubmittedSeries(I);

    await signInAsAdmin(I);
    const token = await refreshAccessToken(I);

    const callExpire = (id) =>
      I.executeScript(
        async ({ targetId, accessToken }) => {
          const res = await fetch(
            `http://localhost:5000/api/board/series/${targetId}/finalize`,
            {
              method: "POST",
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
                "x-test-expire-no-votes": "1",
              },
              body: JSON.stringify({}),
            },
          );
          return { status: res.status, body: await res.json() };
        },
        { targetId: id, accessToken: token },
      );

    // 1. Series không tồn tại -> null
    const r1 = await callExpire("000000000000000000000000");
    assert.equal(r1.status, 200);
    assert.equal(r1.body.result, null);

    // 2. Series chưa có proposal -> null
    const r2 = await callExpire(noPropSeries.body.series._id);
    assert.equal(r2.status, 200);
    assert.equal(r2.body.result, null);

    // 3. Proposal ở trạng thái Draft -> null
    const r3 = await callExpire(draftSeries.seriesId);
    assert.equal(r3.status, 200);
    assert.equal(r3.body.result, null);

    // 4. Proposal Submitted hết hạn không phiếu -> Need Revision
    const r4 = await callExpire(submittedSeries.seriesId);
    assert.equal(r4.status, 200);
    assert.equal(r4.body.result.proposal.status, "Need Revision");
  },
);
