import assert from "node:assert/strict";
import {
  createSeriesDraft,
  createSubmittedSeries,
  refreshAccessToken,
  sendApiRequestWithAuth,
  signInAs,
} from "../../series_test_helpers.js";
import {
  createSeriesWithRejectedProposal,
  getEditorId,
  getNonEditorUserId,
} from "../coverage_helpers.js";

Feature("White-Box Statement Coverage — updateSeries (100% Statements)");

// ---------------------------------------------------------------------------
// US-ST-01: Cập nhật với body rỗng {} giữ nguyên các trường
// ---------------------------------------------------------------------------
Scenario(
  "US-ST-01: Cập nhật với body rỗng {} giữ nguyên dữ liệu Series",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSeriesDraft(I);
    const before = await sendApiRequestWithAuth(
      I,
      `/series/${seriesId}`,
      "GET",
    );
    const updated = await sendApiRequestWithAuth(
      I,
      `/series/${seriesId}`,
      "PUT",
      {},
    );

    assert.equal(updated.status, 200);
    const after = await sendApiRequestWithAuth(I, `/series/${seriesId}`, "GET");
    assert.equal(after.body.series.title, before.body.series.title);
    assert.equal(after.body.series.genre, before.body.series.genre);
  },
);

// ---------------------------------------------------------------------------
// US-ST-02: Cập nhật title hợp lệ và xóa các trường tùy chọn bằng chuỗi rỗng ""
// ---------------------------------------------------------------------------
Scenario(
  "US-ST-02: Cập nhật title hợp lệ và xóa các trường tùy chọn bằng chuỗi rỗng",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSeriesDraft(I, {
      description: "A description to clear",
      genre: "Fantasy",
      targetAudience: "Young adult",
    });
    const newTitle = `Updated Title ${Date.now()}`;
    const response = await sendApiRequestWithAuth(
      I,
      `/series/${seriesId}`,
      "PUT",
      { title: newTitle, description: "", genre: "", target_audience: "" },
    );

    assert.equal(response.status, 200);
    assert.equal(response.body.series.title, newTitle);
    assert.equal(response.body.series.description || "", "");
    assert.equal(response.body.series.genre || "", "");
    assert.equal(response.body.series.target_audience || "", "");
  },
);

// ---------------------------------------------------------------------------
// US-ST-03: Gửi editor_id là null hoặc "" để bỏ gán editor
// ---------------------------------------------------------------------------
Scenario(
  "US-ST-03: Gửi editor_id là null hoặc chuỗi rỗng bỏ gán editor",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    for (const editorId of [null, ""]) {
      const { seriesId } = await createSeriesDraft(I);
      const response = await sendApiRequestWithAuth(
        I,
        `/series/${seriesId}`,
        "PUT",
        { editor_id: editorId },
      );
      assert.equal(response.status, 200);
      assert.equal(response.body.series.editor_id, null);
    }
  },
);

// ---------------------------------------------------------------------------
// US-ST-04: Gán Tantou Editor hợp lệ
// ---------------------------------------------------------------------------
Scenario("US-ST-04: Gán Tantou Editor hợp lệ thành công", async ({ I }) => {
  await signInAs(I, "mangaka");
  const editorId = await getEditorId(I);
  const { seriesId } = await createSeriesDraft(I);
  const response = await sendApiRequestWithAuth(
    I,
    `/series/${seriesId}`,
    "PUT",
    { editor_id: editorId },
  );

  assert.equal(response.status, 200);
  assert.equal(String(response.body.series.editor_id), String(editorId));
});

// ---------------------------------------------------------------------------
// US-ST-05: Sửa series khi proposal ở trạng thái chờ duyệt (Submitted) → 409
// ---------------------------------------------------------------------------
Scenario(
  "US-ST-05: Sửa series khi proposal đang Submitted trả về 409",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSubmittedSeries(I);

    const response = await sendApiRequestWithAuth(
      I,
      `/series/${seriesId}`,
      "PUT",
      { title: "New Title Attempt" },
    );
    assert.equal(response.status, 409);
    assert.ok(response.body.message.includes("chờ duyệt"));
  },
);

// ---------------------------------------------------------------------------
// US-ST-06: Sửa series khi proposal đã kết thúc (Rejected) → 400
// ---------------------------------------------------------------------------
Scenario(
  "US-ST-06: Sửa series khi proposal ở trạng thái Rejected trả về 400",
  async ({ I }) => {
    const seriesId = await createSeriesWithRejectedProposal(I);

    const response = await sendApiRequestWithAuth(
      I,
      `/series/${seriesId}`,
      "PUT",
      { title: "Title After Reject" },
    );
    assert.equal(response.status, 400);
    assert.ok(response.body.message.includes("Rejected"));
  },
);

// ---------------------------------------------------------------------------
// US-ST-07: Sửa title thành rỗng → 400
// ---------------------------------------------------------------------------
Scenario("US-ST-07: title chỉ chứa khoảng trắng trả về 400", async ({ I }) => {
  await signInAs(I, "mangaka");
  const { seriesId } = await createSeriesDraft(I);

  const response = await sendApiRequestWithAuth(
    I,
    `/series/${seriesId}`,
    "PUT",
    { title: "   " },
  );
  assert.equal(response.status, 400);
  assert.equal(response.body.message, "title không được rỗng");
});

// ---------------------------------------------------------------------------
// US-ST-08: Sửa title ngắn hơn 2 ký tự → 400
// ---------------------------------------------------------------------------
Scenario("US-ST-08: title ngắn hơn 2 ký tự trả về 400", async ({ I }) => {
  await signInAs(I, "mangaka");
  const { seriesId } = await createSeriesDraft(I);

  const response = await sendApiRequestWithAuth(
    I,
    `/series/${seriesId}`,
    "PUT",
    { title: "A" },
  );
  assert.equal(response.status, 400);
  assert.equal(response.body.message, "Tên series phải có ít nhất 2 ký tự");
});

// ---------------------------------------------------------------------------
// US-ST-09: Sửa title dài hơn 100 ký tự → 400
// ---------------------------------------------------------------------------
Scenario("US-ST-09: title vượt quá 100 ký tự trả về 400", async ({ I }) => {
  await signInAs(I, "mangaka");
  const { seriesId } = await createSeriesDraft(I);

  const response = await sendApiRequestWithAuth(
    I,
    `/series/${seriesId}`,
    "PUT",
    { title: "A".repeat(101) },
  );
  assert.equal(response.status, 400);
  assert.equal(
    response.body.message,
    "Tên series không được vượt quá 100 ký tự",
  );
});

// ---------------------------------------------------------------------------
// US-ST-10: Sửa title chứa ký tự HTML markup (< hoặc >) → 400
// ---------------------------------------------------------------------------
Scenario("US-ST-10: title chứa markup HTML trả về 400", async ({ I }) => {
  await signInAs(I, "mangaka");
  const { seriesId } = await createSeriesDraft(I);

  const response = await sendApiRequestWithAuth(
    I,
    `/series/${seriesId}`,
    "PUT",
    { title: "Series <script>" },
  );
  assert.equal(response.status, 400);
  assert.ok(response.body.message.includes("markup"));
});

// ---------------------------------------------------------------------------
// US-ST-11: Sửa title trùng với series khác → 400
// ---------------------------------------------------------------------------
Scenario("US-ST-11: title trùng với series khác trả về 400", async ({ I }) => {
  await signInAs(I, "mangaka");
  const s1 = await createSeriesDraft(I, {
    title: `Duplicate Alpha ${Date.now()}`,
  });
  const s2 = await createSeriesDraft(I, {
    title: `Duplicate Beta ${Date.now()}`,
  });

  const s1Data = await sendApiRequestWithAuth(
    I,
    `/series/${s1.seriesId}`,
    "GET",
  );
  const existingTitle = s1Data.body.series.title;

  const response = await sendApiRequestWithAuth(
    I,
    `/series/${s2.seriesId}`,
    "PUT",
    { title: existingTitle },
  );
  assert.equal(response.status, 400);
  assert.ok(response.body.message.includes("đã tồn tại"));
});

// ---------------------------------------------------------------------------
// US-ST-12: Sửa description < 10 ký tự → 400
// ---------------------------------------------------------------------------
Scenario(
  "US-ST-12: description ngắn hơn 10 ký tự trả về 400",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSeriesDraft(I);

    const response = await sendApiRequestWithAuth(
      I,
      `/series/${seriesId}`,
      "PUT",
      { description: "Too short" },
    );
    assert.equal(response.status, 400);
    assert.equal(
      response.body.message,
      "Mô tả series phải có ít nhất 10 ký tự",
    );
  },
);

// ---------------------------------------------------------------------------
// US-ST-13: Sửa description > 2000 ký tự → 400
// ---------------------------------------------------------------------------
Scenario(
  "US-ST-13: description vượt quá 2000 ký tự trả về 400",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSeriesDraft(I);

    const response = await sendApiRequestWithAuth(
      I,
      `/series/${seriesId}`,
      "PUT",
      { description: "D".repeat(2001) },
    );
    assert.equal(response.status, 400);
    assert.equal(
      response.body.message,
      "Mô tả series không được vượt quá 2000 ký tự",
    );
  },
);

// ---------------------------------------------------------------------------
// US-ST-14: Sửa genre < 2 ký tự → 400
// ---------------------------------------------------------------------------
Scenario("US-ST-14: genre ngắn hơn 2 ký tự trả về 400", async ({ I }) => {
  await signInAs(I, "mangaka");
  const { seriesId } = await createSeriesDraft(I);

  const response = await sendApiRequestWithAuth(
    I,
    `/series/${seriesId}`,
    "PUT",
    { genre: "X" },
  );
  assert.equal(response.status, 400);
  assert.equal(response.body.message, "Thể loại phải có ít nhất 2 ký tự");
});

// ---------------------------------------------------------------------------
// US-ST-15: Sửa genre > 50 ký tự → 400
// ---------------------------------------------------------------------------
Scenario("US-ST-15: genre vượt quá 50 ký tự trả về 400", async ({ I }) => {
  await signInAs(I, "mangaka");
  const { seriesId } = await createSeriesDraft(I);

  const response = await sendApiRequestWithAuth(
    I,
    `/series/${seriesId}`,
    "PUT",
    { genre: "G".repeat(51) },
  );
  assert.equal(response.status, 400);
  assert.equal(response.body.message, "Thể loại không được vượt quá 50 ký tự");
});

// ---------------------------------------------------------------------------
// US-ST-16: Sửa target_audience < 2 ký tự → 400
// ---------------------------------------------------------------------------
Scenario(
  "US-ST-16: target_audience ngắn hơn 2 ký tự trả về 400",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSeriesDraft(I);

    const response = await sendApiRequestWithAuth(
      I,
      `/series/${seriesId}`,
      "PUT",
      { target_audience: "Y" },
    );
    assert.equal(response.status, 400);
    assert.equal(
      response.body.message,
      "Đối tượng mục tiêu phải có ít nhất 2 ký tự",
    );
  },
);

// ---------------------------------------------------------------------------
// US-ST-17: Sửa target_audience > 50 ký tự → 400
// ---------------------------------------------------------------------------
Scenario(
  "US-ST-17: target_audience vượt quá 50 ký tự trả về 400",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSeriesDraft(I);

    const response = await sendApiRequestWithAuth(
      I,
      `/series/${seriesId}`,
      "PUT",
      { target_audience: "T".repeat(51) },
    );
    assert.equal(response.status, 400);
    assert.equal(
      response.body.message,
      "Đối tượng mục tiêu không được vượt quá 50 ký tự",
    );
  },
);

// ---------------------------------------------------------------------------
// US-ST-18: editor_id sai định dạng ObjectId → 400
// ---------------------------------------------------------------------------
Scenario(
  "US-ST-18: editor_id sai định dạng ObjectId trả về 400",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSeriesDraft(I);

    const response = await sendApiRequestWithAuth(
      I,
      `/series/${seriesId}`,
      "PUT",
      { editor_id: "invalid_not_an_object_id" },
    );
    assert.equal(response.status, 400);
    assert.equal(
      response.body.message,
      "editor_id không đúng định dạng hợp lệ",
    );
  },
);

// ---------------------------------------------------------------------------
// US-ST-19: editor_id không tồn tại trong hệ thống → 400
// ---------------------------------------------------------------------------
Scenario(
  "US-ST-19: editor_id không tồn tại trong hệ thống trả về 400",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSeriesDraft(I);

    const response = await sendApiRequestWithAuth(
      I,
      `/series/${seriesId}`,
      "PUT",
      { editor_id: "000000000000000000000000" },
    );
    assert.equal(response.status, 400);
    assert.equal(
      response.body.message,
      "Không tìm thấy biên tập viên trong hệ thống",
    );
  },
);

// ---------------------------------------------------------------------------
// US-ST-20: editor_id không phải Tantou Editor → 400
// ---------------------------------------------------------------------------
Scenario(
  "US-ST-20: editor_id của user không phải Tantou Editor trả về 400",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const nonEditorId = await getNonEditorUserId(I);
    const { seriesId } = await createSeriesDraft(I);

    const response = await sendApiRequestWithAuth(
      I,
      `/series/${seriesId}`,
      "PUT",
      { editor_id: nonEditorId },
    );
    assert.equal(response.status, 400);
    assert.ok(response.body.message.includes("không phải Tantou Editor"));
  },
);

// ---------------------------------------------------------------------------
// US-ST-21: Lỗi Mongoose ValidationError khi lưu Series → 400
// ---------------------------------------------------------------------------
Scenario(
  "US-ST-21: Lỗi ValidationError khi lưu Series trả về 400",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSeriesDraft(I);

    const response = await sendApiRequestWithAuth(
      I,
      `/series/${seriesId}`,
      "PUT",
      { genre: { invalidCast: true } },
    );
    assert.equal(response.status, 400);
    assert.equal(response.body.message, "Dữ liệu Series không hợp lệ");
    assert.ok(Array.isArray(response.body.details));
  },
);

// ---------------------------------------------------------------------------
// US-ST-22: Lỗi TypeError (body không phải JSON) rơi vào catch → 500
// ---------------------------------------------------------------------------
Scenario(
  "US-ST-22: Lỗi runtime khi body không phải JSON trả về 500",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSeriesDraft(I);
    const token = await refreshAccessToken(I);

    const response = await I.executeScript(
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

    assert.equal(response.status, 500);
    assert.equal(response.body.error, "Lỗi server");
  },
);
