import assert from "node:assert/strict";
import {
  captureVoteAuthHeader,
  castBoardVote,
  createSeriesDraft,
  createSubmittedSeries,
  finalizeBoardReview,
  openBoardReview,
  sendVoteRequest,
  signInAs,
  waitForVoteDisplayed,
  waitForTextCaseInsensitive,
  dontSeeTextCaseInsensitive,
  clickByTextCaseInsensitive,
  expectToastCaseInsensitive,
  normalizeText,
} from "./series_test_helpers.js";

Feature("Editorial Board bỏ phiếu — kiểm thử đầu vào (EBV-01 .. EBV-11)");

Scenario("EBV-01: thành viên đủ quyền bỏ phiếu Approve", async ({ I }) => {
  await signInAs(I, "mangaka");
  const { seriesId } = await createSubmittedSeries(I);
  await openBoardReview(I, seriesId);

  await I.fillField(".neo-textarea", "Đồng ý xét duyệt");
  await captureVoteAuthHeader(I);
  await castBoardVote(I, "Approve");
  const actualVote = await I.executeScript(() =>
    document.querySelector(".vote-badge")?.textContent.trim(),
  );
  assert.equal(normalizeText(actualVote), "approve");
  const actualComment = await I.executeScript(() =>
    document.querySelector(".vote-comment")?.textContent.trim(),
  );
  assert.equal(actualComment, ": Đồng ý xét duyệt");
});

Scenario(
  "EBV-02: ghi nhận lựa chọn Reject hoặc Need Revision",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSubmittedSeries(I);
    await openBoardReview(I, seriesId);

    // 1. Bỏ phiếu lần đầu là Reject
    await castBoardVote(I, "Reject");

    // 2. Bấm nút "Đổi phiếu" để mở lại các lựa chọn
    await clickByTextCaseInsensitive(I, "Đổi phiếu", "button.btn-revise");

    await I.executeScript(() => {
      window.confirm = () => true;
    });

    // 3. Thay vì waitForElement với class sai, ta dùng trực tiếp clickByTextCaseInsensitive để bấm "Need Revision"
    await clickByTextCaseInsensitive(I, "Need Revision", "button");

    await waitForVoteDisplayed(I, "Need Revision");
    const actualVotes = await I.executeScript(() =>
      Array.from(document.querySelectorAll(".vote-badge")).map((badge) =>
        badge.textContent.trim().toLocaleLowerCase("vi-VN"),
      ),
    );
    assert.deepEqual(actualVotes, ["need revision"]);
  },
);

Scenario(
  "EBV-03: lưu comment Unicode gắn với phiếu và không thực thi nội dung markup",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSubmittedSeries(I);
    await openBoardReview(I, seriesId);
    const comment = "Cần chỉnh sửa nhân vật — 日本語 <b>nội dung</b>";

    await I.fillField(".neo-textarea", comment);
    await castBoardVote(I, "Need Revision");
    const commentText = await I.executeScript(() =>
      document.querySelector(".vote-comment")?.textContent.trim(),
    );
    assert.equal(commentText, `: ${comment}`);
    assert.equal(
      await I.grabNumberOfVisibleElements(".vote-comment b"),
      0,
      "Comment markup should be rendered as text, not an HTML element",
    );
  },
);

Scenario("EBV-04: bỏ phiếu không kèm comment", async ({ I }) => {
  await signInAs(I, "mangaka");
  const { seriesId } = await createSubmittedSeries(I);
  await openBoardReview(I, seriesId);

  await castBoardVote(I, "Approve");
  await I.seeNumberOfElements(".vote-item", 1);
  await I.dontSeeElement(".vote-comment");
});

Scenario(
  "EBV-05: từ chối vote thiếu, không thuộc danh sách cho phép, sai kiểu dữ liệu hoặc comment vượt 2000 ký tự",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSubmittedSeries(I);
    await openBoardReview(I, seriesId);
    await captureVoteAuthHeader(I);
    await castBoardVote(I, "Approve");

    const missingVote = await sendVoteRequest(I, seriesId, {});
    const unsupportedVote = await sendVoteRequest(I, seriesId, {
      vote: "Not a vote",
    });
    const wrongTypeVote = await sendVoteRequest(I, seriesId, {
      vote: 12345,
    });
    assert.equal(missingVote.status, 400);
    assert.equal(unsupportedVote.status, 400);
    assert.equal(wrongTypeVote.status, 400);
    await I.seeNumberOfElements(".vote-item", 1);
    await waitForVoteDisplayed(I, "Approve");
  },
);

Scenario(
  "EBV-06: cùng cử tri gửi hai request bỏ phiếu đồng thời chỉ tính một phiếu duy nhất",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSubmittedSeries(I);
    await openBoardReview(I, seriesId);
    await captureVoteAuthHeader(I);
    await castBoardVote(I, "Reject");

    const [req1, req2] = await Promise.all([
      sendVoteRequest(I, seriesId, { vote: "Reject", comment: "Lần 1" }),
      sendVoteRequest(I, seriesId, { vote: "Reject", comment: "Lần 2" }),
    ]);
    assert.ok([200, 201].includes(req1.status));
    assert.ok([200, 201].includes(req2.status));

    await I.refreshPage();
    await waitForTextCaseInsensitive(I, "Bỏ phiếu", 15, ".section-title, h2");
    await I.seeNumberOfElements(".vote-item", 1);
    await waitForVoteDisplayed(I, "Reject");
  },
);

Scenario("EBV-07: đổi lựa chọn khi kỳ biểu quyết còn mở", async ({ I }) => {
  await signInAs(I, "mangaka");
  const { seriesId } = await createSubmittedSeries(I);
  await openBoardReview(I, seriesId);
  await castBoardVote(I, "Reject");

  await clickByTextCaseInsensitive(I, "Đổi phiếu", "button.btn-revise");
  await I.executeScript(() => {
    window.confirm = () => true;
  });
  await clickByTextCaseInsensitive(I, "Approve", ".vote-actions button");
  await expectToastCaseInsensitive(I, "Cập nhật phiếu bầu thành công", 15);
  await waitForVoteDisplayed(I, "Approve");
  const actualVotes = await I.executeScript(() =>
    Array.from(document.querySelectorAll(".vote-badge")).map((badge) =>
      badge.textContent.trim().toLocaleLowerCase("vi-VN"),
    ),
  );
  assert.deepEqual(actualVotes, ["approve"]);
});

Scenario(
  "EBV-08: từ chối đổi phiếu sau khi kỳ biểu quyết đã đóng / kết quả đã chốt",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSubmittedSeries(I);
    await openBoardReview(I, seriesId);
    await captureVoteAuthHeader(I);
    await castBoardVote(I, "Reject");
    await finalizeBoardReview(I, "Reject");

    await I.dontSeeElement(".vote-actions");
    await dontSeeTextCaseInsensitive(I, "Đổi phiếu", "button");

    // Gọi trực tiếp API đổi phiếu sau khi chốt cũng phải bị từ chối 400
    const lateVote = await sendVoteRequest(I, seriesId, { vote: "Approve" });
    assert.equal(lateVote.status, 400);

    const actualStatus = await I.executeScript(() =>
      document.querySelector(".meta-status strong")?.textContent.trim(),
    );
    assert.equal(normalizeText(actualStatus), "rejected");
  },
);

Scenario(
  "EBV-09: người không đủ tư cách (Mangaka) không được truy cập trang bỏ phiếu hoặc gửi API vote",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    await captureVoteAuthHeader(I);
    const { seriesId } = await createSubmittedSeries(I);

    await I.amOnPage("/board/reviews");
    await I.waitForFunction(() => window.location.pathname === "/", null, 15);
    await dontSeeTextCaseInsensitive(I, "Duyệt Series Mới", "h1");

    const forbiddenVote = await sendVoteRequest(I, seriesId, { vote: "Approve" });
    assert.ok(
      [401, 403].includes(forbiddenVote.status),
      `Mangaka gửi API vote phải bị chặn 401/403, nhận được: ${forbiddenVote.status}`,
    );
  },
);

Scenario(
  "EBV-10: từ chối bỏ phiếu cho proposal không tồn tại hoặc chưa được nộp (Draft)",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId: draftSeriesId } = await createSeriesDraft(I);

    await signInAs(I, "editorial");
    await captureVoteAuthHeader(I);
    await I.amOnPage("/board/series/000000000000000000000000");
    await waitForTextCaseInsensitive(
      I,
      "Không tìm thấy hồ sơ series.",
      15,
      ".empty-state, body",
    );

    // Thử bỏ phiếu cho Series còn ở trạng thái Draft
    const draftVoteRes = await sendVoteRequest(I, draftSeriesId, {
      vote: "Approve",
    });
    assert.equal(
      draftVoteRes.status,
      400,
      "Không được phép bỏ phiếu cho proposal chưa nộp (Draft)",
    );
  },
);

Scenario(
  "EBV-11: gửi lại cùng lựa chọn sau timeout giữ đúng một phiếu hiện hành",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSubmittedSeries(I);
    await openBoardReview(I, seriesId);
    await castBoardVote(I, "Approve");

    await clickByTextCaseInsensitive(I, "Đổi phiếu", "button.btn-revise");
    await I.executeScript(() => {
      window.confirm = () => true;
    });
    await clickByTextCaseInsensitive(I, "Approve", ".vote-actions button");
    await expectToastCaseInsensitive(I, "Cập nhật phiếu bầu thành công", 15);
    await waitForVoteDisplayed(I, "APPROVE");
    await I.seeNumberOfElements(".vote-item", 1);
  },
);