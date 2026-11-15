import assert from "node:assert/strict";
import {
  castBoardVote,
  createSeries,
  createSeriesDraft,
  createSubmittedSeries,
  finalizeBoardReview,
  openBoardReview,
  refreshAccessToken,
  sendApiRequestWithAuth,
  signInAs,
} from "../../series_test_helpers.js";

Feature("White-Box Branch Coverage — updateSeries (100% Reachable Branches)");

// ---------------------------------------------------------------------------
// US-BC-01: Trường tùy chọn không gửi (undefined) được giữ nguyên; gửi "" hoặc null thì xóa
// ---------------------------------------------------------------------------
Scenario(
  "US-BC-01: Bỏ qua trường tùy chọn thì giữ nguyên, gửi chuỗi rỗng hoặc null thì xóa",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSeriesDraft(I, {
      description: "Description to preserve",
      genre: "Fantasy",
      targetAudience: "Young adult",
    });

    // Không gửi trường nào (undefined) -> giữ nguyên
    const omitted = await sendApiRequestWithAuth(
      I,
      `/series/${seriesId}`,
      "PUT",
      {},
    );
    assert.equal(omitted.status, 200);
    assert.equal(omitted.body.series.description, "Description to preserve");
    assert.equal(omitted.body.series.genre, "Fantasy");

    // Gửi chuỗi rỗng -> xóa giá trị
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

    // Gửi null (typeof !== "string") -> xóa giá trị
    const nulled = await sendApiRequestWithAuth(
      I,
      `/series/${seriesId}`,
      "PUT",
      { description: null, genre: null, target_audience: null },
    );
    assert.equal(nulled.status, 200);
    assert.equal(nulled.body.series.description || "", "");
    assert.equal(nulled.body.series.genre || "", "");
    assert.equal(nulled.body.series.target_audience || "", "");
  },
);

// ---------------------------------------------------------------------------
// US-BC-02: editor_id không gửi (undefined), null, chuỗi rỗng "" và ID hợp lệ
// ---------------------------------------------------------------------------
Scenario(
  "US-BC-02: editor_id khi bỏ qua, null, chuỗi rỗng và ID hợp lệ đi qua các nhánh tương ứng",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const editors = await sendApiRequestWithAuth(I, "/series/editors", "GET");
    assert.ok(
      editors.body.editors.length > 0,
      "Cần ít nhất một Tantou Editor trong dữ liệu mẫu",
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
  },
);

// ---------------------------------------------------------------------------
// US-BC-03: description, genre, target_audience đi qua nhánh rỗng và có nội dung hợp lệ
// ---------------------------------------------------------------------------
Scenario(
  "US-BC-03: description, genre, target_audience đi qua nhánh rỗng và hợp lệ",
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
// US-BC-04: Nhánh kiểm tra trạng thái Proposal (null, Draft, Submitted, Rejected)
// ---------------------------------------------------------------------------
Scenario(
  "US-BC-04: Cập nhật Series khi chưa có Proposal, Proposal Draft, Submitted và Rejected",
  async ({ I }) => {
    await signInAs(I, "mangaka");

    // 1. Chưa có Proposal (proposal === null) -> 200
    const noProposal = await createSeries(I);
    const resNoProp = await sendApiRequestWithAuth(
      I,
      `/series/${noProposal.seriesId}`,
      "PUT",
      { title: `No Proposal Update ${Date.now()}` },
    );
    assert.equal(resNoProp.status, 200);

    // 2. Proposal đang Draft -> 200
    const draft = await createSeriesDraft(I);
    const resDraft = await sendApiRequestWithAuth(
      I,
      `/series/${draft.seriesId}`,
      "PUT",
      { title: `Draft Update ${Date.now()}` },
    );
    assert.equal(resDraft.status, 200);

    // 3. Proposal đang Submitted (chờ duyệt) -> 409
    const submitted = await createSubmittedSeries(I);
    const resSubmitted = await sendApiRequestWithAuth(
      I,
      `/series/${submitted.seriesId}`,
      "PUT",
      { title: "Blocked Submitted Update" },
    );
    assert.equal(resSubmitted.status, 409);

    // 4. Proposal đã Rejected (không thuộc EDITABLE_STATUSES) -> 400
    const rejectedSeries = await createSubmittedSeries(I);
    await openBoardReview(I, rejectedSeries.seriesId);
    await castBoardVote(I, "Reject");
    await finalizeBoardReview(I, "Reject");

    await signInAs(I, "mangaka");
    const resRejected = await sendApiRequestWithAuth(
      I,
      `/series/${rejectedSeries.seriesId}`,
      "PUT",
      { title: "Blocked Rejected Update" },
    );
    assert.equal(resRejected.status, 400);
    assert.ok(resRejected.body.message.includes("Rejected"));
  },
);

// ---------------------------------------------------------------------------
// US-BC-05: Các nhánh validation của title (rỗng, null, < 2, > 100, markup, trùng tên, kiểu số)
// ---------------------------------------------------------------------------
Scenario(
  "US-BC-05: Phủ toàn bộ nhánh kiểm tra của trường title",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const existing = await createSeriesDraft(I);
    const { seriesId } = await createSeriesDraft(I);

    // Rỗng sau trim -> 400
    const emptyRes = await sendApiRequestWithAuth(
      I,
      `/series/${seriesId}`,
      "PUT",
      { title: "   " },
    );
    assert.equal(emptyRes.status, 400);

    // null (typeof !== "string" && !trimmedTitle) -> 400
    const nullRes = await sendApiRequestWithAuth(
      I,
      `/series/${seriesId}`,
      "PUT",
      { title: null },
    );
    assert.equal(nullRes.status, 400);

    // Ngắn hơn 2 ký tự -> 400
    const shortRes = await sendApiRequestWithAuth(
      I,
      `/series/${seriesId}`,
      "PUT",
      { title: "X" },
    );
    assert.equal(shortRes.status, 400);

    // Vượt quá 100 ký tự -> 400
    const longRes = await sendApiRequestWithAuth(
      I,
      `/series/${seriesId}`,
      "PUT",
      { title: "A".repeat(101) },
    );
    assert.equal(longRes.status, 400);

    // Chứa markup HTML -> 400
    const markupRes = await sendApiRequestWithAuth(
      I,
      `/series/${seriesId}`,
      "PUT",
      { title: "<b>X</b>" },
    );
    assert.equal(markupRes.status, 400);

    // Trùng tên với Series khác (existingSeries truthy) -> 400
    const dupRes = await sendApiRequestWithAuth(
      I,
      `/series/${seriesId}`,
      "PUT",
      { title: existing.title },
    );
    assert.equal(dupRes.status, 400);

    // Kiểu số (typeof title !== "string" && typeof trimmedTitle !== "string") -> 200
    const numericTitle = Date.now();
    const numericRes = await sendApiRequestWithAuth(
      I,
      `/series/${seriesId}`,
      "PUT",
      { title: numericTitle },
    );
    assert.equal(numericRes.status, 200);
    assert.equal(numericRes.body.series.title, String(numericTitle));
  },
);

// ---------------------------------------------------------------------------
// US-BC-06: Các nhánh vi phạm độ dài của description, genre và target_audience
// ---------------------------------------------------------------------------
Scenario(
  "US-BC-06: Phủ các nhánh giới hạn độ dài min/max của description, genre và target_audience",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSeriesDraft(I);

    const invalidCases = [
      { description: "Ngắn" }, // < 10 ký tự
      { description: "D".repeat(2001) }, // > 2000 ký tự
      { genre: "A" }, // < 2 ký tự
      { genre: "G".repeat(51) }, // > 50 ký tự
      { target_audience: "A" }, // < 2 ký tự
      { target_audience: "T".repeat(51) }, // > 50 ký tự
    ];

    for (const payload of invalidCases) {
      const res = await sendApiRequestWithAuth(
        I,
        `/series/${seriesId}`,
        "PUT",
        payload,
      );
      assert.equal(res.status, 400);
    }
  },
);

// ---------------------------------------------------------------------------
// US-BC-07: Các nhánh lỗi của editor_id (sai định dạng, không tồn tại, sai role)
// ---------------------------------------------------------------------------
Scenario(
  "US-BC-07: Phủ các nhánh lỗi validation của editor_id",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSeriesDraft(I);

    // 1. Sai định dạng ObjectId -> 400
    const badFormat = await sendApiRequestWithAuth(
      I,
      `/series/${seriesId}`,
      "PUT",
      { editor_id: "not_a_valid_id" },
    );
    assert.equal(badFormat.status, 400);
    assert.ok(badFormat.body.message.includes("không đúng định dạng"));

    // 2. Đúng định dạng nhưng không tồn tại trong DB -> 400
    const notFound = await sendApiRequestWithAuth(
      I,
      `/series/${seriesId}`,
      "PUT",
      { editor_id: "000000000000000000000000" },
    );
    assert.equal(notFound.status, 400);
    assert.ok(notFound.body.message.includes("Không tìm thấy biên tập viên"));

    // 3. User tồn tại nhưng không có vai trò Tantou Editor -> 400
    const detailRes = await sendApiRequestWithAuth(
      I,
      `/series/${seriesId}`,
      "GET",
    );
    const mangakaUserId = detailRes.body.series.author_id;
    const wrongRole = await sendApiRequestWithAuth(
      I,
      `/series/${seriesId}`,
      "PUT",
      { editor_id: mangakaUserId },
    );
    assert.equal(wrongRole.status, 400);
    assert.ok(wrongRole.body.message.includes("không phải Tantou Editor"));
  },
);

// ---------------------------------------------------------------------------
// US-BC-08: Khối catch với err.name === "ValidationError" là true (400) và false (500)
// ---------------------------------------------------------------------------
Scenario(
  "US-BC-08: Bắt lỗi ValidationError trả về 400 và lỗi runtime khác trả về 500",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSeriesDraft(I);

    // Nhánh true: Mongoose ValidationError -> 400
    const validationErr = await sendApiRequestWithAuth(
      I,
      `/series/${seriesId}`,
      "PUT",
      { genre: { invalidCast: true } },
    );
    assert.equal(validationErr.status, 400);
    assert.equal(validationErr.body.message, "Dữ liệu Series không hợp lệ");

    // Nhánh false: Lỗi runtime khác (TypeError khi body không phải JSON) -> 500
    const token = await refreshAccessToken(I);
    const serverErr = await I.executeScript(
      async ({ id, accessToken }) => {
        const res = await fetch(`http://localhost:5000/api/series/${id}`, {
          method: "PUT",
          credentials: "include",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "text/plain",
          },
          body: "non-json-body",
        });
        return { status: res.status, body: await res.json() };
      },
      { id: seriesId, accessToken: token },
    );

    assert.equal(serverErr.status, 500);
    assert.equal(serverErr.body.error, "Lỗi server");
  },
);
