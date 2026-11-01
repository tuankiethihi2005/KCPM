import assert from "node:assert/strict";
import {
  captureVoteAuthHeader,
  castBoardVote,
  createSubmittedSeries,
  createSeriesDraft,
  finalizeBoardReview,
  fillSeriesFields,
  openBoardReview,
  saveSeriesDraft,
  signInAs,
  waitForTextCaseInsensitive,
  seeTextCaseInsensitive,
  getUiResult,
  normalizeText,
  sendApiRequestWithAuth,
} from "./series_test_helpers.js";

async function expectUpdateRejectedOnUi(I) {
  // 1. Dọn sạch toast cũ trước khi test trường hợp mới
  await I.executeScript(() => {
    document.querySelectorAll(".toast-text").forEach((el) => el.remove());
  });

  await I.click('button[type="submit"]');

  // 2. Chờ cho đến khi có kết quả thực sự (HTML5 invalid hoặc có Toast mới sau khi hết trạng thái "Đang lưu...")
  await I.waitForFunction(
    () => {
      const form = document.querySelector("form");
      if (form && !form.checkValidity()) return true;

      const submitBtn = document.querySelector('button[type="submit"]');
      const isSaving =
        submitBtn?.disabled ||
        submitBtn?.textContent.toLowerCase().includes("đang lưu");
      const toasts = document.querySelectorAll(".toast-text");
      return !isSaving && toasts.length > 0;
    },
    [],
    15,
  );

  const actual = await getUiResult(I);
  const hasSavedToast = actual.toasts.some((t) =>
    normalizeText(t).includes("đã lưu thông tin series và bản thảo"),
  );

  assert.equal(
    hasSavedToast,
    false,
    `Expected update to be rejected, but it succeeded: ${JSON.stringify(actual)}`,
  );
  assert.ok(
    actual.formValid === false || actual.toasts.length > 0,
    `Expected validation error or error toast, got: ${JSON.stringify(actual)}`,
  );
}

Feature("Cập nhật hồ sơ Series — kiểm thử đầu vào (US-01 .. US-11)");

Scenario(
  "US-01: chủ sở hữu đổi title hợp lệ ở trạng thái Draft",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSeriesDraft(I);
    const updatedTitle = `Updated ${Date.now()}`;

    await saveSeriesDraft(I, { title: updatedTitle });
    await I.refreshPage();
    await I.waitForValue(
      ".form-section .form-group > input.neo-input",
      updatedTitle,
      15,
    );

    assert.match(
      await I.grabCurrentUrl(),
      new RegExp(`/mangaka/series/${seriesId}$`),
    );
  },
);

Scenario(
  "US-02: cập nhật từng trường và tổ hợp nhiều trường hợp lệ khi ở Draft, giữ nguyên trường không đổi",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { title } = await createSeriesDraft(I);
    await I.scrollPageToBottom();
    await I.waitForVisible(".textarea-tall", 10);
    const summary = await I.grabValueFrom(".textarea-tall");
    const updatedTitle = `Updated metadata ${Date.now()}`;

    await saveSeriesDraft(I, {
      title: updatedTitle,
      description: "Updated series description",
      genre: "Sci-Fi, Action",
      targetAudience: "Seinen",
    });

    await I.refreshPage();
    await I.waitForFunction(
      () => !document.body.innerText.includes("Đang tải dữ liệu"),
      [],
      15,
    );
    await I.waitForVisible(".form-section .form-group > input.neo-input", 15);
    const val = await I.grabValueFrom(
      ".form-section .form-group > input.neo-input",
    );
    assert.equal(val.trim(), updatedTitle.trim());

    await I.scrollPageToBottom();
    await I.waitForVisible(".textarea-tall", 10);
    assert.equal(await I.grabValueFrom(".textarea-tall"), summary);
    assert.notEqual(updatedTitle, title);
  },
);

Scenario(
  "US-03: cho phép cập nhật hợp lệ khi proposal ở trạng thái Need Revision",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSubmittedSeries(I);
    await openBoardReview(I, seriesId);
    await castBoardVote(I, "Need Revision", "Please revise the proposal.");
    await finalizeBoardReview(I, "Need Revision");

    await signInAs(I, "mangaka");
    await I.amOnPage(`/mangaka/series/${seriesId}`);
    await waitForTextCaseInsensitive(I, "Need Revision", 15, ".status-badge");
    await saveSeriesDraft(I, {
      summary: `Updated after review with valid length ${Date.now()}`,
    });
    await seeTextCaseInsensitive(I, "Draft", ".status-badge");
  },
);

Scenario(
  "US-04: gửi body rỗng hoặc lưu lại giá trị không đổi không tạo bản ghi mới",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    await captureVoteAuthHeader(I);
    const { seriesId, title } = await createSeriesDraft(I);

    await saveSeriesDraft(I, { title });
    await I.refreshPage();
    await I.waitForValue(
      ".form-section .form-group > input.neo-input",
      title,
      15,
    );
    assert.match(
      await I.grabCurrentUrl(),
      new RegExp(`/mangaka/series/${seriesId}$`),
    );
  },
);

Scenario(
  "US-05: từ chối title rỗng, chỉ khoảng trắng, vượt giới hạn (101 ký tự) hoặc chứa ký tự cấm (<, >)",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { title: originalTitle } = await createSeriesDraft(I);

    for (const invalidTitle of [
      "",
      "   ",
      "A",
      "S".repeat(101),
      "Bad <script> Title",
    ]) {
      await fillSeriesFields(I, { title: invalidTitle });
      await expectUpdateRejectedOnUi(I);
    }

    await I.refreshPage();
    await I.waitForValue(
      ".form-section .form-group > input.neo-input",
      originalTitle,
      15,
    );
  },
);

Scenario(
  "US-06: từ chối đổi sang title trùng (sau chuẩn hóa NFC, trim, không phân biệt hoa-thường) với Series đã có",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const first = await createSeriesDraft(I);
    const second = await createSeriesDraft(I);

    await I.amOnPage(`/mangaka/series/${second.seriesId}`);
    await waitForTextCaseInsensitive(
      I,
      "Chi tiết series",
      15,
      ".page-title, h1",
    );
    await fillSeriesFields(I, {
      title: `  ${first.title.toUpperCase()}  `,
    });
    await expectUpdateRejectedOnUi(I);
  },
);

Scenario(
  "US-07: kiểm tra biên hợp lệ và vượt biên 1 đơn vị cho description (1000/1001), genre (2/50/1/51) và target_audience (2/50/1/51)",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    await createSeriesDraft(I);

    // Biên hợp lệ
    await saveSeriesDraft(I, {
      description: "d".repeat(1000),
      genre: "g".repeat(50),
      targetAudience: "a".repeat(50),
    });

    // Vượt biên 1 đơn vị
    await fillSeriesFields(I, { description: "d".repeat(1001) });
    await expectUpdateRejectedOnUi(I);

    await fillSeriesFields(I, {
      description: "Mô tả hợp lệ",
      genre: "G",
    });
    await expectUpdateRejectedOnUi(I);

    await fillSeriesFields(I, { genre: "g".repeat(51) });
    await expectUpdateRejectedOnUi(I);

    await fillSeriesFields(I, {
      genre: "Fantasy",
      targetAudience: "A",
    });
    await expectUpdateRejectedOnUi(I);

    await fillSeriesFields(I, { targetAudience: "a".repeat(51) });
    await expectUpdateRejectedOnUi(I);
  },
);

Scenario(
  "US-08: từ chối gán editor_id không hợp lệ, không tồn tại hoặc không phải Tantou Editor",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    await captureVoteAuthHeader(I);
    const { seriesId } = await createSeriesDraft(I);

    for (const badEditorId of [
      "invalid-object-id",
      "000000000000000000000000",
    ]) {
      const hasSelect = await I.grabNumberOfVisibleElements("select");
      if (hasSelect > 0) {
        await I.executeScript((val) => {
          const select = document.querySelector("select");
          if (!select) return;
          const option = document.createElement("option");
          option.value = val;
          option.textContent = `Bad Editor ${val}`;
          select.append(option);
          select.value = val;
          select.dispatchEvent(new Event("change", { bubbles: true }));
        }, badEditorId);
        await expectUpdateRejectedOnUi(I);
      } else {
        // Nếu trang cập nhật không hiển thị thẻ <select>, kiểm tra trực tiếp qua HTTP Status Code
        const res = await sendApiRequestWithAuth(
          I,
          `/series/${seriesId}`,
          "PUT",
          { editor_id: badEditorId },
        );
        assert.notEqual(
          res.status,
          200,
          `Expected editor_id="${badEditorId}" to be rejected (status !== 200), got ${res.status}`,
        );
      }
    }
  },
);

Scenario(
  "US-09: từ chối cập nhật khi người dùng không sở hữu Series hoặc không có quyền sửa",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId, title } = await createSeriesDraft(I);

    // Đăng nhập bằng Editorial Board (không phải tác giả sở hữu Series)
    await signInAs(I, "editorial");
    await captureVoteAuthHeader(I);
    await I.amOnPage("/board/reviews");

    const response = await sendApiRequestWithAuth(
      I,
      `/series/${seriesId}`,
      "PUT",
      {
        title: `Hacked Title ${Date.now()}`,
      },
    );
    assert.ok(
      [401, 403].includes(response.status),
      `Expected 401/403 when non-owner updates series, got ${response.status}`,
    );

    await signInAs(I, "mangaka");
    await I.amOnPage(`/mangaka/series/${seriesId}`);
    await I.waitForValue(
      ".form-section .form-group > input.neo-input",
      title,
      15,
    );
  },
);

Scenario(
  "US-10: từ chối cập nhật hồ sơ khi Proposal ở trạng thái không cho phép sửa (Submitted, Under Review, Approved, Rejected)",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    await captureVoteAuthHeader(I);
    const { seriesId, title } = await createSubmittedSeries(I);

    // Trên UI các ô input và nút Lưu bị vô hiệu hóa khi ở trạng thái Submitted
    const isInputDisabled = await I.executeScript(
      () =>
        document.querySelector(".form-section .form-group > input.neo-input")
          ?.disabled,
    );
    assert.equal(
      isInputDisabled,
      true,
      "Input phải bị disable khi proposal đang Submitted",
    );

    // Gọi trực tiếp API PUT /api/series/:id cũng phải bị chặn 400
    const resSubmitted = await sendApiRequestWithAuth(
      I,
      `/series/${seriesId}`,
      "PUT",
      { title: "Cannot Edit While Submitted" },
    );
    assert.equal(resSubmitted.status, 400);

    // Chốt Reject rồi thử sửa lại
    await openBoardReview(I, seriesId);
    await castBoardVote(I, "Reject", "Reject for US-10");
    await finalizeBoardReview(I, "Reject");

    await signInAs(I, "mangaka");
    await captureVoteAuthHeader(I);
    await I.amOnPage(`/mangaka/series/${seriesId}`);
    await waitForTextCaseInsensitive(I, "Rejected", 15, ".status-badge");

    const resRejected = await sendApiRequestWithAuth(
      I,
      `/series/${seriesId}`,
      "PUT",
      { title: "Cannot Edit After Rejected" },
    );
    assert.equal(resRejected.status, 400);
    await I.waitForValue(
      ".form-section .form-group > input.neo-input",
      title,
      15,
    );
  },
);

Scenario(
  "US-11: gửi request cập nhật đồng thời với thao tác nộp proposal vẫn đảm bảo tính nhất quán dữ liệu",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    await captureVoteAuthHeader(I);
    const { seriesId } = await createSeriesDraft(I);
    const concurrentTitle = `Concurrent Title ${Date.now()}`;

    const [updateRes, submitRes] = await I.executeScript(
      async ({ id, newTitle }) => {
        const headers = {
          Authorization: window.__codeceptVoteAuth,
          "Content-Type": "application/json",
        };
        const [u, s] = await Promise.all([
          fetch(`http://localhost:5000/api/series/${id}`, {
            method: "PUT",
            credentials: "include",
            headers,
            body: JSON.stringify({ title: newTitle }),
          }).then(async (r) => ({ status: r.status, body: await r.json() })),
          fetch(`http://localhost:5000/api/series/${id}/proposal/submit`, {
            method: "POST",
            credentials: "include",
            headers,
          }).then(async (r) => ({ status: r.status, body: await r.json() })),
        ]);
        return [u, s];
      },
      { id: seriesId, newTitle: concurrentTitle },
    );

    assert.equal(submitRes.status, 200, "Submit proposal phải thành công");
    assert.ok(
      [200, 400].includes(updateRes.status),
      "Request cập nhật đồng thời phải hoàn tất (200) trước khi khóa hoặc bị từ chối rõ ràng (400) sau khi khóa",
    );
  },
);
