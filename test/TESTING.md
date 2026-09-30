# Hướng dẫn chạy Playwright E2E Tests

## Tổng quan

Dự án sử dụng **Playwright** để kiểm tra tự động giao diện người dùng (E2E) cho hệ thống quản lý manga. Test được tổ chức theo từng role người dùng, mỗi role có bộ test riêng.

**Tổng số test:** 92 tests (tất cả đã pass)

| Role | Số lượng | Trạng thái |
|------|---------|------------|
| Admin | 27 | ✅ Passed |
| Mangaka | 20 | ✅ Passed |
| Assistant | 21 | ✅ Passed |
| Editorial Board | 24 | ✅ Passed |

---

## Yêu cầu trước khi chạy

1. **Cài đặt dependencies:**

```bash
npm install
```

2. **Cài đặt Playwright browser:**

```bash
npm run test:install
# hoặc
npx playwright install chromium
```

3. **Tạo file `.env`** (nếu chưa có) - copy từ `.env.example`

4. **Khởi động backend server:**

```bash
npm start
# hoặc
node server.js
```

Backend chạy tại `http://localhost:5000`

5. **Khởi động frontend dev server:**

```bash
cd frontend
npm run dev
```

Frontend chạy tại `http://localhost:5173`

---

## Seed dữ liệu người dùng test

Trước khi chạy test, cần seed tài khoản cho từng role:

```bash
# Admin
npm run seed:admin

# Mangaka
npm run seed:mangaka

# Assistant
npm run seed:assistant

# Editorial Board
npm run seed:editorial
```

**Lưu ý:** Nếu seed script báo lỗi kết nối MongoDB (`querySrv ECONNREFUSED`), hãy đảm bảo backend server đang chạy (vì backend đã maintain sẵn kết nối). Nếu user đã tồn tại từ lần seed trước, có thể bỏ qua bước này.

### Thông tin tài khoản test

| Role | Email | Password | Tên hiển thị |
|------|-------|----------|-------------|
| Admin | `admin@example.com` | `password123` | System Admin |
| Mangaka | `mangaka@example.com` | `password123` | Mangaka Artist |
| Assistant | `assistant@example.com` | `password123` | Lê Trợ Lý |
| Editorial Board | `editorial@example.com` | `password123` | Trần Biên Tập |

---

## Cấu trúc thư mục test

```
test/
├── playwright.config.js        # Cấu hình Playwright
├── TESTING.md                  # Tài liệu hướng dẫn (file này)
├── helpers/
│   ├── auth-helper.js          # Hàm hỗ trợ chung (login, waitForLoading, logout)
│   ├── test-data.js            # Test data & selectors cho Admin
│   ├── test-data-mangaka.js    # Test data & selectors cho Mangaka
│   ├── test-data-assistant.js  # Test data & selectors cho Assistant
│   └── test-data-editorial.js  # Test data & selectors cho Editorial Board
└── specs/
    ├── admin/
    │   ├── admin-dashboard.spec.js     # Dashboard Admin
    │   ├── admin-users.spec.js         # Quản lý tài khoản
    │   ├── admin-notifications.spec.js # Thông báo
    │   └── admin-series.spec.js        # Quản lý Series
    ├── mangaka/
    │   ├── mangaka-dashboard.spec.js   # Dashboard Mangaka
    │   ├── mangaka-series.spec.js      # Quản lý Series
    │   ├── mangaka-tasks.spec.js       # Quản lý Task
    │   └── mangaka-chapters.spec.js    # Chapter & Ranking
    ├── assistant/
    │   ├── assistant-dashboard.spec.js # Dashboard Assistant
    │   ├── assistant-tasks.spec.js     # Quản lý Task
    │   └── assistant-income.spec.js    # Thu nhập
    └── editorial/
        ├── editorial-dashboard.spec.js # Dashboard Editorial Board
        ├── editorial-reviews.spec.js   # Duyệt Series & All-Series
        └── editorial-at-risk.spec.js   # Series có nguy cơ
```

---

## Cách chạy test

### 1. Chạy tất cả test

```bash
npx playwright test --config=test/playwright.config.js
```

### 2. Chạy test theo role

```bash
# Admin (27 tests)
npm run test:admin

# Mangaka (20 tests)
npm run test:mangaka

# Assistant (21 tests)
npm run test:assistant

# Editorial Board (24 tests)
npm run test:editorial
```

### 3. Chạy với trình duyệt (headed mode) - xem trực tiếp

```bash
npm run test:admin:headed
npm run test:mangaka:headed
npm run test:assistant:headed
npm run test:editorial:headed
```

### 4. Chạy với debug mode

```bash
npm run test:admin:debug
npm run test:mangaka:debug
npm run test:assistant:debug
npm run test:editorial:debug
```

### 5. Chạy một file test cụ thể

```bash
npx playwright test test/specs/admin/admin-dashboard.spec.js --config=test/playwright.config.js
```

### 6. Xem báo cáo HTML

```bash
npm run test:report
# hoặc
npx playwright show-report test/playwright-report
```

---

## Cấu hình Playwright

File: `test/playwright.config.js`

| Cấu hình | Giá trị | Ghi chú |
|---------|---------|---------|
| `timeout` | 45000ms | Timeout mỗi test |
| `expect.timeout` | 15000ms | Timeout cho assertions |
| `workers` | 2 (local), 1 (CI) | Số worker chạy song song |
| `retries` | 0 (local), 1 (CI) | Số lần chạy lại khi fail |
| `baseURL` | `http://localhost:5173` | URL frontend |
| `trace` | `retain-on-failure` | Lưu trace khi test fail |
| `screenshot` | `only-on-failure` | Chụp màn hình khi fail |
| `video` | `retain-on-failure` | Quay video khi fail |

### Projects

```javascript
projects: [
  { name: "admin",     testDir: "./specs/admin" },
  { name: "mangaka",   testDir: "./specs/mangaka" },
  { name: "assistant", testDir: "./specs/assistant" },
  { name: "editorial", testDir: "./specs/editorial" },
]
```

---

## Test Scripts trong package.json

```json
"scripts": {
  "test": "npm run test:admin",
  "test:admin": "npx playwright test --config=test/playwright.config.js --project=admin",
  "test:admin:headed": "npx playwright test --config=test/playwright.config.js --project=admin --headed",
  "test:admin:debug": "npx playwright test --config=test/playwright.config.js --project=admin --debug",
  "test:mangaka": "npx playwright test --config=test/playwright.config.js --project=mangaka",
  "test:mangaka:headed": "npx playwright test --config=test/playwright.config.js --project=mangaka --headed",
  "test:mangaka:debug": "npx playwright test --config=test/playwright.config.js --project=mangaka --debug",
  "test:assistant": "npx playwright test --config=test/playwright.config.js --project=assistant",
  "test:assistant:headed": "npx playwright test --config=test/playwright.config.js --project=assistant --headed",
  "test:assistant:debug": "npx playwright test --config=test/playwright.config.js --project=assistant --debug",
  "test:report": "npx playwright show-report test/playwright-report",
  "test:install": "npx playwright install chromium",
  "seed:admin": "node backend/scripts/seedAuthUser.js",
  "seed:mangaka": "node backend/scripts/seedMangakaUser.js",
  "seed:assistant": "node backend/scripts/seedAssistantUser.js",
  "seed:editorial": "node backend/scripts/seedEditorialUser.js"
}
```

---

## Helper Functions

### `auth-helper.js`

Các hàm dùng chung cho tất cả test:

| Hàm | Mô tả |
|-----|-------|
| `loginViaUI(page, { email, password })` | Login qua UI: điền form đăng nhập, chờ redirect về `/` |
| `waitForLoadingToFinish(page)` | Chờ loading hoàn tất: xử lý "Đang tải" text, skeleton `.animate-pulse`, fallback 500ms |
| `logout(page)` | Logout qua nút sidebar hoặc điều hướng về `/login` |

### `loginViaUI()` flow:

1. Điều hướng đến `/login`
2. Chờ input `#email` và `#password` hiển thị
3. Điền email và password
4. Click button `button[type="submit"]`
5. Chờ URL chuyển về `/` (timeout 20s)

### `waitForLoadingToFinish()` flow:

1. Chờ text "Đang tải" xuất hiện → biến mất (timeout 15s)
2. Nếu không có, chờ `.animate-pulse` xuất hiện → biến mất (timeout 15s)
3. Nếu không có, chờ 500ms (fallback)

---

## Chi tiết từng Test Suite

### 1. Admin Tests (27 tests)

#### admin-dashboard.spec.js (6 tests)

| # | Test | Mô tả |
|---|------|-------|
| 1 | Dashboard hiển thị đúng cấu trúc | Kiểm tra title, stat cards |
| 2 | Điều hướng đến Users page qua stat card | Click "Tổng người dùng" → `/admin/users` |
| 3 | Điều hướng đến All-Series qua stat card | Click link Series → `/board/all-series` |
| 4 | Điều hướng đến Notifications | Click link thông báo → `/notifications` |
| 5 | Sidebar hiển thị navigation links | Kiểm tra dashboard link, notifications link, users link |
| 6 | Role badge Admin hiển thị | Kiểm tra text "Admin" trong sidebar |

#### admin-users.spec.js (8 tests)

| # | Test | Mô tả |
|---|------|-------|
| 1 | Users page hiển thị đúng cấu trúc | Title, tabs (Danh sách / Tạo mới), search input, table |
| 2 | Danh sách users có dữ liệu | Table rows > 0, hiển thị admin user |
| 3 | Lọc users theo role | Chọn role "Admin" trong select → kết quả lọc |
| 4 | Tìm kiếm users theo email | Điền email vào search → kết quả tìm kiếm |
| 5 | Tạo user mới qua API | Điền form tạo user → submit → kiểm tra kết quả |
| 6 | Edit user - mở modal | Click button "Sửa" → modal hiển thị với form |
| 7 | Nút Khóa/Mở khóa | Kiểm tra button `[title*=Khóa]` tồn tại |
| 8 | Nút Xóa | Kiểm tra button `[title*=Xóa]` tồn tại |

#### admin-notifications.spec.js (5 tests)

| # | Test | Mô tả |
|---|------|-------|
| 1 | Trang thông báo cấu trúc đúng | Title, filter tabs (Tất cả, Hệ thống, Công việc, Cảnh báo) |
| 2 | Hiển thị danh sách hoặc empty state | Kiểm tra notification items hoặc "Chưa có thông báo nào" |
| 3 | Lọc thông báo theo tab | Click tab "Hệ thống" → kết quả lọc |
| 4 | Điều hướng giữa notifications và dashboard | Click "Trang chủ" trong sidebar |
| 5 | Sidebar có link thông báo | Kiểm tra link `/notifications` trong sidebar |

#### admin-series.spec.js (8 tests)

| # | Test | Mô tả |
|---|------|-------|
| 1 | Điều hướng đến All-Series page | `/board/all-series` |
| 2 | Điều hướng đến At-Risk page (Admin) | `/admin/series` |
| 3 | Điều hướng đến Reviews page | `/board/reviews` |
| 4 | Điều hướng đến Releases page | `/admin/releases` |
| 5 | Điều hướng đến Ranking page | `/admin/ranking` |
| 6 | Sidebar có navigation links series | Kiểm tra các link "Danh sách Series", "Duyệt Series Mới"... |
| 7 | Điều hướng đến Mangaka series page | `/mangaka/series` |
| 8 | Sidebar navigation đến series pages | Click "Danh sách Series" → `/board/all-series` |

---

### 2. Mangaka Tests (20 tests)

#### mangaka-dashboard.spec.js (6 tests)

| # | Test | Mô tả |
|---|------|-------|
| 1 | Dashboard hiển thị đúng | Title có nội dung |
| 2 | Quick links đến series management | "Series của tôi" section, link `/mangaka/series` |
| 3 | Link tạo series mới | Link `/mangaka/series/new` |
| 4 | Ranking widget | Section "Ranking" hiển thị |
| 5 | Sidebar menu items | Links: series, chapters, tasks, ranking |
| 6 | Role badge Mangaka | Text "Mangaka" trong sidebar |

#### mangaka-series.spec.js (6 tests)

| # | Test | Mô tả |
|---|------|-------|
| 1 | Series list page hiển thị | Title "Series", button "Tạo series mới" |
| 2 | Series list hoặc empty state | Cards hoặc "Chưa có series" |
| 3 | Điều hướng đến create form | Click "Tạo series mới" → `/mangaka/series/new` |
| 4 | Create form có đủ fields | Input fields, Tạo series button, Quay lại button |
| 5 | Tạo series qua API | POST `/api/series` → kiểm tra trong list |
| 6 | Điều hướng đến series detail | Click series card → `/mangaka/series/:id` |

#### mangaka-tasks.spec.js (4 tests)

| # | Test | Mô tả |
|---|------|-------|
| 1 | Tasks page hiển thị | Title "Task", tab "Danh sách" |
| 2 | Create task tab với form | Select Series, Assistant, input Lương, Deadline, button Xác nhận |
| 3 | Task list hiển thị | Danh sách task hoặc empty state |
| 4 | Click task xem detail | Click task → detail panel mở |

#### mangaka-chapters.spec.js (4 tests)

| # | Test | Mô tả |
|---|------|-------|
| 1 | Điều hướng chapter list | `/chapter-list` |
| 2 | Điều hướng ranking page | `/mangaka/ranking` |
| 3 | Từ dashboard đến chapters | Click sidebar link → `/chapter-list` |
| 4 | Từ dashboard đến ranking | Click sidebar link → `/mangaka/ranking` |

---

### 3. Assistant Tests (21 tests)

#### assistant-dashboard.spec.js (8 tests)

| # | Test | Mô tả |
|---|------|-------|
| 1 | Dashboard hiển thị đúng | Title chứa "Trợ lý" |
| 2 | Section "Nhiệm vụ được giao" | Widget hiển thị, link `/assistant/tasks` |
| 3 | Section "Thống kê thu nhập" | Widget hiển thị |
| 4 | Điều hướng đến Tasks page | Click link → `/assistant/tasks` |
| 5 | Điều hướng đến Income page | Click link → `/assistant/income` |
| 6 | Sidebar menu items | Links: tasks, income; badge "Assistant" |
| 7 | Sidebar navigation đến tasks | Click sidebar → `/assistant/tasks` |
| 8 | Sidebar navigation đến income | Click sidebar → `/assistant/income` |

#### assistant-tasks.spec.js (7 tests)

| # | Test | Mô tả |
|---|------|-------|
| 1 | Tasks page tiêu đề đúng | "Công việc của tôi" |
| 2 | Filter bar với status options | "Trạng thái:", buttons: Tất cả, Mới phân công, Đang vẽ, Chờ duyệt, Đã duyệt |
| 3 | Danh sách task hiển thị | Cards hoặc "Không có công việc nào" |
| 4 | Lọc task theo status | Click "Mới phân công" → kết quả |
| 5 | Xem chi tiết task | Click card → detail section hiển thị |
| 6 | Form nộp bài cho task đang active | Button "Nộp bài" hiển thị |
| 7 | Điều hướng dashboard từ sidebar | Click "Trang chủ" → `/` |

#### assistant-income.spec.js (6 tests)

| # | Test | Mô tả |
|---|------|-------|
| 1 | Income page tiêu đề đúng | "Thu nhập hàng tháng" |
| 2 | Stat cards với metrics | Tổng thu nhập, Đã thanh toán, Đang chờ, Số Task Hoàn Thành |
| 3 | Bảng chi tiết thu nhập | Headers: Tháng, Đơn giá, Trạng thái; data hoặc empty |
| 4 | Month filter select | Select `#monthFilter` với option "Tất cả các tháng" |
| 5 | Refresh button | Button "Tải lại dữ liệu" |
| 6 | Sidebar navigation đến tasks | Click sidebar → `/assistant/tasks` |

---

### 4. Editorial Board Tests (24 tests)

#### editorial-dashboard.spec.js (9 tests)

| # | Test | Mô tả |
|---|------|-------|
| 1 | Dashboard hiển thị đúng title | Title chứa "Biên Tập" |
| 2 | Widget "Series Chờ Xét Duyệt" | Widget pending series hiển thị |
| 3 | Widget "Cảnh Báo Báo Động" | Widget at-risk series hiển thị |
| 4 | Widget "Top Xếp Hạng Hiện Tại" | Widget leaderboard hiển thị |
| 5 | Sidebar menu items | 5 links: all-series, reviews, at-risk, releases, ranking |
| 6 | Role badge "Editorial" | Text "Editorial" trong sidebar |
| 7 | Sidebar navigation đến all-series | Click → `/board/all-series` |
| 8 | Sidebar navigation đến reviews | Click → `/board/reviews` |
| 9 | Sidebar navigation đến at-risk | Click → `/board/at-risk` |

#### editorial-reviews.spec.js (9 tests)

| # | Test | Mô tả |
|---|------|-------|
| 1 | Pending series page | Title "Series chờ duyệt" |
| 2 | Pending list hoặc empty state | Cards hoặc "Không có series" |
| 3 | All-Series page | Title "Toàn bộ Series" |
| 4 | Search và filter trên all-series | Input search, filter buttons "Tất cả", "Active" |
| 5 | Series cards trên all-series | Cards hoặc empty state |
| 6 | Sidebar navigation đến reviews | Click sidebar → `/board/reviews` |
| 7 | Sidebar navigation đến all-series | Click sidebar → `/board/all-series` |
| 8 | Điều hướng đến releases page | `/board/releases` |
| 9 | Điều hướng đến ranking page | `/board/ranking` |

#### editorial-at-risk.spec.js (7 tests)

| # | Test | Mô tả |
|---|------|-------|
| 1 | At-risk series page | Title chứa "series có nguy cơ" |
| 2 | Series cards hoặc empty state | Cards hoặc "Không có series" |
| 3 | Status management controls | Select `.neo-select` và button "Cập nhật" |
| 4 | Dossier toggle + vote form | Button "Hồ sơ quyết định" → mở vote form |
| 5 | Sidebar navigation đến at-risk | Click sidebar → `/board/at-risk` |
| 6 | Sidebar navigation đến notifications | Click sidebar → `/notifications` |

---

## Xử lý sự cố thường gặp

### 1. Lỗi kết nối MongoDB khi seed

```
Error connecting to MongoDB: querySrv ECONNREFUSED _mongodb._tcp.cluster0.zujephz.mongodb.net
```

**Nguyên nhân:** Seed scripts tạo kết nối MongoDB mới có thể bị chặn DNS.
**Cách khắc phục:**
- Đảm bảo backend server (`npm start`) đang chạy — nó đã maintain sẵn kết nối
- Kiểm tra user đã tồn tại bằng cách login thử
- Nếu user chưa tồn tại, tạo qua API admin

### 2. Lỗi port đã được sử dụng

```
Error: listen EADDRINUSE :::5173
```

**Cách khắc phục:** Kill process cũ và khởi động lại:
```bash
# Tìm process trên port
netstat -ano | findstr :5173
# Kill process theo PID
taskkill /PID <PID> /F
```

### 3. Test fail với strict mode violation

**Nguyên nhân:** Locator match nhiều element.
**Cách khắc phục:** Thêm `.first()` hoặc dùng selector cụ thể hơn.

### 4. Test timeout

**Nguyên nhân:** API response chậm hoặc loading kéo dài.
**Cách khắc phục:**
- Tăng timeout trong config: `timeout: 60000`
- Đảm bảo backend/frontend đã khởi động xong trước khi chạy test

### 5. Test fail vì login không thành công

**Nguyên nhân:** User chưa được seed hoặc token hết hạn.
**Cách khắc phục:**
- Chạy seed script tương ứng
- Kiểm tra thông tin đăng nhập trong file `test-data-*.js`

---

## CI/CD Integration

Để chạy test trong CI, set biến môi trường:

```bash
export CI=true
```

Khi đó Playwright sẽ:
- Retry 1 lần khi test fail
- Chạy với 1 worker
- Forbid `test.only` (ngăn chặn commit thiếu test)

---

## Tips & Tricks

1. **Chạy nhanh hơn:** Dùng `--workers=4` để chạy nhiều test song song
2. **Debug:** Dùng `--debug` mode hoặc `await page.pause()` trong code
3. **Xem trace:** `npx playwright show-trace path/to/trace.zip`
4. **Quay video:** Config `video: "on"` trong playwright.config.js để quay tất cả test
5. **Tạo test mới:** Copy cấu trúc từ file test hiện có, sử dụng `loginViaUI()` trong `beforeEach`
