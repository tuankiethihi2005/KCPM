const request = require("supertest");
const express = require("express");
const { connectDB, closeDB, clearDB } = require("./setup/dbSetup");
const authRoutes = require("../src/routes/auth.routes");
const User = require("../src/models/UserModel");
const AuthSession = require("../src/modules/auth/models/AuthSessionModel");
const { hashPassword } = require("../src/modules/auth/utils/password");

const app = express();
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use((error, req, res, next) =>
  res.status(error.status || 500).json({
    error: {
      code: error.code || "INTERNAL_SERVER_ERROR",
      message: error.message || "Unexpected error",
    },
  }),
);

jest.setTimeout(120000);

beforeAll(async () => await connectDB());
afterEach(async () => await clearDB());
afterAll(async () => await closeDB());

describe("Authentication API", () => {
  const createUser = async (overrides = {}) =>
    User.create({
      name: "Auth User",
      email: "auth@example.com",
      password: await hashPassword("password123"),
      role: "Mangaka",
      status: "Active",
      ...overrides,
    });

  it("logs in with valid credentials", async () => {
    await createUser();

    const response = await request(app).post("/api/auth/login").send({
      email: "auth@example.com",
      password: "password123",
    });

    expect(response.status).toBe(200);
    expect(response.body.accessToken).toBeTruthy();
    expect(response.body.refreshToken).toBeUndefined();
    expect(response.body.user.email).toBe("auth@example.com");
    expect(response.headers["set-cookie"][0]).toContain("refresh_token=");
    expect(response.headers["set-cookie"][0]).toContain("HttpOnly");

    const sessions = await AuthSession.find();
    expect(sessions).toHaveLength(1);
  });

  it("rejects invalid credentials", async () => {
    await createUser();

    const response = await request(app).post("/api/auth/login").send({
      email: "auth@example.com",
      password: "wrong-password",
    });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("AUTH_INVALID_CREDENTIALS");
  });

  it("rejects suspended accounts", async () => {
    await createUser({ status: "Suspended" });

    const response = await request(app).post("/api/auth/login").send({
      email: "auth@example.com",
      password: "password123",
    });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("AUTH_ACCOUNT_SUSPENDED");
  });

  it("returns current user for a valid access token", async () => {
    await createUser();

    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "auth@example.com",
      password: "password123",
    });

    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${loginResponse.body.accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe("auth@example.com");
    expect(response.body.user.password).toBeUndefined();
  });

  it("refreshes tokens and revokes the previous refresh token", async () => {
    await createUser();
    const agent = request.agent(app);

    const loginResponse = await agent.post("/api/auth/login").send({
      email: "auth@example.com",
      password: "password123",
    });

    const firstCookie = loginResponse.headers["set-cookie"][0];
    const refreshResponse = await agent.post("/api/auth/refresh").send();

    expect(refreshResponse.status).toBe(200);
    expect(refreshResponse.body.accessToken).toBeTruthy();
    expect(refreshResponse.body.refreshToken).toBeUndefined();
    expect(refreshResponse.headers["set-cookie"][0]).toContain("refresh_token=");
    expect(refreshResponse.headers["set-cookie"][0]).not.toBe(firstCookie);

    const secondRefreshResponse = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", firstCookie)
      .send();

    expect(secondRefreshResponse.status).toBe(401);
    expect(secondRefreshResponse.body.error.code).toBe("AUTH_REFRESH_INVALID");
  });

  it("logs out by revoking the refresh token", async () => {
    await createUser();
    const agent = request.agent(app);

    await agent.post("/api/auth/login").send({
      email: "auth@example.com",
      password: "password123",
    });

    const logoutResponse = await agent.post("/api/auth/logout").send();

    expect(logoutResponse.status).toBe(200);
    expect(logoutResponse.headers["set-cookie"][0]).toContain("refresh_token=");
    expect(logoutResponse.headers["set-cookie"][0]).toContain("Expires=Thu, 01 Jan 1970");

    const refreshResponse = await agent.post("/api/auth/refresh").send();

    expect(refreshResponse.status).toBe(401);
    expect(refreshResponse.body.error.code).toBe("AUTH_REFRESH_INVALID");
  });

  it("lets admin list users", async () => {
    await createUser({ role: "Admin" });
    await createUser({
      email: "employee@example.com",
      role: "Assistant",
    });

    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "auth@example.com",
      password: "password123",
    });

    const response = await request(app)
      .get("/api/auth/users")
      .set("Authorization", `Bearer ${loginResponse.body.accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.users).toHaveLength(2);
    expect(response.body.users[0].password).toBeUndefined();
  });

  it("lets admin create an employee account", async () => {
    await createUser({ role: "Admin" });

    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "auth@example.com",
      password: "password123",
    });

    const response = await request(app)
      .post("/api/auth/users")
      .set("Authorization", `Bearer ${loginResponse.body.accessToken}`)
      .send({
        name: "Assistant User",
        email: "assistant@example.com",
        password: "password456",
        role: "Assistant",
        status: "Active",
      });

    expect(response.status).toBe(201);
    expect(response.body.user.email).toBe("assistant@example.com");
    expect(response.body.user.password).toBeUndefined();

    const employeeLogin = await request(app).post("/api/auth/login").send({
      email: "assistant@example.com",
      password: "password456",
    });
    expect(employeeLogin.status).toBe(200);
  });

  it("blocks non-admin users from creating employee accounts", async () => {
    await createUser({ role: "Mangaka" });

    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "auth@example.com",
      password: "password123",
    });

    const response = await request(app)
      .post("/api/auth/users")
      .set("Authorization", `Bearer ${loginResponse.body.accessToken}`)
      .send({
        name: "Assistant User",
        email: "assistant@example.com",
        password: "password456",
        role: "Assistant",
      });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("AUTHZ_ROLE_DENIED");
  });

  it("rejects duplicate employee email", async () => {
    await createUser({ role: "Admin" });

    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "auth@example.com",
      password: "password123",
    });

    const response = await request(app)
      .post("/api/auth/users")
      .set("Authorization", `Bearer ${loginResponse.body.accessToken}`)
      .send({
        name: "Duplicate User",
        email: "auth@example.com",
        password: "password456",
        role: "Assistant",
      });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("AUTH_EMAIL_ALREADY_EXISTS");
  });

  it("lets admin reset employee password and revokes existing sessions", async () => {
    await createUser({ role: "Admin" });
    const employee = await createUser({
      email: "employee@example.com",
      role: "Assistant",
    });

    const employeeAgent = request.agent(app);
    const employeeLogin = await employeeAgent.post("/api/auth/login").send({
      email: "employee@example.com",
      password: "password123",
    });
    expect(employeeLogin.status).toBe(200);

    const adminLogin = await request(app).post("/api/auth/login").send({
      email: "auth@example.com",
      password: "password123",
    });

    const resetResponse = await request(app)
      .post(`/api/auth/users/${employee._id}/reset-password`)
      .set("Authorization", `Bearer ${adminLogin.body.accessToken}`)
      .send({ newPassword: "newpass123" });

    expect(resetResponse.status).toBe(200);

    const oldPasswordLogin = await request(app).post("/api/auth/login").send({
      email: "employee@example.com",
      password: "password123",
    });
    expect(oldPasswordLogin.status).toBe(401);

    const newPasswordLogin = await request(app).post("/api/auth/login").send({
      email: "employee@example.com",
      password: "newpass123",
    });
    expect(newPasswordLogin.status).toBe(200);

    const oldRefreshResponse = await employeeAgent.post("/api/auth/refresh").send();
    expect(oldRefreshResponse.status).toBe(401);
  });
});

describe("User Management - Khóa/Mở khóa/Xóa tài khoản", () => {
  let adminToken;
  let mangakaUser;

  const createTestUser = async (overrides = {}) =>
    User.create({
      name: "Test User",
      email: `test-${Date.now()}@example.com`,
      password: await hashPassword("password123"),
      role: "Mangaka",
      status: "Active",
      ...overrides,
    });

  beforeEach(async () => {
    const admin = await User.create({
      name: "Admin User",
      email: "admin@example.com",
      password: await hashPassword("password123"),
      role: "Admin",
      status: "Active",
    });

    const adminLogin = await request(app).post("/api/auth/login").send({
      email: "admin@example.com",
      password: "password123",
    });
    adminToken = adminLogin.body.accessToken;

    mangakaUser = await createTestUser();
  });

  // ===== KHÓA TÀI KHOẢN =====
  it("Admin khóa tài khoản (Suspend) thành công", async () => {
    const response = await request(app)
      .patch(`/api/auth/users/${mangakaUser._id}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "Suspended" });

    expect(response.status).toBe(200);
    expect(response.body.user.status).toBe("Suspended");

    // User bị khóa không thể login
    const loginResponse = await request(app).post("/api/auth/login").send({
      email: mangakaUser.email,
      password: "password123",
    });
    expect(loginResponse.status).toBe(403);
    expect(loginResponse.body.error.code).toBe("AUTH_ACCOUNT_SUSPENDED");
  });

  it("Không thể khóa tài khoản với status không hợp lệ", async () => {
    const response = await request(app)
      .patch(`/api/auth/users/${mangakaUser._id}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "InvalidStatus" });

    expect(response.status).toBe(400);
  });

  // ===== MỞ KHÓA TÀI KHOẢN =====
  it("Admin mở khóa tài khoản từ Suspended → Active", async () => {
    // Khóa trước
    await User.findByIdAndUpdate(mangakaUser._id, { status: "Suspended" });

    const response = await request(app)
      .patch(`/api/auth/users/${mangakaUser._id}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "Active" });

    expect(response.status).toBe(200);
    expect(response.body.user.status).toBe("Active");

    // User có thể login lại
    const loginResponse = await request(app).post("/api/auth/login").send({
      email: mangakaUser.email,
      password: "password123",
    });
    expect(loginResponse.status).toBe(200);
  });

  // ===== XÓA TÀI KHOẢN =====
  it("Admin xóa tài khoản (soft delete) thành công", async () => {
    const response = await request(app)
      .delete(`/api/auth/users/${mangakaUser._id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.user.status).toBe("Inactive");

    // User bị xóa không thể login
    const loginResponse = await request(app).post("/api/auth/login").send({
      email: mangakaUser.email,
      password: "password123",
    });
    expect(loginResponse.status).toBe(403);
    expect(loginResponse.body.error.code).toBe("AUTH_ACCOUNT_INACTIVE");
  });

  it("Xóa tài khoản revoke tất cả sessions", async () => {
    const agent = request.agent(app);

    // Login trước
    const loginResponse = await agent.post("/api/auth/login").send({
      email: mangakaUser.email,
      password: "password123",
    });
    expect(loginResponse.status).toBe(200);

    // Admin xóa
    await request(app)
      .delete(`/api/auth/users/${mangakaUser._id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    // Không thể refresh token
    const refreshResponse = await agent.post("/api/auth/refresh").send();
    expect(refreshResponse.status).toBe(401);
  });

  // ===== XÓA USER KHÔNG TỒN TẠI =====
  it("Xóa user không tồn tại trả về 404", async () => {
    const fakeId = "507f1f77bcf86cd799439011";
    const response = await request(app)
      .delete(`/api/auth/users/${fakeId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("AUTH_USER_NOT_FOUND");
  });

  // ===== KIỂM TRA REVOKE SESSION KHI KHÓA =====
  it("Khóa tài khoản revoke tất cả sessions hiện tại", async () => {
    const agent = request.agent(app);

    // Login trước
    const loginResponse = await agent.post("/api/auth/login").send({
      email: mangakaUser.email,
      password: "password123",
    });
    expect(loginResponse.status).toBe(200);

    // Admin khóa
    await request(app)
      .patch(`/api/auth/users/${mangakaUser._id}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "Suspended" });

    // Không thể refresh token
    const refreshResponse = await agent.post("/api/auth/refresh").send();
    expect(refreshResponse.status).toBe(401);
  });

  // ===== NON-ADMIN KHÔNG ĐƯỢC PHÉP =====
  it("Non-admin không được phép khóa/mở khóa tài khoản", async () => {
    const mangakaLogin = await request(app).post("/api/auth/login").send({
      email: mangakaUser.email,
      password: "password123",
    });
    const mangakaToken = mangakaLogin.body.accessToken;

    const targetUser = await createTestUser({ email: "target@example.com" });

    const response = await request(app)
      .patch(`/api/auth/users/${targetUser._id}/status`)
      .set("Authorization", `Bearer ${mangakaToken}`)
      .send({ status: "Suspended" });

    expect(response.status).toBe(403);
  });

  it("Non-admin không được phép xóa tài khoản", async () => {
    const mangakaLogin = await request(app).post("/api/auth/login").send({
      email: mangakaUser.email,
      password: "password123",
    });
    const mangakaToken = mangakaLogin.body.accessToken;

    const response = await request(app)
      .delete(`/api/auth/users/${mangakaUser._id}`)
      .set("Authorization", `Bearer ${mangakaToken}`);

    expect(response.status).toBe(403);
  });

  // ===== PAGINATION & FILTER =====
  it("Lấy danh sách users với pagination", async () => {
    const response = await request(app)
      .get("/api/auth/users?page=1&limit=2")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.users).toBeDefined();
    expect(response.body.pagination).toBeDefined();
    expect(response.body.pagination.page).toBe(1);
    expect(response.body.pagination.limit).toBe(2);
  });

  it("Lọc users theo role", async () => {
    const response = await request(app)
      .get("/api/auth/users?role=Mangaka")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    response.body.users.forEach((user) => {
      expect(user.role).toBe("Mangaka");
    });
  });

  it("Tìm kiếm users theo tên hoặc email", async () => {
    const response = await request(app)
      .get("/api/auth/users?search=test")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.users.length).toBeGreaterThan(0);
  });

  // ===== UPDATE USER =====
  it("Admin cập nhật thông tin user (name, email, role)", async () => {
    const response = await request(app)
      .put(`/api/auth/users/${mangakaUser._id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Updated Name",
        email: "updated@example.com",
        role: "Assistant",
      });

    expect(response.status).toBe(200);
    expect(response.body.user.name).toBe("Updated Name");
    expect(response.body.user.email).toBe("updated@example.com");
    expect(response.body.user.role).toBe("Assistant");
  });

  it("Không thể cập nhật email trùng với user khác", async () => {
    const response = await request(app)
      .put(`/api/auth/users/${mangakaUser._id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ email: "admin@example.com" });

    expect(response.status).toBe(409);
  });

  it("Không thể cập nhật role không hợp lệ", async () => {
    const response = await request(app)
      .put(`/api/auth/users/${mangakaUser._id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ role: "InvalidRole" });

    expect(response.status).toBe(400);
  });
});
