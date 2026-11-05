import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  createSeries,
  fillSeriesFields,
  getUiResult,
  signInAs,
} from "./series_test_helpers.js";

const maxCoverSize = 10 * 1024 * 1024;
const tinyPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/pWQAAAAASUVORK5CYII=",
  "base64",
);

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createPngAtSize(size) {
  const payloadSize = size - tinyPng.length;
  const ancillaryPayloadSize = payloadSize - 12;
  assert.ok(ancillaryPayloadSize >= 8, "PNG size is too small for a text chunk");

  const chunk = Buffer.alloc(ancillaryPayloadSize + 12, 0x78);
  chunk.writeUInt32BE(ancillaryPayloadSize, 0);
  chunk.write("tEXt", 4, "ascii");
  chunk.write("Comment", 8, "ascii");
  chunk[15] = 0;
  chunk.writeUInt32BE(crc32(chunk.subarray(4, chunk.length - 4)), chunk.length - 4);

  return Buffer.concat([
    tinyPng.subarray(0, tinyPng.length - 12),
    chunk,
    tinyPng.subarray(tinyPng.length - 12),
  ]);
}

async function createSeriesAndOpenDetails(I) {
  await I.amOnPage("/mangaka/series/new");
  if ((await I.grabCurrentUrl()).includes("/login")) {
    await signInAs(I, "mangaka");
  }
  return createSeries(I, {
    title: `Proposal ${Date.now()} ${Math.random().toString(36).slice(2, 8)}`,
    genre: "",
    targetAudience: "",
  });
}

async function saveProposal(I, { summary, characters = "", artStyle = "" }) {
  await fillSeriesFields(I, { summary, characters, artStyle });
  await I.click('button[type="submit"]');
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
  const outputDirectory = path.join(process.cwd(), "codecept_output");
  fs.mkdirSync(outputDirectory, { recursive: true });
  const directory = fs.mkdtempSync(
    path.join(outputDirectory, "kcpm-codecept-"),
  );
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

  const file = createTempFile("png", maxCoverSize, createPngAtSize(maxCoverSize));
  try {
    await I.scrollPageToBottom();
    await I.waitForVisible(".neo-file-input", 15);
    await I.executeScript(() => {
      const originalFetch = window.fetch.bind(window);
      window.__codeceptCoverUploadResponse = null;
      window.fetch = async (...args) => {
        const response = await originalFetch(...args);
        const requestUrl =
          typeof args[0] === "string" ? args[0] : args[0]?.url || "";
        if (requestUrl.includes("/proposal/upload-cover")) {
          window.__codeceptCoverUploadResponse = {
            status: response.status,
            body: await response.clone().text(),
          };
        }
        return response;
      };
    });
    await I.attachFile(
      ".neo-file-input",
      path.relative(process.cwd(), file.filePath),
    );
    await I.waitForFunction(
      () => window.__codeceptCoverUploadResponse !== null,
      [],
      60,
    );
    const uploadResponse = await I.executeScript(
      () => window.__codeceptCoverUploadResponse,
    );
    assert.ok(uploadResponse, "Expected the backend upload endpoint to respond");
    const uploadBody = JSON.parse(uploadResponse.body);
    console.log(
      `[ACTUAL BACKEND RESULT] status=${uploadResponse.status}; body=${JSON.stringify(uploadBody)}`,
    );
    assert.equal(uploadResponse.status, 200);
    assert.equal(uploadBody.message, "Upload cover thành công");
    await expectToast(I, "Upload ảnh bìa thành công!");
    assert.equal(fs.statSync(file.filePath).size, maxCoverSize);
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
    await I.scrollPageToBottom();
    await I.waitForVisible(".neo-file-input", 15);
    await I.attachFile(
      ".neo-file-input",
      path.relative(process.cwd(), file.filePath),
    );
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
    await I.scrollPageToBottom();
    await I.waitForVisible(".neo-file-input", 15);
    await I.executeScript(() => {
      const originalFetch = window.fetch.bind(window);
      window.__codeceptCoverUploadResponse = null;
      window.fetch = async (...args) => {
        const response = await originalFetch(...args);
        const requestUrl =
          typeof args[0] === "string" ? args[0] : args[0]?.url || "";
        if (requestUrl.includes("/proposal/upload-cover")) {
          window.__codeceptCoverUploadResponse = {
            status: response.status,
            body: await response.clone().text(),
          };
        }
        return response;
      };
    });
    await I.attachFile(
      ".neo-file-input",
      path.relative(process.cwd(), file.filePath),
    );
    await I.waitForFunction(
      () => window.__codeceptCoverUploadResponse !== null,
      [],
      60,
    );
    const uploadResponse = await I.executeScript(
      () => window.__codeceptCoverUploadResponse,
    );
    assert.ok(uploadResponse, "Expected the backend upload endpoint to respond");
    const uploadBody = JSON.parse(uploadResponse.body);
    console.log(
      `[ACTUAL BACKEND RESULT] status=${uploadResponse.status}; body=${JSON.stringify(uploadBody)}`,
    );
    assert.equal(uploadResponse.status, 413);
    assert.equal(
      uploadBody.error?.message,
      "File vượt quá dung lượng tối đa cho phép.",
    );
    await expectToast(I, "File vượt quá dung lượng tối đa cho phép.");
  } finally {
    file.cleanup();
  }
});
