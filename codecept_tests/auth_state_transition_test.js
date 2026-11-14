import assert from "node:assert/strict";

Feature("State Transition Testing - Auth, User Lifecycle & Notification");

const adminCredentials = {
  email: "admin@example.com",
  password: "password123",
};

const mangakaCredentials = {
  email: "magakatest123@gmail.com",
  password: "password123",
};

/**
 * Lấy Access Token của tài khoản Admin
 */
async function getAdminToken(I) {
  const res = await I.sendPostRequest("/api/auth/login", adminCredentials);
  I.seeResponseCodeIs(res.status, 200);
  assert.ok(res.data?.accessToken, "Response phải có accessToken của Admin");
  return res.data.accessToken;
}

/**
 * Lấy Access Token của tài khoản chỉ định
 */
async function getUserToken(I, credentials) {
  const res = await I.sendPostRequest("/api/auth/login", credentials);
  I.seeResponseCodeIs(res.status, 200);
  assert.ok(res.data?.accessToken, "Response phải có accessToken của User");
  return res.data.accessToken;
}

// ============================================================================
// a. VÒNG ĐỜI TRẠNG THÁI TÀI KHOẢN (User Lifecycle: ACTIVE <-> BLOCKED)
// ============================================================================

Scenario(
  "ST-01: Vòng đời trạng thái tài khoản người dùng (ACTIVE <-> BLOCKED & Negative Transition)",
  async ({ I }) => {
    const adminToken = await getAdminToken(I);
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };

    // 1. Tạo tài khoản test động độc lập (ban đầu ACTIVE)
    const timestamp = Date.now();
    const tempUser = {
      name: `State Test User ${timestamp}`,
      email: `state_user_${timestamp}@example.com`,
      password: "password123",
      role: "Member",
    };

    let res = await I.sendPostRequest("/api/users", tempUser, adminHeaders);
    I.seeResponseCodeIs(res.status, 201);
    const userId = res.data?.user?._id || res.data?.user?.id;
    assert.ok(userId, "Tài khoản test mới phải có ID");
    assert.equal(
      res.data?.user?.status?.toLowerCase(),
      "active",
      "Trạng thái ban đầu của user mới phải là Active",
    );

    // 2. Chuyển đổi hợp lệ 1 (ACTIVE -> BLOCKED): Admin gọi PATCH /api/users/:id/status với { status: 'BLOCKED' }
    res = await I.sendPatchRequest(
      `/api/users/${userId}/status`,
      { status: "BLOCKED" },
      adminHeaders,
    );
    I.seeResponseCodeIs(res.status, 200);
    assert.equal(
      res.data?.user?.status,
      "Suspended",
      "User status trong cơ sở dữ liệu phải chuyển thành Suspended (BLOCKED)",
    );

    // 3. Thử nghiệm trạng thái BLOCKED: Dùng tài khoản vừa bị khóa gọi POST /api/auth/login -> Bị chặn (403 Forbidden)
    res = await I.sendPostRequest("/api/auth/login", {
      email: tempUser.email,
      password: tempUser.password,
    });
    I.seeResponseCodeIs(res.status, 403);
    assert.equal(
      res.data?.error?.code,
      "AUTH_ACCOUNT_SUSPENDED",
      "Mã lỗi phải là AUTH_ACCOUNT_SUSPENDED khi đăng nhập user bị khóa",
    );

    // 4. Chuyển đổi hợp lệ 2 (BLOCKED -> ACTIVE): Admin gọi PATCH /api/users/:id/status với { status: 'ACTIVE' }
    res = await I.sendPatchRequest(
      `/api/users/${userId}/status`,
      { status: "ACTIVE" },
      adminHeaders,
    );
    I.seeResponseCodeIs(res.status, 200);
    assert.equal(
      res.data?.user?.status,
      "Active",
      "User status trong cơ sở dữ liệu phải chuyển về Active",
    );

    // 5. Thử nghiệm trạng thái phục hồi: Đăng nhập lại với tài khoản vừa ACTIVE -> 200 OK, cấp token bình thường
    res = await I.sendPostRequest("/api/auth/login", {
      email: tempUser.email,
      password: tempUser.password,
    });
    I.seeResponseCodeIs(res.status, 200);
    assert.ok(
      res.data?.accessToken,
      "Đăng nhập tài khoản được phục hồi phải trả về accessToken hợp lệ",
    );
    const memberToken = res.data.accessToken;

    // 6. Chuyển đổi không hợp lệ (Negative Transition): Thành viên thường (MEMBER token) cố tình đổi trạng thái -> 403 Forbidden
    res = await I.sendPatchRequest(
      `/api/users/${userId}/status`,
      { status: "BLOCKED" },
      { Authorization: `Bearer ${memberToken}` },
    );
    I.seeResponseCodeIs(res.status, 403);

    // 7. Dọn dẹp tài khoản test (Cleanup)
    res = await I.sendDeleteRequest(`/api/users/${userId}`, adminHeaders);
    I.seeResponseCodeIs(res.status, 200);
  },
);

// ============================================================================
// b. CHU KỲ TRẠNG THÁI PHIÊN XÁC THỰC (Auth Session State: LOGGED_OUT -> AUTHENTICATED -> LOGGED_OUT)
// ============================================================================

Scenario(
  "ST-02: Chu kỳ trạng thái phiên xác thực (LOGGED_OUT -> AUTHENTICATED -> LOGGED_OUT)",
  async ({ I }) => {
    // 1. Trạng thái LOGGED_OUT: Gọi API yêu cầu xác thực khi không có header Authorization -> 401 Unauthorized
    let res = await I.sendGetRequest("/api/notifications");
    I.seeResponseCodeIs(res.status, 401);

    // 2. Chuyển sang AUTHENTICATED: Gửi POST /api/auth/login với thông tin hợp lệ -> 200 OK, trích xuất token
    res = await I.sendPostRequest("/api/auth/login", adminCredentials);
    I.seeResponseCodeIs(res.status, 200);
    assert.ok(res.data?.accessToken, "Response đăng nhập phải trả về accessToken");
    const authToken = res.data.accessToken;

    // 3. Thử nghiệm AUTHENTICATED: Gửi GET /api/notifications kèm token vừa nhận -> 200 OK
    res = await I.sendGetRequest("/api/notifications", {
      Authorization: `Bearer ${authToken}`,
    });
    I.seeResponseCodeIs(res.status, 200);
    assert.ok(
      Array.isArray(res.data?.data),
      "Danh sách thông báo của tài khoản xác thực phải là một mảng",
    );

    // 4. Chuyển về LOGGED_OUT: Gửi POST /api/auth/logout -> 200 OK
    res = await I.sendPostRequest("/api/auth/logout", {});
    I.seeResponseCodeIs(res.status, 200);
    assert.equal(res.data?.message, "Logged out successfully.");
  },
);

// ============================================================================
// c. VÒNG ĐỜI TRẠNG THÁI THÔNG BÁO (Notification State: UNREAD -> READ -> DELETED)
// ============================================================================

Scenario(
  "ST-03: Vòng đời trạng thái thông báo (UNREAD -> READ -> DELETED & Negative on DELETED)",
  async ({ I }) => {
    // 1. Đăng nhập với tài khoản có thông báo để lấy token
    let res = await I.sendPostRequest("/api/auth/login", mangakaCredentials);
    I.seeResponseCodeIs(res.status, 200);
    assert.ok(res.data?.accessToken, "Response phải có accessToken");
    const userToken = res.data.accessToken;
    let userHeaders = { Authorization: `Bearer ${userToken}` };

    // 2. Tạo/Lấy thông báo có trạng thái ban đầu UNREAD (is_read: false)
    res = await I.sendGetRequest("/api/notifications?is_read=false", userHeaders);
    I.seeResponseCodeIs(res.status, 200);

    let targetNoti = res.data?.data?.[0];

    // Fallback: Nếu không còn thông báo unread của mangaka, kiểm tra thông báo của admin
    if (!targetNoti) {
      const adminToken = await getAdminToken(I);
      res = await I.sendGetRequest(
        "/api/notifications?is_read=false",
        { Authorization: `Bearer ${adminToken}` },
      );
      if (res.data?.data?.length > 0) {
        targetNoti = res.data.data[0];
        userHeaders = { Authorization: `Bearer ${adminToken}` };
      }
    }

    assert.ok(
      targetNoti?._id,
      "Cần có ít nhất một thông báo ở trạng thái UNREAD để thực hiện kiểm thử",
    );
    const notiId = targetNoti._id;
    assert.equal(targetNoti.is_read, false, "Trạng thái ban đầu của thông báo phải là UNREAD (is_read: false)");

    // 3. Chuyển sang READ: Gửi PUT /api/notifications/:id/read -> 200 OK, is_read chuyển thành true
    res = await I.sendPutRequest(`/api/notifications/${notiId}/read`, {}, userHeaders);
    I.seeResponseCodeIs(res.status, 200);
    assert.equal(res.data?.success, true);
    assert.equal(res.data?.message, "Đã đánh dấu đã đọc");

    // 4. Chuyển sang DELETED: Gửi DELETE /api/notifications/:id -> 200 OK
    res = await I.sendDeleteRequest(`/api/notifications/${notiId}`, userHeaders);
    I.seeResponseCodeIs(res.status, 200);
    assert.equal(res.data?.success, true);
    assert.equal(res.data?.message, "Đã xóa thông báo");

    // 5. Chuyển đổi không hợp lệ trên trạng thái DELETED: Gửi lại PUT /api/notifications/:id/read với ID đã xóa -> 404 Not Found
    res = await I.sendPutRequest(`/api/notifications/${notiId}/read`, {}, userHeaders);
    I.seeResponseCodeIs(res.status, 404);
    assert.equal(res.data?.success, false);
    assert.equal(res.data?.message, "Không tìm thấy thông báo");
  },
);
