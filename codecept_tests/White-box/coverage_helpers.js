import assert from "node:assert/strict";
import {
  refreshAccessToken,
  sendApiRequestWithAuth,
  signInAs,
} from "../series_test_helpers.js";

export { signInAs };

export async function signInAsAdmin(I) {
  const logoutCount = await I.grabNumberOfVisibleElements(
    'button:has-text("Đăng xuất")',
  );
  if (logoutCount > 0) {
    await I.click('button:has-text("Đăng xuất")');
  }

  await I.amOnPage("/login");
  await I.waitForElement("#email", 15);
  await I.fillField(
    "#email",
    process.env.SEED_AUTH_EMAIL || "admin@example.com",
  );
  await I.fillField(
    "#password",
    process.env.SEED_AUTH_PASSWORD || "password123",
  );
  await I.click('button[type="submit"]');
  await I.waitForFunction(() => window.location.pathname !== "/login", [], 15);
}

export function uniqueSeriesPayload(overrides = {}) {
  return {
    title: `Series ${Date.now()} ${Math.random().toString(36).slice(2, 8)}`,
    ...overrides,
  };
}

export async function createSeriesViaApi(I, overrides = {}) {
  const payload = uniqueSeriesPayload(overrides);
  return sendApiRequestWithAuth(I, "/series", "POST", payload);
}

export async function getEditorId(I) {
  const res = await sendApiRequestWithAuth(I, "/series/editors", "GET");
  assert.equal(
    res.status,
    200,
    `Không lấy được danh sách Tantou Editor: ${JSON.stringify(res.body)}`,
  );
  const editors = res.body?.editors || [];
  assert.ok(editors.length > 0, "Cần seed ít nhất một Tantou Editor");
  return String(editors[0]._id || editors[0].id);
}

export async function getNonEditorUserId(I) {
  const token = await refreshAccessToken(I);
  const payloadPart = token.split(".")[1];
  if (payloadPart) {
    try {
      const decoded = JSON.parse(
        Buffer.from(payloadPart, "base64url").toString("utf8"),
      );
      const candidateId =
        decoded.id || decoded._id || decoded.userId || decoded.sub;
      if (candidateId && /^[0-9a-fA-F]{24}$/.test(String(candidateId))) {
        return String(candidateId);
      }
    } catch (_) {}
  }

  const adminLogin = await I.sendPostRequest("/api/auth/login", {
    email: process.env.SEED_AUTH_EMAIL || "admin@example.com",
    password: process.env.SEED_AUTH_PASSWORD || "password123",
  });
  assert.equal(adminLogin.status, 200, "Đăng nhập Admin fallback thất bại");

  const usersRes = await I.sendGetRequest("/api/users", {
    Authorization: `Bearer ${adminLogin.data.accessToken}`,
  });
  assert.equal(usersRes.status, 200, "Không lấy được danh sách users");

  const users =
    usersRes.data?.users || usersRes.data?.data || usersRes.data || [];
  const nonEditor = users.find((u) => u.role !== "Tantou Editor");
  assert.ok(nonEditor, "Không tìm thấy user có role khác Tantou Editor");
  return String(nonEditor._id || nonEditor.id);
}

const tinyPngBase64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/pWQAAAAASUVORK5CYII=";

export async function createSeriesWithDraftProposal(I) {
  await signInAs(I, "mangaka");
  const res = await createSeriesViaApi(I, {
    description: "Mô tả ngắn cho series kiểm thử white-box",
    genre: "Action",
    target_audience: "Shounen",
    summary: `Draft proposal summary ${Date.now()} ${Math.random().toString(36).slice(2, 7)}`,
    characters: "Nhân vật chính",
    art_style: "Manga",
  });
  assert.equal(
    res.status,
    201,
    `Tạo series kèm draft proposal thất bại: ${JSON.stringify(res.body)}`,
  );
  return String(res.body.series._id || res.body.series.id);
}

export async function createSeriesWithSubmittedProposal(I) {
  const seriesId = await createSeriesWithDraftProposal(I);
  const submitRes = await sendApiRequestWithAuth(
    I,
    `/series/${seriesId}/proposal/submit`,
    "POST",
  );
  assert.equal(
    submitRes.status,
    200,
    `Nộp proposal thất bại: ${JSON.stringify(submitRes.body)}`,
  );
  return seriesId;
}

export async function createSeriesWithNeedRevisionProposal(I) {
  const seriesId = await createSeriesWithSubmittedProposal(I);

  await signInAs(I, "editorial");
  const voteRes = await sendApiRequestWithAuth(
    I,
    `/board/series/${seriesId}/vote`,
    "POST",
    {
      vote: "Need Revision",
      comment: "Yêu cầu chỉnh sửa cho white-box coverage",
    },
  );
  assert.ok(
    [200, 201].includes(voteRes.status),
    `Bỏ phiếu Need Revision thất bại: ${JSON.stringify(voteRes.body)}`,
  );

  const finalizeRes = await sendApiRequestWithAuth(
    I,
    `/board/series/${seriesId}/finalize`,
    "POST",
    {},
  );
  assert.equal(
    finalizeRes.status,
    200,
    `Chốt Need Revision thất bại: ${JSON.stringify(finalizeRes.body)}`,
  );
  assert.equal(finalizeRes.body.proposal.status, "Need Revision");

  await signInAs(I, "mangaka");
  return seriesId;
}

export async function upsertProposalViaApi(I, seriesId, body = {}) {
  return sendApiRequestWithAuth(I, `/series/${seriesId}/proposal`, "PUT", body);
}

export async function uploadCoverViaApi(
  I,
  seriesId,
  { attachFile = true } = {},
) {
  const accessToken = await refreshAccessToken(I);
  return I.executeScript(
    async ({ id, token, shouldAttach, pngBase64 }) => {
      const formData = new FormData();
      if (shouldAttach) {
        const binary = atob(pngBase64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i += 1) {
          bytes[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: "image/png" });
        formData.append("cover", blob, "cover.png");
      }

      const response = await fetch(
        `http://localhost:5000/api/series/${id}/proposal/upload-cover`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );
      let json = null;
      try {
        json = await response.json();
      } catch (_) {}
      return { status: response.status, body: json };
    },
    {
      id: seriesId,
      token: accessToken,
      shouldAttach: attachFile,
      pngBase64: tinyPngBase64,
    },
  );
}
export async function createSeriesWithRejectedProposal(I) {
  const seriesId = await createSeriesWithSubmittedProposal(I);

  await signInAs(I, "editorial");
  const voteRes = await sendApiRequestWithAuth(
    I,
    `/board/series/${seriesId}/vote`,
    "POST",
    {
      vote: "Reject",
      comment: "Từ chối proposal cho white-box coverage",
    },
  );
  assert.ok(
    [200, 201].includes(voteRes.status),
    `Bỏ phiếu Reject thất bại: ${JSON.stringify(voteRes.body)}`,
  );

  const finalizeRes = await sendApiRequestWithAuth(
    I,
    `/board/series/${seriesId}/finalize`,
    "POST",
    {},
  );
  assert.equal(
    finalizeRes.status,
    200,
    `Chốt Reject thất bại: ${JSON.stringify(finalizeRes.body)}`,
  );
  assert.equal(finalizeRes.body.proposal.status, "Rejected");

  await signInAs(I, "mangaka");
  return seriesId;
}
