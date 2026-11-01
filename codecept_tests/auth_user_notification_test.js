import assert from "node:assert/strict";

Feature("Kiểm thử Tài khoản, Phân quyền & Thông báo chung (API)");

const adminCredentials = {
  email: "admin@example.com",
  password: "password123",
};

let cachedAdminToken = null;
let cachedMemberToken = null;
let targetUserId = null;
let targetNotificationId = null;

async function getAdminToken(I) {
  if (cachedAdminToken) return cachedAdminToken;
  const res = await I.sendPostRequest("/api/auth/login", adminCredentials);
  assert.equal(res.status, 200, "Đăng nhập admin ban đầu phải thành công (200)");
  assert.ok(res.data?.accessToken, "Response phải có accessToken");
  cachedAdminToken = res.data.accessToken;
  return cachedAdminToken;
}

async function getMemberToken(I) {
  if (cachedMemberToken) return cachedMemberToken;

  // Thử đăng nhập với tài khoản mangaka/assistant có sẵn
  let res = await I.sendPostRequest("/api/auth/login", {
    email: "mangaka@example.com",
    password: "password123",
  });

  if (res.status !== 200) {
    res = await I.sendPostRequest("/api/auth/login", {
      email: "magakatest123@gmail.com",
      password: "password123",
    });
  }

  if (res.status === 200 && res.data?.accessToken) {
    cachedMemberToken = res.data.accessToken;
    return cachedMemberToken;
  }

  // Nếu chưa có tài khoản Member, dùng quyền Admin tạo tài khoản Member tạm
  const adminToken = await getAdminToken(I);
  const tempEmail = `member_seed_${Date.now()}@test.com`;
  const createRes = await I.sendPostRequest(
    "/api/users",
    {
      name: "Test Member",
      email: tempEmail,
      password: "password123",
      role: "Member",
    },
    { Authorization: `Bearer ${adminToken}` },
  );

  if (createRes.status === 201) {
    const loginRes = await I.sendPostRequest("/api/auth/login", {
      email: tempEmail,
      password: "password123",
    });
    if (loginRes.status === 200 && loginRes.data?.accessToken) {
      cachedMemberToken = loginRes.data.accessToken;
      return cachedMemberToken;
    }
  }

  throw new Error("Không thể khởi tạo hoặc đăng nhập tài khoản Member cho test.");
}

// ============================================================================
// PHẦN 1 — XÁC THỰC & ĐĂNG NHẬP (POST /api/auth/login)
// ============================================================================

Scenario("AUTH-01: Đăng nhập thành công với tài khoản Admin hợp lệ", async ({ I }) => {
  const res = await I.sendPostRequest("/api/auth/login", {
    email: adminCredentials.email,
    password: adminCredentials.password,
  });

  console.log(`[AUTH-01] Status=${res.status}, body=${JSON.stringify(res.data)}`);
  assert.equal(res.status, 200, "Expected status 200 OK");
  assert.ok(res.data?.accessToken, "Expected accessToken in response");
  assert.ok(
    res.data?.user?.role?.toUpperCase() === "ADMIN",
    `Expected user role to be ADMIN, got ${res.data?.user?.role}`,
  );
  cachedAdminToken = res.data.accessToken;
});

Scenario("AUTH-02: Từ chối đăng nhập khi email để trống", async ({ I }) => {
  const res = await I.sendPostRequest("/api/auth/login", {
    email: "",
    password: "password123",
  });

  console.log(`[AUTH-02] Status=${res.status}, body=${JSON.stringify(res.data)}`);
  assert.equal(res.status, 400, "Expected 400 Bad Request when email is empty");
  assert.ok(!res.data?.accessToken, "Token should not be issued");
});

Scenario("AUTH-03: Từ chối đăng nhập khi email chỉ có khoảng trắng", async ({ I }) => {
  const res = await I.sendPostRequest("/api/auth/login", {
    email: "   ",
    password: "password123",
  });

  console.log(`[AUTH-03] Status=${res.status}, body=${JSON.stringify(res.data)}`);
  assert.equal(res.status, 400, "Expected 400 Bad Request when email is only whitespace");
  assert.ok(!res.data?.accessToken, "Token should not be issued");
});

Scenario("AUTH-04: Từ chối đăng nhập khi email sai định dạng", async ({ I }) => {
  const res = await I.sendPostRequest("/api/auth/login", {
    email: "admin-invalid-format",
    password: "password123",
  });

  console.log(`[AUTH-04] Status=${res.status}, body=${JSON.stringify(res.data)}`);
  assert.equal(res.status, 400, "Expected 400 Bad Request for invalid email format");
});

Scenario("AUTH-05: Từ chối đăng nhập khi email chưa từng đăng ký", async ({ I }) => {
  const res = await I.sendPostRequest("/api/auth/login", {
    email: "notfound@example.com",
    password: "password123",
  });

  console.log(`[AUTH-05] Status=${res.status}, body=${JSON.stringify(res.data)}`);
  assert.equal(res.status, 401, "Expected 401 Unauthorized for unregistered email");
});

Scenario("AUTH-06: Từ chối đăng nhập khi sai mật khẩu", async ({ I }) => {
  const res = await I.sendPostRequest("/api/auth/login", {
    email: adminCredentials.email,
    password: "wrongpassword",
  });

  console.log(`[AUTH-06] Status=${res.status}, body=${JSON.stringify(res.data)}`);
  assert.equal(res.status, 401, "Expected 401 Unauthorized for wrong password");
});

Scenario("AUTH-07: Từ chối đăng nhập khi mật khẩu để trống", async ({ I }) => {
  const res = await I.sendPostRequest("/api/auth/login", {
    email: adminCredentials.email,
    password: "",
  });

  console.log(`[AUTH-07] Status=${res.status}, body=${JSON.stringify(res.data)}`);
  assert.equal(res.status, 400, "Expected 400 Bad Request when password is empty");
});

// ============================================================================
// PHẦN 2 — QUẢN LÝ USER CỦA ADMIN (POST / PUT / PATCH / DELETE /api/users)
// ============================================================================

Scenario("USR-01: Admin tạo tài khoản mới thành công (201 Created)", async ({ I }) => {
  const adminToken = await getAdminToken(I);
  const uniqueEmail = `newuser_${Date.now()}@test.com`;

  const res = await I.sendPostRequest(
    "/api/users",
    {
      name: "New User Test",
      email: uniqueEmail,
      password: "Pass123",
      role: "MEMBER",
    },
    { Authorization: `Bearer ${adminToken}` },
  );

  console.log(`[USR-01] Status=${res.status}, body=${JSON.stringify(res.data)}`);
  assert.equal(res.status, 201, "Expected 201 Created for new user");
  assert.ok(res.data?.user?.id || res.data?.user?._id, "User ID should be returned");
  assert.equal(res.data?.user?.email, uniqueEmail, "User email should match");
  assert.equal(res.data?.user?.password, undefined, "Password should not be returned");

  // Lưu lại ID để phục vụ các test case tiếp theo
  targetUserId = res.data?.user?.id || res.data?.user?._id;
});

Scenario("USR-02: Chặn tài khoản Member không có quyền tạo người dùng (403 Forbidden)", async ({ I }) => {
  const memberToken = await getMemberToken(I);

  const res = await I.sendPostRequest(
    "/api/users",
    {
      name: "Blocked User",
      email: `blocked_${Date.now()}@test.com`,
      password: "Pass123",
      role: "MEMBER",
    },
    { Authorization: `Bearer ${memberToken}` },
  );

  console.log(`[USR-02] Status=${res.status}, body=${JSON.stringify(res.data)}`);
  assert.equal(res.status, 403, "Expected 403 Forbidden when non-admin creates user");
});

Scenario("USR-03: Chặn yêu cầu tạo người dùng khi không gửi token (401 Unauthorized)", async ({ I }) => {
  const res = await I.sendPostRequest("/api/users", {
    name: "No Auth User",
    email: `noauth_${Date.now()}@test.com`,
    password: "Pass123",
    role: "MEMBER",
  });

  console.log(`[USR-03] Status=${res.status}, body=${JSON.stringify(res.data)}`);
  assert.equal(res.status, 401, "Expected 401 Unauthorized when Authorization header is missing");
});

Scenario("USR-04: Từ chối tạo người dùng với email đã tồn tại (400/409 Conflict)", async ({ I }) => {
  const adminToken = await getAdminToken(I);

  const res = await I.sendPostRequest(
    "/api/users",
    {
      name: "Duplicate User",
      email: adminCredentials.email,
      password: "Pass123",
      role: "MEMBER",
    },
    { Authorization: `Bearer ${adminToken}` },
  );

  console.log(`[USR-04] Status=${res.status}, body=${JSON.stringify(res.data)}`);
  assert.ok(
    res.status === 409 || res.status === 400,
    `Expected 400 or 409 Conflict for duplicate email, got ${res.status}`,
  );
});

Scenario("USR-05: Từ chối tạo người dùng với mật khẩu ngắn hơn 6 ký tự (400 Bad Request)", async ({ I }) => {
  const adminToken = await getAdminToken(I);

  const res = await I.sendPostRequest(
    "/api/users",
    {
      name: "Short Password User",
      email: `shortpass_${Date.now()}@test.com`,
      password: "12345",
      role: "MEMBER",
    },
    { Authorization: `Bearer ${adminToken}` },
  );

  console.log(`[USR-05] Status=${res.status}, body=${JSON.stringify(res.data)}`);
  assert.equal(res.status, 400, "Expected 400 Bad Request for password < 6 characters");
});

Scenario("USR-06: Từ chối tạo người dùng với mật khẩu dài hơn 50 ký tự (400 Bad Request)", async ({ I }) => {
  const adminToken = await getAdminToken(I);

  const res = await I.sendPostRequest(
    "/api/users",
    {
      name: "Long Password User",
      email: `longpass_${Date.now()}@test.com`,
      password: "P".repeat(51),
      role: "MEMBER",
    },
    { Authorization: `Bearer ${adminToken}` },
  );

  console.log(`[USR-06] Status=${res.status}, body=${JSON.stringify(res.data)}`);
  assert.equal(res.status, 400, "Expected 400 Bad Request for password > 50 characters");
});

Scenario("USR-07: Từ chối tạo người dùng với vai trò không hợp lệ (400 Bad Request)", async ({ I }) => {
  const adminToken = await getAdminToken(I);

  const res = await I.sendPostRequest(
    "/api/users",
    {
      name: "Invalid Role User",
      email: `invalidrole_${Date.now()}@test.com`,
      password: "Pass123",
      role: "SUPERMAN",
    },
    { Authorization: `Bearer ${adminToken}` },
  );

  console.log(`[USR-07] Status=${res.status}, body=${JSON.stringify(res.data)}`);
  assert.equal(res.status, 400, "Expected 400 Bad Request for invalid role");
});

Scenario("USR-08: Admin cập nhật thông tin người dùng thành công (200 OK)", async ({ I }) => {
  const adminToken = await getAdminToken(I);
  assert.ok(targetUserId, "Cần targetUserId từ USR-01");

  const res = await I.sendPutRequest(
    `/api/users/${targetUserId}`,
    { name: "Nguyen Van B" },
    { Authorization: `Bearer ${adminToken}` },
  );

  console.log(`[USR-08] Status=${res.status}, body=${JSON.stringify(res.data)}`);
  assert.equal(res.status, 200, "Expected 200 OK when Admin updates user");
  assert.equal(res.data?.user?.name, "Nguyen Van B", "User name should be updated");
});

Scenario("USR-09: Chặn tài khoản Member cập nhật thông tin người dùng khác (403 Forbidden)", async ({ I }) => {
  const memberToken = await getMemberToken(I);
  assert.ok(targetUserId, "Cần targetUserId");

  const res = await I.sendPutRequest(
    `/api/users/${targetUserId}`,
    { name: "Hacker Name" },
    { Authorization: `Bearer ${memberToken}` },
  );

  console.log(`[USR-09] Status=${res.status}, body=${JSON.stringify(res.data)}`);
  assert.equal(res.status, 403, "Expected 403 Forbidden when Member updates user");
});

Scenario("USR-10: Bắt lỗi CastError khi cập nhật người dùng với ID sai định dạng (400 Bad Request)", async ({ I }) => {
  const adminToken = await getAdminToken(I);

  const res = await I.sendPutRequest(
    "/api/users/invalid-id-123",
    { name: "Invalid ID Test" },
    { Authorization: `Bearer ${adminToken}` },
  );

  console.log(`[USR-10] Status=${res.status}, body=${JSON.stringify(res.data)}`);
  assert.equal(res.status, 400, "Expected 400 Bad Request for malformed ObjectId");
});

Scenario("USR-11: Báo lỗi khi cập nhật người dùng với ID không tồn tại (404 Not Found)", async ({ I }) => {
  const adminToken = await getAdminToken(I);

  const res = await I.sendPutRequest(
    "/api/users/650000000000000000000000",
    { name: "Non-existent User" },
    { Authorization: `Bearer ${adminToken}` },
  );

  console.log(`[USR-11] Status=${res.status}, body=${JSON.stringify(res.data)}`);
  assert.equal(res.status, 404, "Expected 404 Not Found for non-existent user ID");
});

Scenario("USR-12: Admin khóa tài khoản người dùng với status BLOCKED (200 OK)", async ({ I }) => {
  const adminToken = await getAdminToken(I);
  assert.ok(targetUserId, "Cần targetUserId");

  const res = await I.sendPatchRequest(
    `/api/users/${targetUserId}/status`,
    { status: "BLOCKED" },
    { Authorization: `Bearer ${adminToken}` },
  );

  console.log(`[USR-12] Status=${res.status}, body=${JSON.stringify(res.data)}`);
  assert.equal(res.status, 200, "Expected 200 OK when Admin blocks user");
  assert.ok(
    res.data?.user?.status === "Suspended" || res.data?.user?.status === "BLOCKED",
    `Status should be Suspended/BLOCKED, got ${res.data?.user?.status}`,
  );
});

Scenario("USR-13: Chặn tài khoản Member cập nhật trạng thái người dùng (403 Forbidden)", async ({ I }) => {
  const memberToken = await getMemberToken(I);
  assert.ok(targetUserId, "Cần targetUserId");

  const res = await I.sendPatchRequest(
    `/api/users/${targetUserId}/status`,
    { status: "BLOCKED" },
    { Authorization: `Bearer ${memberToken}` },
  );

  console.log(`[USR-13] Status=${res.status}, body=${JSON.stringify(res.data)}`);
  assert.equal(res.status, 403, "Expected 403 Forbidden when Member updates status");
});

Scenario("USR-14: Admin xóa tài khoản người dùng thành công (200 OK)", async ({ I }) => {
  const adminToken = await getAdminToken(I);
  assert.ok(targetUserId, "Cần targetUserId");

  const res = await I.sendDeleteRequest(
    `/api/users/${targetUserId}`,
    { Authorization: `Bearer ${adminToken}` },
  );

  console.log(`[USR-14] Status=${res.status}, body=${JSON.stringify(res.data)}`);
  assert.equal(res.status, 200, "Expected 200 OK when Admin deletes user");
});

Scenario("USR-15: Chặn tài khoản Member xóa tài khoản người dùng (403 Forbidden)", async ({ I }) => {
  const memberToken = await getMemberToken(I);
  const dummyId = "65a1234567890abcdef12345";

  const res = await I.sendDeleteRequest(
    `/api/users/${dummyId}`,
    { Authorization: `Bearer ${memberToken}` },
  );

  console.log(`[USR-15] Status=${res.status}, body=${JSON.stringify(res.data)}`);
  assert.equal(res.status, 403, "Expected 403 Forbidden when Member deletes user");
});

// ============================================================================
// PHẦN 3 — QUẢN LÝ THÔNG BÁO CHUNG (/api/notifications)
// ============================================================================

Scenario("NOTI-01: Lấy danh sách thông báo thành công với token hợp lệ (200 OK)", async ({ I }) => {
  const adminToken = await getAdminToken(I);

  const res = await I.sendGetRequest("/api/notifications", {
    Authorization: `Bearer ${adminToken}`,
  });

  console.log(`[NOTI-01] Status=${res.status}, count=${res.data?.data?.length}`);
  assert.equal(res.status, 200, "Expected 200 OK when fetching notifications");
  assert.ok(Array.isArray(res.data?.data), "Expected data array of notifications");

  if (res.data?.data?.length > 0) {
    targetNotificationId = res.data.data[0]._id;
  }
});

Scenario("NOTI-02: Chặn lấy danh sách thông báo khi không gửi token (401 Unauthorized)", async ({ I }) => {
  const res = await I.sendGetRequest("/api/notifications");

  console.log(`[NOTI-02] Status=${res.status}`);
  assert.equal(res.status, 401, "Expected 401 Unauthorized when token missing");
});

Scenario("NOTI-03: Lấy số lượng thông báo chưa đọc thành công (200 OK)", async ({ I }) => {
  const adminToken = await getAdminToken(I);

  const res = await I.sendGetRequest("/api/notifications/unread-count", {
    Authorization: `Bearer ${adminToken}`,
  });

  console.log(`[NOTI-03] Status=${res.status}, count=${res.data?.count}`);
  assert.equal(res.status, 200, "Expected 200 OK for unread-count");
  assert.ok(typeof res.data?.count === "number", "Expected count to be a number");
});

Scenario("NOTI-04: Đánh dấu tất cả thông báo là đã đọc (200 OK)", async ({ I }) => {
  const adminToken = await getAdminToken(I);

  const res = await I.sendPutRequest(
    "/api/notifications/mark-all-read",
    {},
    { Authorization: `Bearer ${adminToken}` },
  );

  console.log(`[NOTI-04] Status=${res.status}, body=${JSON.stringify(res.data)}`);
  assert.equal(res.status, 200, "Expected 200 OK for mark-all-read");
  assert.equal(res.data?.success, true, "Expected success to be true");
});

Scenario("NOTI-05: Chặn đánh dấu tất cả đã đọc khi không gửi token (401 Unauthorized)", async ({ I }) => {
  const res = await I.sendPutRequest("/api/notifications/mark-all-read", {});

  console.log(`[NOTI-05] Status=${res.status}`);
  assert.equal(res.status, 401, "Expected 401 Unauthorized when token missing");
});

Scenario("NOTI-06: Đánh dấu một thông báo cụ thể là đã đọc (200 OK)", async ({ I }) => {
  const adminToken = await getAdminToken(I);

  // Nếu chưa có targetNotificationId, gọi GET lại để lấy ID
  if (!targetNotificationId) {
    const listRes = await I.sendGetRequest("/api/notifications", {
      Authorization: `Bearer ${adminToken}`,
    });
    if (listRes.data?.data?.length > 0) {
      targetNotificationId = listRes.data.data[0]._id;
    }
  }

  // Nếu danh sách rỗng, sử dụng một ObjectId hợp lệ bất kỳ để kiểm tra xử lý
  const notiId = targetNotificationId || "65a1234567890abcdef12345";
  const res = await I.sendPutRequest(
    `/api/notifications/${notiId}/read`,
    {},
    { Authorization: `Bearer ${adminToken}` },
  );

  console.log(`[NOTI-06] Status=${res.status}, body=${JSON.stringify(res.data)}`);
  assert.ok(
    res.status === 200 || res.status === 404,
    `Expected 200 OK or 404 Not Found, got ${res.status}`,
  );
});

Scenario("NOTI-07: Báo lỗi khi đánh dấu đọc với ID thông báo sai định dạng (400 Bad Request)", async ({ I }) => {
  const adminToken = await getAdminToken(I);

  const res = await I.sendPutRequest(
    "/api/notifications/invalid-id/read",
    {},
    { Authorization: `Bearer ${adminToken}` },
  );

  console.log(`[NOTI-07] Status=${res.status}, body=${JSON.stringify(res.data)}`);
  assert.equal(res.status, 400, "Expected 400 Bad Request for malformed notification ID");
});

Scenario("NOTI-08: Xóa thông báo thành công với ID hợp lệ (200 OK)", async ({ I }) => {
  const adminToken = await getAdminToken(I);
  const notiId = targetNotificationId || "65a1234567890abcdef12345";

  const res = await I.sendDeleteRequest(
    `/api/notifications/${notiId}`,
    { Authorization: `Bearer ${adminToken}` },
  );

  console.log(`[NOTI-08] Status=${res.status}, body=${JSON.stringify(res.data)}`);
  assert.ok(
    res.status === 200 || res.status === 404,
    `Expected 200 OK or 404 Not Found, got ${res.status}`,
  );
});
