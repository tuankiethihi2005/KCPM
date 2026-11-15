import assert from "node:assert/strict";
import {
  createSeriesViaApi,
  getEditorId,
  getNonEditorUserId,
  signInAs,
  uniqueSeriesPayload,
} from "../coverage_helpers.js";
import { refreshAccessToken } from "../../series_test_helpers.js";

Feature("White-Box Statement Coverage - createSeries (100% Statements)");

Scenario("CS-ST-01 | Dòng 29-31: Thiếu title trả về 400", async ({ I }) => {
  await signInAs(I, "mangaka");
  const res = await createSeriesViaApi(I, { title: "" });
  assert.equal(res.status, 400);
  assert.equal(res.body.message, "title là bắt buộc");
});

Scenario(
  "CS-ST-02 | Dòng 33-37: title chứa ký tự HTML (<, >) trả về 400",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const res = await createSeriesViaApi(I, { title: "Series <script>" });
    assert.equal(res.status, 400);
    assert.equal(
      res.body.message,
      "Tên series không được chứa ký tự markup HTML.",
    );
  },
);

Scenario(
  "CS-ST-03 | Dòng 39-42: title đã tồn tại trả về 400",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const payload = uniqueSeriesPayload();
    const first = await createSeriesViaApi(I, payload);
    assert.equal(first.status, 201);

    const dup = await createSeriesViaApi(I, payload);
    assert.equal(dup.status, 400);
    assert.equal(dup.body.message, "Series này đã tồn tại");
  },
);

Scenario(
  "CS-ST-04 | Dòng 51-61: summary vi phạm schema SeriesProposal trả về 400",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const res = await createSeriesViaApi(I, {
      summary: "x".repeat(5001),
    });
    assert.equal(res.status, 400);
    assert.equal(res.body.message, "Dữ liệu proposal không hợp lệ");
  },
);

Scenario(
  "CS-ST-05 | Dòng 64-69: editor_id sai định dạng ObjectId trả về 400",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const res = await createSeriesViaApi(I, { editor_id: "invalid-id" });
    assert.equal(res.status, 400);
    assert.equal(res.body.message, "editor_id không hợp lệ");
  },
);

Scenario(
  "CS-ST-06 | Dòng 71-76: editor_id không tồn tại trong DB trả về 400",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const res = await createSeriesViaApi(I, {
      editor_id: "507f1f77bcf86cd799439011",
    });
    assert.equal(res.status, 400);
    assert.equal(
      res.body.message,
      "Không tìm thấy người dùng với editor_id đã cung cấp",
    );
  },
);

Scenario(
  "CS-ST-07 | Dòng 78-82: editor_id không phải Tantou Editor trả về 400",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const nonEditorId = await getNonEditorUserId(I);
    const res = await createSeriesViaApi(I, { editor_id: nonEditorId });
    assert.equal(res.status, 400);
    assert.ok(res.body.message.includes("không phải Tantou Editor"));
  },
);

Scenario(
  "CS-ST-08 | Dòng 84-139: Happy path đầy đủ (normalize rỗng + summary + editor_id)",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const editorId = await getEditorId(I);
    const res = await createSeriesViaApi(I, {
      description: "   ",
      summary: "Tóm tắt nội dung hợp lệ cho white-box statement coverage",
      editor_id: editorId,
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.message, "Tạo series thành công");
    assert.ok(res.body.proposal);
  },
);

Scenario(
  "CS-ST-09 | Dòng 141-146: Lỗi Mongoose ValidationError trả về 400",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const res = await createSeriesViaApi(I, {
      genre: { invalidCast: true },
    });
    assert.equal(res.status, 400);
    assert.equal(res.body.message, "Dữ liệu Series không hợp lệ");
  },
);

Scenario(
  "CS-ST-10 | Dòng 148: Lỗi runtime khác ValidationError trả về 500",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const token = await refreshAccessToken(I);
    const res = await I.executeScript(async (accessToken) => {
      const response = await fetch("http://localhost:5000/api/series", {
        method: "POST",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "text/plain",
        },
        body: "non-json-body",
      });
      return { status: response.status, body: await response.json() };
    }, token);

    assert.equal(res.status, 500);
    assert.equal(res.body.error, "Lỗi server");
  },
);
