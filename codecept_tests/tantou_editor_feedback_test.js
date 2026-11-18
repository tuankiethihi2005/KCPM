import assert from "node:assert/strict";

Feature("Tantou Editor Feedback & Progress Management");

/**
 * Cấu hình tài khoản kiểm thử các vai trò
 */
const accounts = {
  editor: {
    email: process.env.CODECEPT_EDITOR_EMAIL || "editor@example.com",
    password: process.env.CODECEPT_EDITOR_PASSWORD || "password123",
  },
  admin: {
    email: process.env.CODECEPT_ADMIN_EMAIL || "admin@example.com",
    password: process.env.CODECEPT_ADMIN_PASSWORD || "password123",
  },
  assistant: {
    email: process.env.CODECEPT_ASSISTANT_EMAIL || "assistant@example.com",
    password: process.env.CODECEPT_ASSISTANT_PASSWORD || "password123",
  },
};

/**
 * Đăng nhập và trích xuất accessToken
 */
async function login(I, credentials) {
  const res = await I.sendPostRequest("/api/auth/login", credentials);
  assert.equal(
    res.status,
    200,
    `Đăng nhập thất bại cho ${credentials.email}: ${JSON.stringify(res.data)}`,
  );
  assert.ok(res.data?.accessToken, "Response đăng nhập phải chứa accessToken");
  return res.data.accessToken;
}

/**
 * Chuẩn bị token cho tài khoản vai trò Member (độc giả/người dùng thường)
 */
async function getOrCreateMemberToken(I, adminToken) {
  const memberCreds = {
    email: "member_test@example.com",
    password: "password123",
  };

  // Thử đăng nhập tài khoản member đã có
  const loginRes = await I.sendPostRequest("/api/auth/login", memberCreds);
  if (loginRes.status === 200 && loginRes.data?.accessToken) {
    return loginRes.data.accessToken;
  }

  // Nếu chưa có, Admin tạo động một tài khoản vai trò Member
  const adminHeaders = {
    Authorization: `Bearer ${adminToken}`,
  };
  const timestamp = Date.now();
  const newMember = {
    name: "Member Test User",
    email: `member_${timestamp}@example.com`,
    password: "password123",
    role: "Member",
  };

  const createRes = await I.sendPostRequest("/api/users", newMember, adminHeaders);
  if (createRes.status === 201) {
    const freshLogin = await I.sendPostRequest("/api/auth/login", {
      email: newMember.email,
      password: newMember.password,
    });
    if (freshLogin.status === 200 && freshLogin.data?.accessToken) {
      return freshLogin.data.accessToken;
    }
  }

  // Fallback: Tài khoản Assistant cũng không có quyền Tantou Editor
  const assistantRes = await I.sendPostRequest("/api/auth/login", accounts.assistant);
  if (assistantRes.status === 200 && assistantRes.data?.accessToken) {
    return assistantRes.data.accessToken;
  }

  throw new Error("Không thể khởi tạo hoặc đăng nhập tài khoản không có quyền Editor");
}

/**
 * Lấy Series, Chapter và Page hợp lệ trong cơ sở dữ liệu để phục vụ kiểm thử
 */
async function prepareTestContext(I, editorToken, adminToken) {
  // 1. Tìm trong danh sách Series được gán cho Tantou Editor
  const seriesRes = await I.sendGetRequest("/api/series/editor", {
    Authorization: `Bearer ${editorToken}`,
  });

  const seriesList = seriesRes.data?.series || seriesRes.data || [];
  for (const item of seriesList) {
    const seriesDoc = item.series || item;
    const seriesId = seriesDoc._id || seriesDoc.id;
    if (!seriesId) continue;

    const chaptersRes = await I.sendGetRequest(
      `/api/chapters/series/${seriesId}`,
      { Authorization: `Bearer ${editorToken}` },
    );
    const chapters = chaptersRes.data?.chapters || chaptersRes.data || [];

    for (const chapter of chapters) {
      const chapterId = chapter._id || chapter.id;
      if (!chapterId) continue;

      const pagesRes = await I.sendGetRequest(
        `/api/pages/chapter/${chapterId}`,
        { Authorization: `Bearer ${editorToken}` },
      );
      const pages = pagesRes.data?.pages || pagesRes.data || [];

      if (pages.length > 0) {
        return {
          seriesId: String(seriesId),
          chapterId: String(chapterId),
          pageId: String(pages[0]._id || pages[0].id),
        };
      }
    }
  }

  // 2. Tìm qua quyền Admin nếu danh sách của Editor chưa sẵn sàng
  const allSeriesRes = await I.sendGetRequest("/api/series/all", {
    Authorization: `Bearer ${adminToken}`,
  });
  const allSeries = allSeriesRes.data?.series || allSeriesRes.data || [];

  for (const series of allSeries) {
    const seriesId = series._id || series.id;
    if (!seriesId) continue;

    const chaptersRes = await I.sendGetRequest(
      `/api/chapters/series/${seriesId}`,
      { Authorization: `Bearer ${adminToken}` },
    );
    const chapters = chaptersRes.data?.chapters || chaptersRes.data || [];

    for (const chapter of chapters) {
      const chapterId = chapter._id || chapter.id;
      if (!chapterId) continue;

      const pagesRes = await I.sendGetRequest(
        `/api/pages/chapter/${chapterId}`,
        { Authorization: `Bearer ${adminToken}` },
      );
      const pages = pagesRes.data?.pages || pagesRes.data || [];

      if (pages.length > 0) {
        return {
          seriesId: String(seriesId),
          chapterId: String(chapterId),
          pageId: String(pages[0]._id || pages[0].id),
        };
      }
    }
  }

  throw new Error("Cần có ít nhất một Chapter và Page trong hệ thống để thực hiện kiểm thử");
}

// ============================================================================
// SCENARIO 1: KIỂM TRA PHÂN QUYỀN RBAC (TE-FB-01, TE-FB-16, TE-ST-07)
// ============================================================================

Scenario(
  "Scenario 1: Kiểm tra phân quyền RBAC khi gửi feedback và cập nhật tiến độ",
  async ({ I }) => {
    const editorToken = await login(I, accounts.editor);
    const adminToken = await login(I, accounts.admin);
    const memberToken = await getOrCreateMemberToken(I, adminToken);

    const context = await prepareTestContext(I, editorToken, adminToken);
    const { pageId, chapterId } = context;

    // 1.1. Gửi feedback với tài khoản Member thường -> Mong đợi: 403 Forbidden
    const memberFeedbackPayload = {
      x: 100,
      y: 150,
      content: "Member cố gắng gửi feedback trái phép",
    };
    let res = await I.sendPostRequest(
      `/api/annotations/page/${pageId}`,
      memberFeedbackPayload,
      { Authorization: `Bearer ${memberToken}` },
    );
    I.seeResponseCodeIs(res.status, 403);
    assert.equal(res.status, 403, "Người dùng thường (Member) phải bị chặn 403 khi tạo feedback");

    // 1.2. Member cố gắng duyệt trạng thái Chapter -> Mong đợi: 403 Forbidden
    res = await I.sendPutRequest(
      `/api/chapters/update-status/${chapterId}`,
      { status: "Approved" },
      { Authorization: `Bearer ${memberToken}` },
    );
    I.seeResponseCodeIs(res.status, 403);
    assert.equal(res.status, 403, "Người dùng thường (Member) phải bị chặn 403 khi cập nhật trạng thái chapter");

    // 1.3. Gửi feedback với tài khoản Tantou Editor -> Mong đợi: 201 Created
    const editorFeedbackPayload = {
      x: 120,
      y: 240,
      content: "Tantou Editor góp ý bố cục trang và nét thoại",
      category: "Art",
    };
    res = await I.sendPostRequest(
      `/api/annotations/page/${pageId}`,
      editorFeedbackPayload,
      { Authorization: `Bearer ${editorToken}` },
    );
    I.seeResponseCodeIs(res.status, 201);
    assert.equal(res.status, 201, "Tantou Editor phải tạo feedback thành công với mã 201");
    assert.equal(
      res.data?.annotation?.content || res.data?.data?.content,
      editorFeedbackPayload.content,
    );

    // 1.4. Gửi feedback với tài khoản Admin -> Mong đợi: 201 Created
    const adminFeedbackPayload = {
      x: 80,
      y: 160,
      content: "Admin duyệt kiểm tra và thêm góp ý",
      category: "Dialogue",
    };
    res = await I.sendPostRequest(
      `/api/annotations/page/${pageId}`,
      adminFeedbackPayload,
      { Authorization: `Bearer ${adminToken}` },
    );
    I.seeResponseCodeIs(res.status, 201);
    assert.equal(res.status, 201, "Admin phải tạo feedback thành công với mã 201");
  },
);

// ============================================================================
// SCENARIO 2: KIỂM THỬ DỮ LIỆU BIÊN (EP & BVA) (TE-FB-04, TE-FB-05, TE-ST-06)
// ============================================================================

Scenario(
  "Scenario 2: Kiểm thử dữ liệu biên (EP & BVA) cho feedback và trạng thái chapter",
  async ({ I }) => {
    const editorToken = await login(I, accounts.editor);
    const adminToken = await login(I, accounts.admin);

    const context = await prepareTestContext(I, editorToken, adminToken);
    const { pageId } = context;
    const editorHeaders = { Authorization: `Bearer ${editorToken}` };

    // 2.1. Gửi feedback với body rỗng -> Mong đợi: 400 Bad Request
    let res = await I.sendPostRequest(
      `/api/annotations/page/${pageId}`,
      {},
      editorHeaders,
    );
    I.seeResponseCodeIs(res.status, 400);
    assert.equal(res.status, 400, "Body rỗng phải bị từ chối 400 Bad Request");

    // 2.2. Gửi feedback thiếu trường bắt buộc content hoặc chỉ có khoảng trắng -> Mong đợi: 400 Bad Request
    res = await I.sendPostRequest(
      `/api/annotations/page/${pageId}`,
      { x: 100, y: 100, content: "    " },
      editorHeaders,
    );
    I.seeResponseCodeIs(res.status, 400);
    assert.equal(res.status, 400, "Content chỉ có khoảng trắng phải bị từ chối 400");

    // 2.3. Gửi feedback thiếu tọa độ x -> Mong đợi: 400 Bad Request
    res = await I.sendPostRequest(
      `/api/annotations/page/${pageId}`,
      { y: 100, content: "Thiếu tọa độ x" },
      editorHeaders,
    );
    I.seeResponseCodeIs(res.status, 400);
    assert.equal(res.status, 400, "Thiếu tọa độ x phải bị từ chối 400");

    // 2.4. Gửi feedback thiếu tọa độ y -> Mong đợi: 400 Bad Request
    res = await I.sendPostRequest(
      `/api/annotations/page/${pageId}`,
      { x: 100, content: "Thiếu tọa độ y" },
      editorHeaders,
    );
    I.seeResponseCodeIs(res.status, 400);
    assert.equal(res.status, 400, "Thiếu tọa độ y phải bị từ chối 400");

    // 2.5. Cập nhật tiến độ với Chapter ID không tồn tại -> Mong đợi: 404 Not Found
    const nonExistentChapterId = "507f1f77bcf86cd799439011";
    res = await I.sendPutRequest(
      `/api/chapters/update-status/${nonExistentChapterId}`,
      { status: "Need Revision" },
      editorHeaders,
    );
    I.seeResponseCodeIs(res.status, 404);
    assert.equal(res.status, 404, "Chapter ID không tồn tại phải trả về mã 404 Not Found");
    assert.equal(res.data?.message, "Không tìm thấy chapter");

    // 2.6. Tạo feedback với Page ID không tồn tại -> Mong đợi: 400 / 404 (Không tìm thấy trang)
    const nonExistentPageId = "507f1f77bcf86cd799439011";
    res = await I.sendPostRequest(
      `/api/annotations/page/${nonExistentPageId}`,
      { x: 50, y: 50, content: "Góp ý trên trang không tồn tại" },
      editorHeaders,
    );
    assert.ok(
      [400, 404].includes(res.status),
      `Trang không tồn tại phải trả về 400 hoặc 404, thực tế: ${res.status}`,
    );
  },
);

// ============================================================================
// SCENARIO 3: KIỂM THỬ LUỒNG CHUYỂN ĐỔI TRẠNG THÁI (STATE TRANSITION)
// ============================================================================

Scenario(
  "Scenario 3: Kiểm thử luồng chuyển đổi trạng thái bản thảo (Waiting Review -> Need Revision -> Approved)",
  async ({ I }) => {
    const editorToken = await login(I, accounts.editor);
    const adminToken = await login(I, accounts.admin);

    const context = await prepareTestContext(I, editorToken, adminToken);
    const { pageId, chapterId } = context;
    const editorHeaders = { Authorization: `Bearer ${editorToken}` };

    // 3.1. Tantou Editor tạo một góp ý yêu cầu sửa lỗi trên bản thảo
    const feedbackRes = await I.sendPostRequest(
      `/api/annotations/page/${pageId}`,
      {
        x: 150,
        y: 200,
        content: "Cần vẽ lại góc nhìn trang 1 và sửa lỗi chính tả khung thoại",
        status: "Open",
      },
      editorHeaders,
    );
    I.seeResponseCodeIs(feedbackRes.status, 201);
    const annotationId =
      feedbackRes.data?.annotation?._id ||
      feedbackRes.data?.data?._id ||
      feedbackRes.data?._id;
    assert.ok(annotationId, "Feedback phải được tạo thành công kèm ID");

    // 3.2. Chuyển trạng thái Chapter sang 'Need Revision' (Yêu cầu tác giả chỉnh sửa) -> Expect: 200 OK
    let res = await I.sendPutRequest(
      `/api/chapters/update-status/${chapterId}`,
      { status: "Need Revision" },
      editorHeaders,
    );
    I.seeResponseCodeIs(res.status, 200);
    assert.equal(res.status, 200, "Cập nhật Chapter sang Need Revision phải thành công 200 OK");
    assert.equal(
      res.data?.chapter?.status,
      "Need Revision",
      "Trạng thái Chapter phải là Need Revision",
    );

    // 3.3. Tác giả/Editor hoàn thành khắc phục góp ý (chuyển annotation sang 'Resolved') -> Expect: 200 OK
    const updateAnnotationRes = await I.sendPatchRequest(
      `/api/annotations/${annotationId}`,
      { status: "Resolved" },
      editorHeaders,
    );
    I.seeResponseCodeIs(updateAnnotationRes.status, 200);
    assert.equal(
      updateAnnotationRes.data?.annotation?.status || updateAnnotationRes.data?.data?.status,
      "Resolved",
      "Trạng thái Annotation phải chuyển sang Resolved",
    );

    // 3.4. Tantou Editor nghiệm thu đạt tiến độ -> Chuyển trạng thái Chapter thành 'Approved' -> Expect: 200 OK
    res = await I.sendPutRequest(
      `/api/chapters/update-status/${chapterId}`,
      { status: "Approved" },
      editorHeaders,
    );
    I.seeResponseCodeIs(res.status, 200);
    assert.equal(res.status, 200, "Duyệt Chapter sang Approved phải thành công 200 OK");
    assert.equal(
      res.data?.chapter?.status,
      "Approved",
      "Trạng thái Chapter phải là Approved",
    );

    // 3.5. Kiểm tra tính toàn vẹn: Gửi giá trị trạng thái không thuộc Enum hợp lệ -> Expect: 400 Bad Request
    res = await I.sendPutRequest(
      `/api/chapters/update-status/${chapterId}`,
      { status: "InvalidChapterStatus" },
      editorHeaders,
    );
    I.seeResponseCodeIs(res.status, 400);
    assert.equal(res.status, 400, "Trạng thái ngoài enum phải bị từ chối 400 Bad Request");
    assert.equal(res.data?.message, "Trạng thái không hợp lệ");
  },
);

