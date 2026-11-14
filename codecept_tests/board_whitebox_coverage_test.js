import assert from "node:assert/strict";

Feature("White-box API Coverage — Editorial Board & Series Controller");

/**
 * Danh sách tài khoản thử nghiệm theo vai trò
 */
const testCredentials = {
  editorial: [
    { email: "editorialboard@example.com", password: "password123" },
    { email: "board@example.com", password: "password123" },
    { email: "admin@example.com", password: "password123" },
  ],
  mangaka: [
    { email: "magakatest123@gmail.com", password: "password123" },
    { email: "mangaka@example.com", password: "password123" },
    { email: "aoi.hikari@example.com", password: "password123" },
  ],
};

/**
 * Đăng nhập và lấy JWT Access Token theo vai trò
 */
async function getAuthToken(I, role = "editorial") {
  const credentials = testCredentials[role] || testCredentials.editorial;
  for (const cred of credentials) {
    const res = await I.sendPostRequest("/api/auth/login", cred);
    if (res.status === 200 && res.data?.accessToken) {
      return res.data.accessToken;
    }
  }
  throw new Error(`Không thể xác thực vai trò: ${role}`);
}

/**
 * Tạo một Series ở trạng thái Draft (chưa nộp proposal)
 */
async function createDraftSeries(I, mangakaToken, suffix = "") {
  const headers = { Authorization: `Bearer ${mangakaToken}` };
  const timestamp = Date.now();
  const payload = {
    title: `Whitebox Series Draft ${timestamp}_${suffix}_${Math.random().toString(36).substring(7)}`,
    description: "Mô tả series dành riêng cho kiểm thử Whitebox Coverage độ dài hợp lệ",
    genre: "Action",
    target_audience: "Shounen",
    summary: "Bản tóm tắt proposal cho series kiểm thử coverage độ dài hợp lệ",
  };

  const res = await I.sendPostRequest("/api/series", payload, headers);
  I.seeResponseCodeIs(res.status, 201);
  assert.ok(res.data?.series?._id, "Series mới phải có ID");
  return res.data.series._id;
}

/**
 * Tạo một Series và nộp proposal sang trạng thái Submitted
 */
async function createSubmittedSeries(I, mangakaToken, suffix = "") {
  const seriesId = await createDraftSeries(I, mangakaToken, suffix);
  const headers = { Authorization: `Bearer ${mangakaToken}` };

  const submitRes = await I.sendPostRequest(
    `/api/series/${seriesId}/proposal/submit`,
    {},
    headers,
  );
  I.seeResponseCodeIs(submitRes.status, 200);
  return seriesId;
}

// ============================================================================
// 1. KIỂM THỬ ĐỘ PHỦ finalizeSeries.js (DÒNG 4-24)
// ============================================================================

Scenario(
  "WB-FIN-01: Chốt kết quả khi Series ID không tồn tại -> Expect 404 (dòng 18-24)",
  async ({ I }) => {
    const boardToken = await getAuthToken(I, "editorial");
    const boardHeaders = { Authorization: `Bearer ${boardToken}` };
    const nonExistentId = "507f1f77bcf86cd799439011";

    const res = await I.sendPostRequest(
      `/api/board/series/${nonExistentId}/finalize`,
      {},
      boardHeaders,
    );
    I.seeResponseCodeIs(res.status, 404);
    assert.equal(res.data?.message, "Không tìm thấy series");
  },
);

Scenario(
  "WB-FIN-02: Chốt kết quả khi Series chưa có phiếu bầu nào -> Expect 400 (dòng 18-24)",
  async ({ I }) => {
    const mangakaToken = await getAuthToken(I, "mangaka");
    const boardToken = await getAuthToken(I, "editorial");
    const boardHeaders = { Authorization: `Bearer ${boardToken}` };

    const seriesId = await createSubmittedSeries(I, mangakaToken, "no_votes");

    const res = await I.sendPostRequest(
      `/api/board/series/${seriesId}/finalize`,
      {},
      boardHeaders,
    );
    I.seeResponseCodeIs(res.status, 400);
    assert.equal(res.data?.message, "Chưa có phiếu bầu nào");
  },
);

Scenario(
  "WB-FIN-03: Chốt kết quả Reject không gửi kèm body lịch phát hành (SCRUM-94) -> Expect 200 OK (dòng 6-17)",
  async ({ I }) => {
    const mangakaToken = await getAuthToken(I, "mangaka");
    const boardToken = await getAuthToken(I, "editorial");
    const boardHeaders = { Authorization: `Bearer ${boardToken}` };

    const seriesId = await createSubmittedSeries(I, mangakaToken, "reject");

    // Bỏ phiếu Reject để kết quả tổng hợp là Reject
    const voteRes = await I.sendPostRequest(
      `/api/board/series/${seriesId}/vote`,
      { vote: "Reject", comment: "Từ chối hồ sơ WB-FIN-03" },
      boardHeaders,
    );
    I.seeResponseCodeIs(voteRes.status, 201);

    // Finalize không truyền body (req.body rỗng/undefined)
    const res = await I.sendPostRequest(
      `/api/board/series/${seriesId}/finalize`,
      undefined,
      boardHeaders,
    );
    I.seeResponseCodeIs(res.status, 200);
    assert.equal(res.data?.decision, "Reject");
    assert.equal(res.data?.proposal?.status, "Rejected");
    assert.equal(res.data?.series?.status, "Draft");
  },
);

Scenario(
  "WB-FIN-04: Chốt kết quả Need Revision không gửi kèm lịch phát hành (SCRUM-95) -> Expect 200 OK (dòng 6-17)",
  async ({ I }) => {
    const mangakaToken = await getAuthToken(I, "mangaka");
    const boardToken = await getAuthToken(I, "editorial");
    const boardHeaders = { Authorization: `Bearer ${boardToken}` };

    const seriesId = await createSubmittedSeries(I, mangakaToken, "need_rev");

    // Bỏ phiếu Need Revision
    const voteRes = await I.sendPostRequest(
      `/api/board/series/${seriesId}/vote`,
      { vote: "Need Revision", comment: "Cần chỉnh sửa hồ sơ WB-FIN-04" },
      boardHeaders,
    );
    I.seeResponseCodeIs(voteRes.status, 201);

    // Finalize không truyền body
    const res = await I.sendPostRequest(
      `/api/board/series/${seriesId}/finalize`,
      undefined,
      boardHeaders,
    );
    I.seeResponseCodeIs(res.status, 200);
    assert.equal(res.data?.decision, "Need Revision");
    assert.equal(res.data?.proposal?.status, "Need Revision");
  },
);

Scenario(
  "WB-FIN-05: Chốt kết quả Approve kèm body lịch phát hành hợp lệ -> Expect 200 OK (dòng 6-17)",
  async ({ I }) => {
    const mangakaToken = await getAuthToken(I, "mangaka");
    const boardToken = await getAuthToken(I, "editorial");
    const boardHeaders = { Authorization: `Bearer ${boardToken}` };

    const seriesId = await createSubmittedSeries(I, mangakaToken, "approve");

    // Bỏ phiếu Approve
    const voteRes = await I.sendPostRequest(
      `/api/board/series/${seriesId}/vote`,
      { vote: "Approve", comment: "Thông qua hồ sơ WB-FIN-05" },
      boardHeaders,
    );
    I.seeResponseCodeIs(voteRes.status, 201);

    // Finalize với approved_schedule
    const res = await I.sendPostRequest(
      `/api/board/series/${seriesId}/finalize`,
      { approved_schedule: "weekly" },
      boardHeaders,
    );
    I.seeResponseCodeIs(res.status, 200);
    assert.equal(res.data?.decision, "Approve");
    assert.equal(res.data?.series?.status, "Active");
    assert.equal(res.data?.series?.approved_schedule, "weekly");
    assert.equal(res.data?.proposal?.status, "Approved");
  },
);

Scenario(
  "WB-FIN-06: Chốt kết quả với Series ID sai định dạng -> Expect 500 (dòng 19-22 catch 500)",
  async ({ I }) => {
    const boardToken = await getAuthToken(I, "editorial");
    const boardHeaders = { Authorization: `Bearer ${boardToken}` };

    const res = await I.sendPostRequest(
      "/api/board/series/invalid_id_format/finalize",
      {},
      boardHeaders,
    );
    I.seeResponseCodeIs(res.status, 500);
    assert.equal(res.data?.error, "Lỗi server");
  },
);

// ============================================================================
// 2. KIỂM THỬ ĐỘ PHỦ castVote.js (DÒNG 9-86)
// ============================================================================

Scenario(
  "WB-VOTE-01: Bỏ phiếu thành công với role Editorial Board -> Expect 201 (dòng 67-83)",
  async ({ I }) => {
    const mangakaToken = await getAuthToken(I, "mangaka");
    const boardToken = await getAuthToken(I, "editorial");
    const boardHeaders = { Authorization: `Bearer ${boardToken}` };

    const seriesId = await createSubmittedSeries(I, mangakaToken, "vote_success");

    const res = await I.sendPostRequest(
      `/api/board/series/${seriesId}/vote`,
      { vote: "Approve", comment: "Ý kiến đồng ý WB-VOTE-01" },
      boardHeaders,
    );
    I.seeResponseCodeIs(res.status, 201);
    assert.equal(res.data?.message, "Bỏ phiếu thành công");
    assert.equal(res.data?.vote?.vote, "Approve");
  },
);

Scenario(
  "WB-VOTE-02: Bỏ phiếu cập nhật lại lựa chọn (existingVote) -> Expect 200 (dòng 57-65)",
  async ({ I }) => {
    const mangakaToken = await getAuthToken(I, "mangaka");
    const boardToken = await getAuthToken(I, "editorial");
    const boardHeaders = { Authorization: `Bearer ${boardToken}` };

    const seriesId = await createSubmittedSeries(I, mangakaToken, "vote_update");

    // Lần 1: Bỏ phiếu Approve
    await I.sendPostRequest(
      `/api/board/series/${seriesId}/vote`,
      { vote: "Approve", comment: "Phiếu ban đầu" },
      boardHeaders,
    );

    // Lần 2: Cập nhật sang Reject
    const res = await I.sendPostRequest(
      `/api/board/series/${seriesId}/vote`,
      { vote: "Reject", comment: "Đổi ý kiến sang Reject" },
      boardHeaders,
    );
    I.seeResponseCodeIs(res.status, 200);
    assert.equal(res.data?.message, "Cập nhật phiếu bầu thành công");
    assert.equal(res.data?.vote?.vote, "Reject");
  },
);

Scenario(
  "WB-VOTE-03: Bỏ phiếu thiếu trường vote bắt buộc -> Expect 400 (dòng 14-16)",
  async ({ I }) => {
    const mangakaToken = await getAuthToken(I, "mangaka");
    const boardToken = await getAuthToken(I, "editorial");
    const boardHeaders = { Authorization: `Bearer ${boardToken}` };

    const seriesId = await createSubmittedSeries(I, mangakaToken, "vote_missing");

    const res = await I.sendPostRequest(
      `/api/board/series/${seriesId}/vote`,
      { comment: "Chỉ có comment không có trường vote" },
      boardHeaders,
    );
    I.seeResponseCodeIs(res.status, 400);
    assert.equal(res.data?.message, "vote là bắt buộc");
  },
);

Scenario(
  "WB-VOTE-04: Bỏ phiếu với giá trị vote không thuộc enum -> Expect 400 (dòng 18-22)",
  async ({ I }) => {
    const mangakaToken = await getAuthToken(I, "mangaka");
    const boardToken = await getAuthToken(I, "editorial");
    const boardHeaders = { Authorization: `Bearer ${boardToken}` };

    const seriesId = await createSubmittedSeries(I, mangakaToken, "vote_invalid_enum");

    const res = await I.sendPostRequest(
      `/api/board/series/${seriesId}/vote`,
      { vote: "KhongHopLe" },
      boardHeaders,
    );
    I.seeResponseCodeIs(res.status, 400);
    assert.ok(res.data?.message?.includes("vote phải là:"));
  },
);

Scenario(
  "WB-VOTE-05: Bỏ phiếu cho Series ID không tồn tại -> Expect 404 (dòng 24-27)",
  async ({ I }) => {
    const boardToken = await getAuthToken(I, "editorial");
    const boardHeaders = { Authorization: `Bearer ${boardToken}` };
    const nonExistentId = "507f1f77bcf86cd799439011";

    const res = await I.sendPostRequest(
      `/api/board/series/${nonExistentId}/vote`,
      { vote: "Approve" },
      boardHeaders,
    );
    I.seeResponseCodeIs(res.status, 404);
    assert.equal(res.data?.message, "Không tìm thấy series");
  },
);

Scenario(
  "WB-VOTE-06: Bỏ phiếu cho Series còn ở trạng thái Draft -> Expect 400 (dòng 39-43)",
  async ({ I }) => {
    const mangakaToken = await getAuthToken(I, "mangaka");
    const boardToken = await getAuthToken(I, "editorial");
    const boardHeaders = { Authorization: `Bearer ${boardToken}` };

    // Tạo series nhưng không nộp proposal (Proposal status: "Draft")
    const draftSeriesId = await createDraftSeries(I, mangakaToken, "unsubmitted");

    const res = await I.sendPostRequest(
      `/api/board/series/${draftSeriesId}/vote`,
      { vote: "Approve" },
      boardHeaders,
    );
    I.seeResponseCodeIs(res.status, 400);
    assert.equal(res.data?.message, "Proposal không có trạng thái hợp lệ");
  },
);

Scenario(
  "WB-VOTE-07: Bỏ phiếu với Series ID sai định dạng -> Expect 500 (dòng 84-86 catch)",
  async ({ I }) => {
    const boardToken = await getAuthToken(I, "editorial");
    const boardHeaders = { Authorization: `Bearer ${boardToken}` };

    const res = await I.sendPostRequest(
      "/api/board/series/invalid_series_id_format/vote",
      { vote: "Approve" },
      boardHeaders,
    );
    I.seeResponseCodeIs(res.status, 500);
    assert.equal(res.data?.error, "Lỗi server");
  },
);

// ============================================================================
// 3. KIỂM THỬ ĐỘ PHỦ getPendingSeries.js & getBoardSeriesDetail.js
// ============================================================================

Scenario(
  "WB-DETAIL-01: Lấy danh sách hồ sơ chờ duyệt GET /api/board/series/pending -> Expect 200 (getPendingSeries dòng 11-32)",
  async ({ I }) => {
    const boardToken = await getAuthToken(I, "editorial");
    const boardHeaders = { Authorization: `Bearer ${boardToken}` };

    const res = await I.sendGetRequest("/api/board/series/pending", boardHeaders);
    I.seeResponseCodeIs(res.status, 200);
    assert.ok(Array.isArray(res.data?.pending), "pending phải là mảng danh sách hồ sơ");
    assert.equal(typeof res.data?.count, "number");
  },
);

Scenario(
  "WB-DETAIL-02: Lấy chi tiết hồ sơ Series hợp lệ GET /api/board/series/:id -> Expect 200 (getBoardSeriesDetail dòng 12-36)",
  async ({ I }) => {
    const mangakaToken = await getAuthToken(I, "mangaka");
    const boardToken = await getAuthToken(I, "editorial");
    const boardHeaders = { Authorization: `Bearer ${boardToken}` };

    const seriesId = await createSubmittedSeries(I, mangakaToken, "detail_ok");

    // Thêm 1 phiếu để có dữ liệu votes
    await I.sendPostRequest(
      `/api/board/series/${seriesId}/vote`,
      { vote: "Approve", comment: "Vote chi tiết" },
      boardHeaders,
    );

    const res = await I.sendGetRequest(`/api/board/series/${seriesId}`, boardHeaders);
    I.seeResponseCodeIs(res.status, 200);
    assert.ok(res.data?.series, "Dữ liệu phải có series");
    assert.ok(res.data?.proposal, "Dữ liệu phải có proposal");
    assert.ok(Array.isArray(res.data?.votes), "Dữ liệu phải có mảng votes");
    assert.equal(res.data?.votes?.length, 1);
  },
);

Scenario(
  "WB-DETAIL-03: Lấy chi tiết hồ sơ khi Series không tồn tại -> Expect 404 (getBoardSeriesDetail dòng 18-20)",
  async ({ I }) => {
    const boardToken = await getAuthToken(I, "editorial");
    const boardHeaders = { Authorization: `Bearer ${boardToken}` };
    const nonExistentId = "507f1f77bcf86cd799439011";

    const res = await I.sendGetRequest(
      `/api/board/series/${nonExistentId}`,
      boardHeaders,
    );
    I.seeResponseCodeIs(res.status, 404);
    assert.equal(res.data?.message, "Không tìm thấy series");
  },
);

Scenario(
  "WB-DETAIL-04: Lấy chi tiết hồ sơ với ID sai định dạng -> Expect 500 (getBoardSeriesDetail dòng 36-38 catch)",
  async ({ I }) => {
    const boardToken = await getAuthToken(I, "editorial");
    const boardHeaders = { Authorization: `Bearer ${boardToken}` };

    const res = await I.sendGetRequest(
      "/api/board/series/invalid_id_format",
      boardHeaders,
    );
    I.seeResponseCodeIs(res.status, 500);
    assert.equal(res.data?.error, "Lỗi server");
  },
);

