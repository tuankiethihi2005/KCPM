import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const mangakaEmail =  "magakatest123@gmail.com";
const mangakaPassword = "password123";
const maxCoverSize = 10 * 1024 * 1024;
const tinyPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/pWQAAAAASUVORK5CYII=",
  "base64",
);

async function createSeriesAndOpenDetails(I) {
  await I.amOnPage("/mangaka/series/new");
  if ((await I.grabCurrentUrl()).includes("/login")) {
    await I.fillField("#email", mangakaEmail);
    await I.fillField("#password", mangakaPassword);
    await I.click('button[type="submit"]');
    await I.waitForElement('a[href="/mangaka/series/new"]', 15);
    await I.amOnPage("/mangaka/series/new");
  }
  await I.waitForText("Tạo series mới", 10);
  await I.fillField(
    ".form-section .form-group > input.neo-input",
    `Proposal ${Date.now()} ${Math.random().toString(36).slice(2, 8)}`,
  );
  await I.click('button[type="submit"]');
  await I.waitForText("Chi tiết series", 15);
}

async function saveProposal(I, { summary, characters = "", artStyle = "" }) {
  await I.fillField(".textarea-tall", summary);
  await I.fillField(".proposal-section .grid-2-cols .form-group:nth-child(1) textarea", characters);
  await I.fillField(".proposal-section .grid-2-cols .form-group:nth-child(2) textarea", artStyle);
  await I.click('button[type="submit"]');
}

async function getUiResult(I) {
  return I.executeScript(() => ({
    path: window.location.pathname,
    formValid: document.querySelector("form")?.checkValidity() ?? null,
    validationMessage: document.querySelector(":invalid")?.validationMessage || "",
    toasts: Array.from(document.querySelectorAll(".toast-text")).map((toast) =>
      toast.textContent.trim(),
    ),
  }));
}

async function expectProposalSaved(I) {
  await I.waitForText("Đã lưu thông tin series và bản thảo!", 15);
  const actual = await getUiResult(I);
  console.log(`[ACTUAL RESULT] expected=proposal saved; actual=${JSON.stringify(actual)}`);
  assert.ok(
    actual.toasts.includes("Đã lưu thông tin series và bản thảo!"),
    "Expected the proposal-saved success toast",
  );
}

async function expectProposalRejected(I) {
  await I.wait(0.5);
  const actual = await getUiResult(I);
  console.log(`[ACTUAL RESULT] expected=proposal rejected; actual=${JSON.stringify(actual)}`);
  assert.ok(
    actual.formValid === false || actual.toasts.some((message) => message.length > 0),
    "Expected browser validation or an application response toast",
  );
  assert.ok(
    !actual.toasts.includes("Đã lưu thông tin series và bản thảo!"),
    "Expected the invalid proposal not to be saved",
  );
}

async function expectToast(I, expectedMessage) {
  await I.waitForText(expectedMessage, 15);
  const actual = await getUiResult(I);
  console.log(`[ACTUAL RESULT] expectedToast=${JSON.stringify(expectedMessage)}; actual=${JSON.stringify(actual)}`);
  assert.ok(
    actual.toasts.includes(expectedMessage),
    `Expected toast "${expectedMessage}" in actual UI result`,
  );
}

function createTempFile(extension, size, content = Buffer.alloc(0)) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "kcpm-codecept-"));
  const filePath = path.join(directory, `cover.${extension}`);
  const data = Buffer.alloc(size);
  content.copy(data, 0, 0, Math.min(content.length, data.length));
  fs.writeFileSync(filePath, data);
  return {
    filePath,
    cleanup: () => fs.rmSync(directory, { recursive: true, force: true }),
  };
}

Feature("Proposal Series — kiểm thử đầu vào");

Scenario("PR-01: lưu summary tối thiểu, không bắt buộc characters/art_style/cover", async ({ I }) => {
  await createSeriesAndOpenDetails(I);
  await saveProposal(I, { summary: "s".repeat(20) });
  await expectProposalSaved(I);
});

Scenario("PR-02: chấp nhận dữ liệu văn bản tối đa và ảnh bìa đúng 10 MB", async ({ I }) => {
  await createSeriesAndOpenDetails(I);
  await saveProposal(I, {
    summary: "s".repeat(2000),
    characters: "c".repeat(2000),
    artStyle: "a".repeat(500),
  });
  await expectProposalSaved(I);

  const file = createTempFile("png", maxCoverSize, tinyPng);
  let uploadedBytes = 0;
  try {
    await I.mockRoute("**/proposal/upload-cover", async (route) => {
      uploadedBytes = route.request().postDataBuffer()?.length || 0;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          message: "Upload cover thành công",
          cover_image: "https://example.test/cover.png",
        }),
      });
    });
    await I.attachFile("input.neo-file-input", file.filePath);
    await expectToast(I, "Upload ảnh bìa thành công!");
    assert.equal(fs.statSync(file.filePath).size, maxCoverSize);
    assert.ok(uploadedBytes > maxCoverSize, "Upload request should contain the 10 MB file");
    await I.stopMockingRoute("**/proposal/upload-cover");
  } finally {
    file.cleanup();
  }
});

Scenario("PR-03: từ chối summary để trống", async ({ I }) => {
  await createSeriesAndOpenDetails(I);
  await saveProposal(I, { summary: "" });
  await expectProposalRejected(I);
});

Scenario("PR-04: từ chối summary chỉ có khoảng trắng", async ({ I }) => {
  await createSeriesAndOpenDetails(I);
  await saveProposal(I, { summary: "     " });
  await expectProposalRejected(I);
});

Scenario("PR-05: từ chối summary dài 19 ký tự", async ({ I }) => {
  await createSeriesAndOpenDetails(I);
  await saveProposal(I, { summary: "s".repeat(19) });
  await expectProposalRejected(I);
});

Scenario("PR-06: từ chối summary dài 2001 ký tự", async ({ I }) => {
  await createSeriesAndOpenDetails(I);
  await saveProposal(I, { summary: "s".repeat(2001) });
  await expectProposalRejected(I);
});

Scenario("PR-07: từ chối characters dài 2001 ký tự", async ({ I }) => {
  await createSeriesAndOpenDetails(I);
  await saveProposal(I, { summary: "s".repeat(20), characters: "c".repeat(2001) });
  await expectProposalRejected(I);
});

Scenario("PR-08: từ chối art_style dài 501 ký tự", async ({ I }) => {
  await createSeriesAndOpenDetails(I);
  await saveProposal(I, { summary: "s".repeat(20), artStyle: "a".repeat(501) });
  await expectProposalRejected(I);
});

Scenario("PR-09: từ chối file bìa không phải ảnh", async ({ I }) => {
  await createSeriesAndOpenDetails(I);
  await saveProposal(I, { summary: "s".repeat(20) });
  await expectProposalSaved(I);

  const file = createTempFile("txt", 16, Buffer.from("not an image"));
  try {
    await I.attachFile("input.neo-file-input", file.filePath);
    await expectToast(I, "File cover chỉ hỗ trợ: các định dạng ảnh phổ biến.");
  } finally {
    file.cleanup();
  }
});

Scenario("PR-10: từ chối ảnh bìa lớn hơn 10 MB", async ({ I }) => {
  await createSeriesAndOpenDetails(I);
  await saveProposal(I, { summary: "s".repeat(20) });
  await expectProposalSaved(I);

  const file = createTempFile("png", maxCoverSize + 1, tinyPng);
  try {
    await I.attachFile("input.neo-file-input", file.filePath);
    await expectToast(I, "File vượt quá dung lượng tối đa cho phép.");
  } finally {
    file.cleanup();
  }
});
