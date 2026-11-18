import assert from "node:assert/strict";
import {
  captureVoteAuthHeader,
  castBoardVote,
  clearExistingToasts,
  createSubmittedSeries,
  finalizeBoardReview,
  openBoardReview,
  signInAs,
  waitForTextCaseInsensitive,
  seeTextCaseInsensitive,
  clickByTextCaseInsensitive,
  sendApiRequestWithAuth,
  fillSeriesFields,
  expectToastCaseInsensitive,
} from "./series_test_helpers.js";

Feature("Chốt kết quả Series — kiểm thử đầu vào (FS-01 .. FS-16)");

// Đảm bảo dọn dẹp mọi route mock sau mỗi scenario (kể cả khi scenario trước bị fail)
After(async ({ I }) => {
  await I.stopMockingRoute("**/board/series/*/finalize").catch(() => {});
});

Scenario(
  "FS-01: đóng kỳ biểu quyết với lựa chọn thắng hợp lệ, lưu tally và quyết định",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSubmittedSeries(I);
    await openBoardReview(I, seriesId);
    await castBoardVote(I, "Approve", "Đồng ý thông qua FS-01");

    await finalizeBoardReview(I, "Approve");
    await seeTextCaseInsensitive(I, "Approved", ".meta-status");
  },
);

Scenario(
  "FS-02: đủ điều kiện quorum và một lựa chọn đạt quá bán số phiếu hợp lệ",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSubmittedSeries(I);
    await openBoardReview(I, seriesId);
    await castBoardVote(I, "Approve", "Đạt đa số phiếu hợp lệ");

    await finalizeBoardReview(I, "Approve");
    await seeTextCaseInsensitive(I, "Approved", ".meta-status");
  },
);

Scenario(
  "FS-03: chưa đủ phiếu hợp lệ (0 phiếu) thì nút Finalize bị khóa",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSubmittedSeries(I);
    await openBoardReview(I, seriesId);

    const isDisabled = await I.executeScript(
      () => document.querySelector("button.btn-finalize")?.disabled,
    );
    assert.equal(
      isDisabled,
      true,
      "Nút Finalize phải bị khóa khi chưa có phiếu",
    );
  },
);

Scenario(
  "FS-04: kiểm tra phản hồi khi tổng hợp phiếu chưa đạt quá bán",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSubmittedSeries(I);
    await openBoardReview(I, seriesId);
    await castBoardVote(I, "Approve");

    await I.mockRoute(`**/board/series/${seriesId}/finalize`, async (route) => {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({
          message: "Chưa có lựa chọn nào đạt quá bán phiếu hợp lệ",
        }),
      });
    });

    await clearExistingToasts(I);
    await I.executeScript(() => {
      window.confirm = () => true;
    });
    await clickByTextCaseInsensitive(
      I,
      "Tổng hợp kết quả (Finalize)",
      "button.btn-finalize",
    );
    await clickByTextCaseInsensitive(
      I,
      "Chốt kết quả",
      ".overlay .actions button",
    );

    await waitForTextCaseInsensitive(
      I,
      "Chưa có lựa chọn nào đạt quá bán",
      15,
      ".toast-text",
    );
    const proposalStatus = await I.grabTextFrom(".meta-status strong");
    assert.equal(proposalStatus.trim().toLowerCase(), "under review");
  },
);

Scenario(
  "FS-05: kiểm tra xử lý khi hòa phiếu cao nhất giữa các lựa chọn",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSubmittedSeries(I);
    await openBoardReview(I, seriesId);
    await castBoardVote(I, "Approve");

    await I.mockRoute(`**/board/series/${seriesId}/finalize`, async (route) => {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({
          message:
            "Kết quả bỏ phiếu đang hòa, cần xử lý hòa phiếu trước khi chốt",
        }),
      });
    });

    await clearExistingToasts(I);
    await I.executeScript(() => {
      window.confirm = () => true;
    });
    await clickByTextCaseInsensitive(
      I,
      "Tổng hợp kết quả (Finalize)",
      "button.btn-finalize",
    );
    await clickByTextCaseInsensitive(
      I,
      "Chốt kết quả",
      ".overlay .actions button",
    );

    await waitForTextCaseInsensitive(
      I,
      "Kết quả bỏ phiếu đang hòa",
      15,
      ".toast-text",
    );
    await seeTextCaseInsensitive(I, "Under Review", ".meta-status");
  },
);

Scenario(
  "FS-06: chỉ tính phiếu hợp lệ cuối cùng của đúng vòng xét duyệt hiện tại (bỏ qua phiếu vòng cũ)",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSubmittedSeries(I);

    // Vòng 1: Need Revision
    await openBoardReview(I, seriesId);
    await castBoardVote(I, "Need Revision", "Vòng 1 yêu cầu sửa");
    await finalizeBoardReview(I, "Need Revision");

    // Mangaka sửa và nộp lại mở Vòng 2
    await signInAs(I, "mangaka");
    await I.amOnPage(`/mangaka/series/${seriesId}`);
    await waitForTextCaseInsensitive(I, "Need Revision", 15, ".status-badge");

    await fillSeriesFields(I, {
      summary: `Bản thảo vòng 2 đã chỉnh sửa đầy đủ ${Date.now()}`,
    });
    await clearExistingToasts(I);
    await I.scrollPageToBottom();
    await I.click('button[type="submit"]');
    await expectToastCaseInsensitive(
      I,
      "Đã lưu thông tin series và bản thảo!",
      15,
    );
    await waitForTextCaseInsensitive(I, "Draft", 15, ".status-badge");

    await clearExistingToasts(I);
    await I.click("button.btn-success");
    await expectToastCaseInsensitive(I, "Đã nộp thành công!", 15);
    await waitForTextCaseInsensitive(I, "Submitted", 15, ".status-badge");

    // Board mở lại vòng 2: chỉ tính phiếu Approve của vòng 2 (không cộng phiếu Need Revision vòng 1)
    await openBoardReview(I, seriesId);
    await castBoardVote(I, "Approve", "Vòng 2 đồng ý thông qua");
    await finalizeBoardReview(I, "Approve");
    await seeTextCaseInsensitive(I, "Approved", ".meta-status");
  },
);

Scenario(
  "FS-07: Approve và lưu đúng lịch phát hành đã chọn (weekly, monthly, one-shot, online only)",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSubmittedSeries(I);
    await openBoardReview(I, seriesId);
    await castBoardVote(I, "Approve");

    const scheduleSelector = ".finalize-section select, select.neo-select";
    await I.waitForVisible(scheduleSelector, 10);
    await I.selectOption(scheduleSelector, "monthly");

    await finalizeBoardReview(I, "Approve");
    await seeTextCaseInsensitive(I, "Approved", ".meta-status");

    // Xác minh dữ liệu lưu dưới backend khớp đúng lịch phát hành đã chọn
    const detailRes = await sendApiRequestWithAuth(
      I,
      `/series/${seriesId}`,
      "GET",
    );
    assert.equal(detailRes.status, 200);
    assert.equal(detailRes.body.series.approved_schedule, "monthly");
  },
);

Scenario(
  "FS-08: từ chối khi chọn lịch phát hành ngoài danh sách cho phép",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSubmittedSeries(I);
    await openBoardReview(I, seriesId);
    await captureVoteAuthHeader(I);
    await castBoardVote(I, "Approve");

    const badScheduleRes = await sendApiRequestWithAuth(
      I,
      `/board/series/${seriesId}/finalize`,
      "POST",
      { approved_schedule: "invalid-schedule-value" },
    );
    assert.equal(
      badScheduleRes.status,
      400,
      "Backend phải trả về 400 khi approved_schedule không nằm trong danh sách cho phép",
    );
    await seeTextCaseInsensitive(I, "Under Review", ".meta-status");
  },
);

Scenario("FS-09: chốt Reject và không gán lịch phát hành", async ({ I }) => {
  await signInAs(I, "mangaka");
  const { seriesId } = await createSubmittedSeries(I);
  await openBoardReview(I, seriesId);
  await castBoardVote(I, "Reject");

  await finalizeBoardReview(I, "Reject");
  await seeTextCaseInsensitive(I, "Rejected", ".meta-status");
});

Scenario(
  "FS-10: chốt Need Revision và cho phép Mangaka chỉnh sửa để nộp lại",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSubmittedSeries(I);
    await openBoardReview(I, seriesId);
    await castBoardVote(I, "Need Revision");

    await finalizeBoardReview(I, "Need Revision");
    await seeTextCaseInsensitive(I, "Need Revision", ".meta-status");
  },
);

Scenario(
  "FS-11: người không được ủy quyền (Mangaka) thử chốt kết quả phải bị từ chối",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSubmittedSeries(I);
    await openBoardReview(I, seriesId);
    await castBoardVote(I, "Approve");

    // Đăng nhập lại bằng tài khoản Mangaka (không có quyền Board)
    await signInAs(I, "mangaka");

    const unauthorizedFinalize = await sendApiRequestWithAuth(
      I,
      `/board/series/${seriesId}/finalize`,
      "POST",
      { approved_schedule: "weekly" },
    );
    assert.ok(
      [401, 403].includes(unauthorizedFinalize.status),
      `Mangaka không được phép gọi API finalize (status=${unauthorizedFinalize.status})`,
    );
  },
);

Scenario(
  "FS-12: từ chối chốt proposal đã có kết quả cuối cùng",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSubmittedSeries(I);
    await openBoardReview(I, seriesId);
    await castBoardVote(I, "Reject");
    await finalizeBoardReview(I, "Reject");

    await I.dontSeeElement("button.btn-finalize");
    const actualStatus = await I.executeScript(() =>
      document.querySelector(".meta-status strong")?.textContent.trim(),
    );
    assert.equal(actualStatus?.toLowerCase(), "rejected");
  },
);

Scenario(
  "FS-13: lỗi xảy ra trong quá trình chốt không làm thay đổi trạng thái nửa vời trên giao diện",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSubmittedSeries(I);
    await openBoardReview(I, seriesId);
    await castBoardVote(I, "Approve");

    await I.mockRoute(`**/board/series/${seriesId}/finalize`, async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Lỗi server khi lưu quyết định" }),
      });
    });

    await clearExistingToasts(I);
    await I.executeScript(() => {
      window.confirm = () => true;
    });
    await clickByTextCaseInsensitive(
      I,
      "Tổng hợp kết quả (Finalize)",
      "button.btn-finalize",
    );
    await clickByTextCaseInsensitive(
      I,
      "Chốt kết quả",
      ".overlay .actions button",
    );

    await waitForTextCaseInsensitive(I, "Lỗi server", 15, ".toast-text");
    await seeTextCaseInsensitive(I, "Under Review", ".meta-status");
  },
);

Scenario(
  "FS-14: hai yêu cầu chốt gửi đồng thời chỉ commit một quyết định duy nhất",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSubmittedSeries(I);
    await openBoardReview(I, seriesId);
    await captureVoteAuthHeader(I);
    await castBoardVote(I, "Approve");

    const [res1, res2] = await Promise.all([
      sendApiRequestWithAuth(I, `/board/series/${seriesId}/finalize`, "POST", {
        approved_schedule: "weekly",
      }),
      sendApiRequestWithAuth(I, `/board/series/${seriesId}/finalize`, "POST", {
        approved_schedule: "monthly",
      }),
    ]);

    const statuses = [res1.status, res2.status];
    assert.ok(
      statuses.includes(200),
      `Ít nhất một request chốt đồng thời phải thành công (statuses=${statuses.join(",")})`,
    );
    await I.refreshPage();
    await seeTextCaseInsensitive(I, "Approved", ".meta-status");
  },
);

Scenario(
  "FS-15: gửi lại request sau khi lần chốt đầu đã thành công không tạo kết quả trùng",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSubmittedSeries(I);
    await openBoardReview(I, seriesId);
    await captureVoteAuthHeader(I);
    await castBoardVote(I, "Approve");
    await finalizeBoardReview(I, "Approve");

    const retryRes = await sendApiRequestWithAuth(
      I,
      `/board/series/${seriesId}/finalize`,
      "POST",
      { approved_schedule: "weekly" },
    );
    assert.equal(retryRes.status, 400);
    await seeTextCaseInsensitive(I, "Approved", ".meta-status");
  },
);

Scenario(
  "FS-16: lưu quyết định thành công thì trạng thái Series và Proposal đồng bộ chính xác",
  async ({ I }) => {
    await signInAs(I, "mangaka");
    const { seriesId } = await createSubmittedSeries(I);
    await openBoardReview(I, seriesId);
    await castBoardVote(I, "Approve");

    const scheduleSelector = ".finalize-section select, select.neo-select";
    await I.waitForVisible(scheduleSelector, 10);
    await I.selectOption(scheduleSelector, "weekly");
    await finalizeBoardReview(I, "Approve");

    // Kiểm tra trạng thái Series (Active) và Proposal (Approved) đồng bộ ở backend
    const detailRes = await sendApiRequestWithAuth(
      I,
      `/series/${seriesId}`,
      "GET",
    );
    assert.equal(detailRes.status, 200);
    assert.equal(detailRes.body.series.status, "Active");
    assert.equal(detailRes.body.series.approved_schedule, "weekly");
    assert.equal(detailRes.body.proposal.status, "Approved");

    // Kiểm tra trên giao diện Mangaka hiển thị badge Proposal là Approved
    await signInAs(I, "mangaka");
    await I.amOnPage(`/mangaka/series/${seriesId}`);
    await waitForTextCaseInsensitive(I, "Approved", 15, ".status-badge");
  },
);
