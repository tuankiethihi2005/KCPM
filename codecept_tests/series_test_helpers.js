import assert from "node:assert/strict";

export const mangakaEmail = "magakatest123@gmail.com";
export const mangakaPassword = "password123";
export const editorialEmail = "editorialboard@example.com";
export const editorialPassword = "password123";

/**
 * Chuẩn hóa chuỗi để so sánh không phân biệt chữ HOA / chữ thường
 */
export function normalizeText(str = "") {
  return String(str).trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * Chờ text xuất hiện trên trang không phân biệt chữ HOA / thường
 * (Truyền mảng [selector, target] theo đúng chuẩn CodeceptJS waitForFunction)
 */
export async function waitForTextCaseInsensitive(
  I,
  expectedText,
  timeout = 15,
  selector = ".toast-text, .meta-status",
) {
  const target = normalizeText(expectedText);
  await I.waitForFunction(
    (args) => {
      const sel = Array.isArray(args) ? args[0] : args?.sel || "body";
      const exp = Array.isArray(args) ? args[1] : args?.exp || "";
      const normalize = (s = "") =>
        String(s).trim().replace(/\s+/g, " ").toLowerCase();
      const elements = Array.from(document.querySelectorAll(sel));
      return elements.some(
        (el) =>
          normalize(el.innerText || "").includes(exp) ||
          normalize(el.textContent || "").includes(exp),
      );
    },
    [selector, target],
    timeout,
  );
}

/**
 * Kiểm tra text hiển thị trên UI không phân biệt chữ HOA / thường
 */
export async function seeTextCaseInsensitive(
  I,
  expectedText,
  selector = "body",
) {
  await waitForTextCaseInsensitive(I, expectedText, 10, selector);
}

/**
 * Kiểm tra text KHÔNG hiển thị trên UI (không phân biệt chữ HOA / thường)
 */
export async function dontSeeTextCaseInsensitive(
  I,
  unexpectedText,
  selector = "body",
) {
  const target = normalizeText(unexpectedText);
  const found = await I.executeScript(
    (args) => {
      const sel = Array.isArray(args) ? args[0] : args?.sel || "body";
      const exp = Array.isArray(args) ? args[1] : args?.exp || "";
      const normalize = (s = "") =>
        String(s).trim().replace(/\s+/g, " ").toLowerCase();
      const elements = Array.from(document.querySelectorAll(sel));
      return elements.some(
        (el) =>
          normalize(el.innerText || "").includes(exp) ||
          normalize(el.textContent || "").includes(exp),
      );
    },
    [selector, target],
  );
  assert.equal(
    found,
    false,
    `Expected NOT to see text "${unexpectedText}" (case-insensitive) inside "${selector}"`,
  );
}

/**
 * Lấy trạng thái UI và danh sách Toast hiện tại
 */
export async function getUiResult(I) {
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

/**
 * Đợi và kiểm tra thông báo Toast không phân biệt chữ HOA / thường
 */
export async function expectToastCaseInsensitive(
  I,
  expectedMessage,
  timeout = 15,
) {
  await waitForTextCaseInsensitive(
    I,
    expectedMessage,
    timeout,
    ".toast-text, body",
  );
}

/**
 * Click vào phần tử theo nhãn văn bản không phân biệt chữ HOA / thường
 */
export async function clickByTextCaseInsensitive(
  I,
  text,
  selector = "button, a, label",
  timeout = 10,
) {
  const target = normalizeText(text);

  // 1. Chờ phần tử xuất hiện trên DOM, hiển thị và không bị disabled
  await I.waitForFunction(
    (args) => {
      const [sel, exp] = Array.isArray(args) ? args : [args.sel, args.exp];
      const normalize = (s = "") =>
        String(s).trim().replace(/\s+/g, " ").toLowerCase();
      const nodes = Array.from(document.querySelectorAll(sel));
      return nodes.some((node) => {
        const isVisible = node.offsetParent !== null;
        const isEnabled = !node.disabled;
        const textMatch =
          normalize(node.innerText || "") === exp ||
          normalize(node.textContent || "") === exp ||
          normalize(node.innerText || "").includes(exp) ||
          normalize(node.textContent || "").includes(exp);
        return isVisible && isEnabled && textMatch;
      });
    },
    [selector, target],
    timeout,
  );

  // 2. Thực hiện click an toàn
  const clicked = await I.executeScript(
    (args) => {
      const [sel, exp] = Array.isArray(args) ? args : [args.sel, args.exp];
      const normalize = (s = "") =>
        String(s).trim().replace(/\s+/g, " ").toLowerCase();
      const nodes = Array.from(document.querySelectorAll(sel)).filter(
        (n) => n.offsetParent !== null && !n.disabled,
      );
      const exactNode = nodes.find(
        (node) =>
          normalize(node.innerText || "") === exp ||
          normalize(node.textContent || "") === exp,
      );
      const partialNode = nodes.find(
        (node) =>
          normalize(node.innerText || "").includes(exp) ||
          normalize(node.textContent || "").includes(exp),
      );
      const targetNode = exactNode || partialNode;
      if (targetNode) {
        targetNode.scrollIntoView({ block: "center" });
        targetNode.click();
        return true;
      }
      return false;
    },
    [selector, target],
  );

  assert.ok(
    clicked,
    `Could not click element matching "${text}" in "${selector}"`,
  );
}

/**
 * Đăng nhập theo role (giữ nguyên cơ chế gốc đã chạy ổn định trên Playwright)
 */
export async function signInAs(I, role) {
  await I.amOnPage("/");
  await I.waitForFunction(
    () =>
      window.location.pathname === "/login" ||
      Array.from(document.querySelectorAll("button")).some((button) =>
        button.textContent.toLowerCase().includes("đăng xuất"),
      ),
    [],
    15,
  );
  const logoutButtonCount = await I.grabNumberOfVisibleElements(
    'button:has-text("Đăng xuất")',
  );
  if (logoutButtonCount > 0) {
    await I.click('button:has-text("Đăng xuất")');
    await I.waitForElement("#email", 15);
  } else {
    const currentPath = await I.executeScript(() => window.location.pathname);
    if (currentPath !== "/login") {
      await I.amOnPage("/login");
      await I.waitForElement("#email", 15);
    }
  }

  await I.fillField(
    "#email",
    role === "mangaka" ? mangakaEmail : editorialEmail,
  );
  await I.fillField(
    "#password",
    role === "mangaka" ? mangakaPassword : editorialPassword,
  );
  await I.click('button[type="submit"]');
  await I.waitForFunction(
    () =>
      window.location.pathname !== "/login" ||
      Array.from(document.querySelectorAll(".toast-text")).some(
        (toast) => !toast.textContent.toLowerCase().includes("thành công"),
      ),
    [],
    15,
  );
  const currentPath = await I.executeScript(() => window.location.pathname);
  if (currentPath === "/login") {
    const errorMessage = await I.grabTextFrom(".toast-text");
    throw new Error(
      `Could not sign in as ${role} (${role === "mangaka" ? mangakaEmail : editorialEmail}): ${errorMessage}`,
    );
  }
  await I.waitForElement('button:has-text("Đăng xuất")', 15);
}

// Thay thế phần đầu của hàm fillSeriesFields trong series_test_helpers.js:
export async function fillSeriesFields(I, data = {}) {
  await I.waitForFunction(
    () => !document.body.innerText.includes("Đang tải dữ liệu"),
    [],
    15,
  );
  await I.waitForVisible(".form-section .form-group > input.neo-input", 10);

  // Hàm phụ trợ gán giá trị trực tiếp chuẩn React (không bao giờ bị timeout 5s khi chuỗi dài 1000-2000 ký tự)
  const setReactInputValue = async (selector, value, isTextarea = false) => {
    await I.waitForVisible(selector, 10);
    await I.executeScript(
      (args) => {
        const [sel, val, textareaMode] = Array.isArray(args)
          ? args
          : [args.sel, args.val, args.textareaMode];
        const el = document.querySelector(sel);
        if (!el) return;
        const proto = textareaMode
          ? window.HTMLTextAreaElement.prototype
          : window.HTMLInputElement.prototype;
        const nativeSetter = Object.getOwnPropertyDescriptor(
          proto,
          "value",
        ).set;
        nativeSetter.call(el, val);
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
      },
      [selector, value, isTextarea],
    );
  };

  if (data.title !== undefined) {
    await setReactInputValue(
      ".form-section .form-group > input.neo-input",
      data.title,
      false,
    );
  }

  if (data.description !== undefined) {
    await setReactInputValue(
      ".form-section .form-group > textarea.textarea-short",
      data.description,
      true,
    );
  }

  if (data.genre !== undefined) {
    await setReactInputValue(
      ".form-section .grid-2-cols .form-group:nth-child(1) input",
      data.genre,
      false,
    );
  }

  if (data.targetAudience !== undefined) {
    await setReactInputValue(
      ".form-section .grid-2-cols .form-group:nth-child(2) input",
      data.targetAudience,
      false,
    );
  }

  if (data.summary !== undefined) {
    const summaryField = ".proposal-section textarea.textarea-tall";
    await I.scrollPageToBottom();
    await I.waitForVisible(summaryField, 15);

    // Set giá trị trực tiếp qua native setter để React 18/19 luôn bắt được sự kiện onChange ngay lập tức
    await I.executeScript(
      (args) => {
        const [sel, val] = Array.isArray(args) ? args : [args.sel, args.val];
        const textarea = document.querySelector(sel);
        if (!textarea) return;
        const nativeSetter = Object.getOwnPropertyDescriptor(
          window.HTMLTextAreaElement.prototype,
          "value",
        ).set;
        nativeSetter.call(textarea, val);
        textarea.dispatchEvent(new Event("input", { bubbles: true }));
        textarea.dispatchEvent(new Event("change", { bubbles: true }));
      },
      [summaryField, data.summary],
    );

    await I.waitForFunction(
      (args) => {
        const [sel, expectedVal] = Array.isArray(args)
          ? args
          : [args.sel, args.expectedVal];
        const el = document.querySelector(sel);
        return el && el.value === expectedVal;
      },
      [summaryField, data.summary],
      10,
    );
  }
  if (data.characters !== undefined) {
    await I.fillField(
      ".proposal-section .grid-2-cols .form-group:nth-child(1) textarea",
      data.characters,
    );
  }
  if (data.artStyle !== undefined) {
    await I.fillField(
      ".proposal-section .grid-2-cols .form-group:nth-child(2) textarea",
      data.artStyle,
    );
  }
}

export async function createSeries(I, overrides = {}) {
  const title =
    overrides.title ??
    `Codecept ${Date.now()} ${Math.random().toString(36).slice(2, 7)}`;
  await I.amOnPage("/mangaka/series/new");
  await waitForTextCaseInsensitive(I, "Tạo series mới", 10, ".page-title, h1");
  await fillSeriesFields(I, {
    title,
    description: overrides.description,
    genre: overrides.genre ?? "Fantasy",
    targetAudience: overrides.targetAudience ?? "Young adult",
  });
  await I.click('button[type="submit"]');
  await waitForTextCaseInsensitive(I, "Chi tiết series", 15, ".page-title, h1");
  await I.waitForValue(
    ".form-section .form-group > input.neo-input",
    title.trim(),
    15,
  );
  await I.waitForFunction(
    () =>
      !Array.from(document.querySelectorAll(".toast-text")).some((toast) =>
        toast.textContent.toLowerCase().includes("tạo series thành công"),
      ),
    [],
    15,
  );
  await I.waitForVisible(".proposal-section textarea.textarea-tall", 15);

  const currentUrl = await I.grabCurrentUrl();
  const seriesId = currentUrl.match(/\/mangaka\/series\/([^/]+)$/)?.[1];
  if (!seriesId) {
    throw new Error(`Could not read the created series ID from ${currentUrl}`);
  }

  return { seriesId, title: title.trim() };
}

export async function createSeriesDraft(I, overrides = {}) {
  const result = await createSeries(I, overrides);
  await fillSeriesFields(I, {
    summary: overrides.summary ?? `Proposal summary for ${result.title}`,
    characters: overrides.characters,
    artStyle: overrides.artStyle,
  });
  await I.scrollPageToBottom();
  await I.click("button[type='submit'].btn-primary");
  await expectToastCaseInsensitive(
    I,
    "Đã lưu thông tin series và bản thảo!",
    15,
  );
  return result;
}

export async function saveSeriesDraft(I, data) {
  await fillSeriesFields(I, data);
  await I.scrollPageToBottom();
  await I.click("button[type='submit'].btn-primary");
  await expectToastCaseInsensitive(
    I,
    "Đã lưu thông tin series và bản thảo!",
    15,
  );
}

export async function submitProposal(I) {
  await I.scrollPageToBottom();
  await I.waitForElement("button.btn-success", 15);
  await I.click("button.btn-success");
  await expectToastCaseInsensitive(I, "Đã nộp thành công!", 15);
}

export async function createSubmittedSeries(I) {
  const result = await createSeriesDraft(I);
  await submitProposal(I);
  return result;
}

export async function openBoardReview(I, seriesId) {
  await signInAs(I, "editorial");
  await I.amOnPage(`/board/series/${seriesId}`);
  await waitForTextCaseInsensitive(I, "Bỏ phiếu", 15, ".section-title, h2");
}

export async function castBoardVote(I, vote, comment = "") {
  if (comment) {
    await I.fillField(".neo-textarea", comment);
  }
  await I.executeScript(() => {
    window.confirm = () => true;
  });
  await clickByTextCaseInsensitive(I, vote, ".vote-actions button");
  await I.waitForFunction(
    () => document.querySelectorAll(".vote-item").length >= 1,
    [],
    15,
  );
  await waitForVoteDisplayed(I, vote);
}

export async function captureVoteAuthHeader(I) {
  await I.executeScript(() => {
    if (window.__fetchHooked) return;
    const fetchWithContext = window.fetch.bind(window);
    window.__codeceptVoteAuth = null;
    window.__fetchHooked = true;
    window.fetch = (input, init = {}) => {
      const headers = new Headers(init.headers || {});
      window.__codeceptVoteAuth =
        headers.get("Authorization") || window.__codeceptVoteAuth;
      return fetchWithContext(input, init);
    };
  });
}

export async function sendApiRequestWithAuth(
  I,
  path,
  method = "POST",
  body = undefined,
) {
  return I.executeScript(
    async (args) => {
      const [reqPath, reqMethod, reqBody] = Array.isArray(args)
        ? args
        : [args.path, args.method, args.body];
      const headers = {
        ...(window.__codeceptVoteAuth
          ? { Authorization: window.__codeceptVoteAuth }
          : {}),
      };
      if (reqBody !== undefined) {
        headers["Content-Type"] = "application/json";
      }
      const response = await fetch(`http://localhost:5000/api${reqPath}`, {
        method: reqMethod,
        credentials: "include",
        headers,
        body: reqBody !== undefined ? JSON.stringify(reqBody) : undefined,
      });
      let json = null;
      try {
        json = await response.json();
      } catch (_) {}
      return { status: response.status, body: json };
    },
    [path, method, body],
  );
}

export async function sendVoteRequest(I, seriesId, body) {
  return sendApiRequestWithAuth(
    I,
    `/board/series/${seriesId}/vote`,
    "POST",
    body,
  );
}

export async function waitForVoteDisplayed(I, vote) {
  await I.waitForFunction(
    (expectedVotes) => {
      const expectedVote = (
        Array.isArray(expectedVotes) ? expectedVotes[0] : expectedVotes
      )
        .trim()
        .toLowerCase();
      return Array.from(document.querySelectorAll(".vote-badge")).some(
        (el) => el.textContent.trim().toLowerCase() === expectedVote,
      );
    },
    [vote],
    15,
  );
}

export async function finalizeBoardReview(I, expectedDecision) {
  await I.executeScript(() => {
    window.confirm = () => true;
  });
  await clickByTextCaseInsensitive(
    I,
    "Tổng hợp kết quả (Finalize)",
    "button.btn-finalize",
  );
  await waitForTextCaseInsensitive(
    I,
    `Kết quả: ${expectedDecision}`,
    15,
    ".toast-text, body",
  );
  const expectedStatus =
    expectedDecision === "Reject"
      ? "Rejected"
      : expectedDecision === "Approve"
        ? "Approved"
        : expectedDecision;
  await I.waitForFunction(
    (expectedStatuses) => {
      const target = (
        Array.isArray(expectedStatuses) ? expectedStatuses[0] : expectedStatuses
      ).toLowerCase();
      return (
        document
          .querySelector(".meta-status strong")
          ?.textContent.trim()
          .toLowerCase() === target
      );
    },
    [expectedStatus],
    15,
  );
}

/**
 * Xóa các thông báo Toast cũ trên DOM trước khi thực hiện thao tác mới
 * giúp tránh đọc nhầm Toast của bước trước đó.
 */
export async function clearExistingToasts(I) {
  await I.executeScript(() => {
    document.querySelectorAll(".toast-text").forEach((el) => el.remove());
  });
}

/**
 * Chờ cho đến khi form bị chặn bởi HTML5 validation HOẶC quá trình gọi API kết thúc và có Toast phản hồi
 */
export async function waitForFormSubmissionSettled(I, timeout = 15) {
  await I.waitForFunction(
    () => {
      const form = document.querySelector("form");
      if (form && !form.checkValidity()) {
        return true; // Bị chặn ngay ở trình duyệt bởi HTML5 validation
      }
      const submitBtn = document.querySelector('button[type="submit"]');
      const isStillSaving =
        submitBtn &&
        (submitBtn.disabled ||
          submitBtn.textContent.toLowerCase().includes("đang lưu"));
      const hasToast = document.querySelectorAll(".toast-text").length > 0;
      return !isStillSaving && hasToast;
    },
    [],
    timeout,
  );
}
