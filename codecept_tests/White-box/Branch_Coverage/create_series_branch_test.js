import assert from "node:assert/strict";
import { refreshAccessToken } from "../../series_test_helpers.js";
import {
  signInAsAdmin,
  createSeriesViaApi,
  getEditorId,
  getNonEditorUserId,
  signInAs,
  uniqueSeriesPayload,
} from "../coverage_helpers.js";

Feature("White-Box Branch Coverage — createSeries (100% Branches)");

// ---------------------------------------------------------------------------
// CS-BC-01: !title là true và false
// ---------------------------------------------------------------------------
Scenario(
  "CS-BC-01: Thiếu title và có title hợp lệ đi qua 2 nhánh tương ứng",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const missing = await createSeriesViaApi(I, { title: undefined });
    assert.equal(missing.status, 400);

    const valid = await createSeriesViaApi(I);
    assert.equal(valid.status, 201);
  },
);

// ---------------------------------------------------------------------------
// CS-BC-02: typeof title === "string" && /[<>]/.test(title) là true và false
// ---------------------------------------------------------------------------
Scenario(
  "CS-BC-02: Title chứa ký tự markup HTML bị từ chối, title thường được chấp nhận",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const rejected = await createSeriesViaApi(I, {
      title: `Markup <title> ${Date.now()}`,
    });
    assert.equal(rejected.status, 400);

    const accepted = await createSeriesViaApi(I);
    assert.equal(accepted.status, 201);
  },
);

// ---------------------------------------------------------------------------
// CS-BC-03: existingSeries truthy và falsy
// ---------------------------------------------------------------------------
Scenario(
  "CS-BC-03: Title trùng lặp bị từ chối 400, title duy nhất tạo thành công 201",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const payload = uniqueSeriesPayload();
    assert.equal((await createSeriesViaApi(I, payload)).status, 201);
    assert.equal(
      (await createSeriesViaApi(I, { title: payload.title })).status,
      400,
    );
    assert.equal((await createSeriesViaApi(I)).status, 201);
  },
);

// ---------------------------------------------------------------------------
// CS-BC-04: if (editor_id) là false và true (kiểm tra & gửi thông báo editor)
// ---------------------------------------------------------------------------
Scenario(
  "CS-BC-04: Bỏ qua editor_id không gán editor; có editor_id hợp lệ gán và thông báo",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const withoutEditor = await createSeriesViaApi(I);
    assert.equal(withoutEditor.status, 201);
    assert.equal(withoutEditor.body.series.editor_id, null);

    const editorId = await getEditorId(I);
    const withEditor = await createSeriesViaApi(I, { editor_id: editorId });
    assert.equal(withEditor.status, 201);
    assert.equal(String(withEditor.body.series.editor_id), String(editorId));
  },
);

// ---------------------------------------------------------------------------
// CS-BC-05: Từng nhánh kiểm tra hợp lệ của editor_id
// ---------------------------------------------------------------------------
Scenario(
  "CS-BC-05: Phủ đủ các nhánh validation của editor_id",
  async ({ I }) => {
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
  },
);

// ---------------------------------------------------------------------------
// CS-BC-06: normalizeOptionalText (non-string, chuỗi toàn khoảng trắng, chuỗi thường)
// ---------------------------------------------------------------------------
Scenario(
  "CS-BC-06: Chuẩn hóa trường tùy chọn khi undefined, chỉ khoảng trắng và có nội dung",
  async ({ I }) => {
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
  },
);

// ---------------------------------------------------------------------------
// CS-BC-07: typeof title === "string" là false (title kiểu số)
// ---------------------------------------------------------------------------
Scenario(
  "CS-BC-07: Title kiểu số bỏ qua kiểm tra regex chuỗi và được ép kiểu chuỗi",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const numericTitle = Date.now();
    const response = await createSeriesViaApi(I, { title: numericTitle });

    assert.equal(response.status, 201);
    assert.equal(response.body.series.title, String(numericTitle));
  },
);

// ---------------------------------------------------------------------------
// CS-BC-08: req.user.role === ROLES.ADMIN ? author_id || req.user.id : req.user.id
// ---------------------------------------------------------------------------
Scenario(
  "CS-BC-08: Xác định author_id theo role Mangaka và Admin (có/không truyền author_id)",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const mangakaSeries = await createSeriesViaApi(I);
    assert.equal(mangakaSeries.status, 201);
    const mangakaId = String(mangakaSeries.body.series.author_id);

    await signInAsAdmin(I);
    const adminSelf = await createSeriesViaApi(I);
    assert.equal(adminSelf.status, 201);
    assert.ok(adminSelf.body.series.author_id);

    const adminForMangaka = await createSeriesViaApi(I, {
      author_id: mangakaId,
    });
    assert.equal(adminForMangaka.status, 201);
    assert.equal(String(adminForMangaka.body.series.author_id), mangakaId);
  },
);

// ---------------------------------------------------------------------------
// CS-BC-09: normalizedSummary !== undefined && normalizedSummary !== null
// ---------------------------------------------------------------------------
Scenario(
  "CS-BC-09: Xử lý summary khi undefined, null và chuỗi hợp lệ",
  async ({ I }) => {
    await signInAs(I, "mangaka");

    const withoutSummary = await createSeriesViaApi(I);
    assert.equal(withoutSummary.status, 201);
    assert.equal(withoutSummary.body.proposal, null);

    const nullSummary = await createSeriesViaApi(I, { summary: null });
    assert.equal(nullSummary.status, 201);
    assert.equal(nullSummary.body.proposal, null);

    const validSummary = await createSeriesViaApi(I, {
      summary: "Tóm tắt nội dung hợp lệ cho proposal mới.",
    });
    assert.equal(validSummary.status, 201);
    assert.ok(validSummary.body.proposal);
    assert.equal(validSummary.body.proposal.status, "Draft");
  },
);

// ---------------------------------------------------------------------------
// CS-BC-10: summaryValidation && summaryValidation.errors.summary là true và false
// ---------------------------------------------------------------------------
Scenario(
  "CS-BC-10: Summary vượt quá độ dài tối đa trả về 400, summary hợp lệ tạo thành công",
  async ({ I }) => {
    await signInAs(I, "mangaka");

    const invalidSummary = await createSeriesViaApi(I, {
      summary: "A".repeat(5001),
    });
    assert.equal(invalidSummary.status, 400);
    assert.equal(invalidSummary.body.message, "Dữ liệu proposal không hợp lệ");

    const validSummary = await createSeriesViaApi(I, {
      summary: "Tóm tắt hợp lệ đạt chuẩn độ dài của proposal.",
    });
    assert.equal(validSummary.status, 201);
  },
);

// ---------------------------------------------------------------------------
// CS-BC-11: Khối catch với err.name === "ValidationError" là true (400) và false (500)
// ---------------------------------------------------------------------------
Scenario(
  "CS-BC-11: Bắt lỗi ValidationError trả về 400 và lỗi runtime khác trả về 500",
  async ({ I }) => {
    await signInAs(I, "mangaka");

    const validationErr = await createSeriesViaApi(I, {
      genre: { invalidCast: true },
    });
    assert.equal(validationErr.status, 400);
    assert.equal(validationErr.body.message, "Dữ liệu Series không hợp lệ");

    const token = await refreshAccessToken(I);
    const serverErr = await I.executeScript(async (accessToken) => {
      const res = await fetch("http://localhost:5000/api/series", {
        method: "POST",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "text/plain",
        },
        body: "non-json-body",
      });
      return { status: res.status, body: await res.json() };
    }, token);

    assert.equal(serverErr.status, 500);
    assert.equal(serverErr.body.error, "Lỗi server");
  },
);
