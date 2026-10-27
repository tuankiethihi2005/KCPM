import assert from "node:assert/strict";

const mangakaEmail = "magakatest123@gmail.com";
const mangakaPassword = "password123";

function uniqueTitleAtLength(length) {
  const suffix = Date.now().toString(36).slice(-Math.min(length, 8));
  return `${suffix}${"x".repeat(length - suffix.length)}`;
}

async function openCreateForm(I) {
  await I.amOnPage("/mangaka/series/new");
  if ((await I.grabCurrentUrl()).includes("/login")) {
    await I.fillField("#email", mangakaEmail);
    await I.fillField("#password", mangakaPassword);
    await I.click('button[type="submit"]');
    await I.waitForElement('a[href="/mangaka/series/new"]', 15);
    await I.amOnPage("/mangaka/series/new");
  }
  await I.waitForText("Tạo series mới", 10);
}

async function fillCreateForm(I, data) {
  if (data.title !== undefined) {
    await I.fillField(
      ".form-section .form-group > input.neo-input",
      data.title,
    );
  }
  if (data.description !== undefined) {
    await I.fillField(
      ".form-section .form-group > textarea.textarea-short",
      data.description,
    );
  }
  if (data.genre !== undefined) {
    await I.fillField(
      ".grid-2-cols .form-group:nth-child(1) input",
      data.genre,
    );
  }
  if (data.targetAudience !== undefined) {
    await I.fillField(
      ".grid-2-cols .form-group:nth-child(2) input",
      data.targetAudience,
    );
  }
}

async function getUiResult(I) {
  return I.executeScript(() => ({
    path: window.location.pathname,
    formValid: document.querySelector("form")?.checkValidity() ?? null,
    validationMessage:
      document.querySelector(":invalid")?.validationMessage || "",
    toasts: Array.from(document.querySelectorAll(".toast-text")).map((toast) =>
      toast.textContent.trim(),
    ),
  }));
}

async function expectCreateRejected(I) {
  await I.click('button[type="submit"]');
  await I.wait(0.5);
  const actual = await getUiResult(I);
  console.log(
    `[ACTUAL RESULT] expected=creation rejected; actual=${JSON.stringify(actual)}`,
  );
  assert.equal(
    actual.path,
    "/mangaka/series/new",
    "The form should remain open when creation is rejected",
  );
  assert.ok(
    actual.formValid === false || actual.toasts.length > 0,
    "Expected browser validation or an application error toast",
  );
}

async function expectCreateSucceeded(I) {
  await I.click('button[type="submit"]');
  await I.waitForText("Chi tiết series", 15);
  const actual = await getUiResult(I);
  console.log(
    `[ACTUAL RESULT] expected=creation succeeded; actual=${JSON.stringify(actual)}`,
  );
  assert.match(
    actual.path,
    /^\/mangaka\/series\/[^/]+$/,
    "Expected navigation to the created Series",
  );
}

Feature("Tạo Series — kiểm thử đầu vào");

Scenario(
  "CS-01: chấp nhận title tối thiểu và các trường tùy chọn để trống",
  async ({ I }) => {
    await openCreateForm(I);
    await fillCreateForm(I, { title: uniqueTitleAtLength(2) });
    await expectCreateSucceeded(I);
  },
);

Scenario("CS-02: chấp nhận dữ liệu hợp lệ ở biên tối đa", async ({ I }) => {
  await openCreateForm(I);
  await fillCreateForm(I, {
    title: uniqueTitleAtLength(100),
    description: "d".repeat(1000),
    genre: "g".repeat(50),
    targetAudience: "a".repeat(50),
  });
  await expectCreateSucceeded(I);
});

Scenario("CS-03: từ chối title để trống", async ({ I }) => {
  await openCreateForm(I);
  await expectCreateRejected(I);
});

Scenario("CS-04: từ chối title chỉ có khoảng trắng", async ({ I }) => {
  await openCreateForm(I);
  await fillCreateForm(I, { title: "   " });
  await expectCreateRejected(I);
});

Scenario("CS-05: từ chối title dài 1 ký tự", async ({ I }) => {
  await openCreateForm(I);
  await fillCreateForm(I, { title: "A" });
  await expectCreateRejected(I);
});

Scenario("CS-06: từ chối title dài 101 ký tự", async ({ I }) => {
  await openCreateForm(I);
  await fillCreateForm(I, { title: "S".repeat(101) });
  await expectCreateRejected(I);
});

Scenario("CS-07: từ chối title chứa ký tự markup bị cấm", async ({ I }) => {
  await openCreateForm(I);
  await fillCreateForm(I, { title: "Tên <b>Series</b>" });
  await expectCreateRejected(I);
});

Scenario(
  "CS-08: từ chối title trùng sau khi trim khoảng trắng",
  async ({ I }) => {
    const duplicateTitle = `Duplicate ${Date.now()}`;
    await openCreateForm(I);
    await fillCreateForm(I, { title: duplicateTitle });
    await expectCreateSucceeded(I);

    await I.amOnPage("/mangaka/series/new");
    await I.waitForText("Tạo series mới", 10);
    await fillCreateForm(I, { title: `  ${duplicateTitle}  ` });
    await expectCreateRejected(I);
  },
);

Scenario(
  "CS-09: chấp nhận title Unicode, chữ số và dấu câu cho phép",
  async ({ I }) => {
    await openCreateForm(I);
    await fillCreateForm(I, { title: `Truyện 2: Hành trình! ${Date.now()}` });
    await expectCreateSucceeded(I);
  },
);

Scenario("CS-10: từ chối description dài 1001 ký tự", async ({ I }) => {
  await openCreateForm(I);
  await fillCreateForm(I, {
    title: `Description ${Date.now()}`,
    description: "d".repeat(1001),
  });
  await expectCreateRejected(I);
});

Scenario("CS-11: từ chối genre dài 1 ký tự", async ({ I }) => {
  await openCreateForm(I);
  await fillCreateForm(I, { title: `Genre short ${Date.now()}`, genre: "A" });
  await expectCreateRejected(I);
});

Scenario("CS-12: từ chối genre dài 51 ký tự", async ({ I }) => {
  await openCreateForm(I);
  await fillCreateForm(I, {
    title: `Genre long ${Date.now()}`,
    genre: "g".repeat(51),
  });
  await expectCreateRejected(I);
});

Scenario("CS-13: từ chối target_audience dài 1 ký tự", async ({ I }) => {
  await openCreateForm(I);
  await fillCreateForm(I, {
    title: `Audience short ${Date.now()}`,
    targetAudience: "A",
  });
  await expectCreateRejected(I);
});

Scenario("CS-14: từ chối target_audience dài 51 ký tự", async ({ I }) => {
  await openCreateForm(I);
  await fillCreateForm(I, {
    title: `Audience long ${Date.now()}`,
    targetAudience: "a".repeat(51),
  });
  await expectCreateRejected(I);
});

Scenario("CS-15: từ chối editor_id không hợp lệ", async ({ I }) => {
  await openCreateForm(I);
  await fillCreateForm(I, { title: `Invalid editor ${Date.now()}` });
  await I.executeScript(() => {
    const select = document.querySelector("select.neo-input");
    const option = document.createElement("option");
    option.value = "not-an-object-id";
    option.textContent = "Invalid editor";
    select.append(option);
    select.value = option.value;
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await expectCreateRejected(I);
});

Scenario("CS-16: từ chối editor_id không tồn tại", async ({ I }) => {
  await openCreateForm(I);
  await fillCreateForm(I, { title: `Unknown editor ${Date.now()}` });
  await I.executeScript(() => {
    const select = document.querySelector("select.neo-input");
    const option = document.createElement("option");
    option.value = "000000000000000000000000";
    option.textContent = "Unknown editor";
    select.append(option);
    select.value = option.value;
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await expectCreateRejected(I);
});
