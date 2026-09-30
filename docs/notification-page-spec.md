# SPECIFICATION - Trang Thông Báo (Notification System)

## 1. Tổng Quan

Xây dựng hệ thống thông báo **Phase 1 (MVP)** cho phép người dùng xem và quản lý các thông báo từ hệ thống quản lý manga.

**Vai trò hỗ trợ:** Tất cả roles (Admin, Assistant, Editorial Board, Mangaka, Tantou Editor)

---

## 2. Thông báo theo từng Role

### 2.1. Admin

| Loại | Thông báo | Mô tả |
|---|---|---|
| 🔔 Hệ thống | Người dùng mới đăng ký | Có user mới vừa tạo tài khoản |
| 🔔 Hệ thống | Bảo trì hệ thống | Lịch bảo trì sắp diễn ra |
| 🔔 Hệ thống | Cập nhật tính năng | Tính năng mới được triển khai |
| 📋 Công việc | Task cần phê duyệt | Task đang chờ admin review (nếu có) |
| ⚠️ Cảnh báo | Series có nguy cơ | Series sắp bị hủy do không đạt chỉ tiêu |
| ⚠️ Cảnh báo | Hệ thống gặp sự cố | Lỗi hệ thống cần xử lý |

### 2.2. Mangaka (Tác giả)

| Loại | Thông báo | Mô tả |
|---|---|---|
| 🔔 Hệ thống | Series được tạo | Xác nhận series mới đã được tạo thành công |
| 🔔 Hệ thống | Series được duyệt | Series đã được Editorial Board phê duyệt |
| 🔔 Hệ thống | Series bị từ chối | Series không được phê duyệt (kèm lý do) |
| 📋 Công việc | Task hoàn thành | Trợ lý đã hoàn thành task và gửi lại |
| 📋 Công việc | Task cần chỉnh sửa | Task của trợ lý cần revision |
| 📋 Công việc | Chapter được publish | Chapter đã được xuất bản chính thức |
| 📋 Công việc | Chapter cần chỉnh sửa | Chapter bị yêu cầu chỉnh sửa bởi Editor |
| ⚠️ Cảnh báo | Deadline sắp đến hạn | Chapter sắp quá hạn nộp |
| ⚠️ Cảnh báo | Series có nguy cơ | Series bị đánh dấu at-risk do ranking thấp |

### 2.3. Assistant (Trợ lý)

| Loại | Thông báo | Mô tả |
|---|---|---|
| 📋 Công việc | Task mới được giao | Mangaka vừa giao task mới cho bạn |
| 📋 Công việc | Task được duyệt | Task đã được Mangaka chấp thuận |
| 📋 Công việc | Task cần chỉnh sửa | Task bị từ chối, cần sửa lại |
| ⚠️ Cảnh báo | Deadline sắp đến hạn | Task sắp hết hạn nộp |

### 2.4. Tantou Editor (Biên tập viên phụ trách)

| Loại | Thông báo | Mô tả |
|---|---|---|
| 🔔 Hệ thống | Series mới được phân công | Bạn được phân công phụ trách series mới |
| 📋 Công việc | Chapter sẵn sàng review | Chapter đã hoàn thành và chờ bạn review |
| 📋 Công việc | Chapter được publish | Chapter đã được xuất bản |
| 📋 Công việc | Phản hồi từ tác giả | Mangaka phản hồi về góp ý của bạn |
| ⚠️ Cảnh báo | Series cần chú ý | Series bạn phụ trách đang có dấu hiệu chậm tiến độ |
| ⚠️ Cảnh báo | Deadline sắp đến | Chapter sắp đến hạn phát hành |

### 2.5. Editorial Board (Ban biên tập)

| Loại | Thông báo | Mô tả |
|---|---|---|
| 🔔 Hệ thống | Series mới chờ duyệt | Có series mới cần được phê duyệt |
| 📋 Công việc | Chapter chờ phát hành | Chapter đã sẵn sàng để lên lịch phát hành |
| 📋 Công việc | Lịch phát hành cập nhật | Thay đổi trong lịch phát hành |
| ⚠️ Cảnh báo | Series có nguy cơ | Series cần được đánh giá lại do ranking thấp |
| ⚠️ Cảnh báo | Series bị báo cáo | Có vấn đề về nội dung/tác quyền |
| 🔔 Hệ thống | Bảng xếp hạng cập nhật | Ranking hàng tháng đã được cập nhật |

---

## 3. Những gì sẽ giữ nguyên

| Thành phần | Trạng thái | Lý do |
|---|---|---|
| `NotificationModel` hiện tại | **Giữ nguyên, không sửa** | Đã đủ cho MVP, không cần mở rộng schema |
| Menu "Thông báo" trong sidebar | **Giữ nguyên** | Đã có path `/notifications` |
| `NOTIFICATION_SYSTEM_REQUIREMENTS.md` | **Giữ nguyên** | Là tài liệu tham khảo cho các phase sau |

---

## 4. Backend - Sẽ xây dựng

### 4.1. File Structure

```
backend/src/
├── controllers/
│   └── notificationController.js    # MỚI
├── routes/
│   └── notificationRoutes.js        # MỚI
├── services/
│   └── notificationService.js       # MỚI
```

### 4.2. API Endpoints

| Method | Endpoint | Chức năng | Auth |
|---|---|---|---|
| `GET` | `/api/notifications` | Lấy danh sách thông báo (phân trang, filter theo `type`, `is_read`) | ✅ JWT |
| `GET` | `/api/notifications/unread-count` | Lấy số lượng chưa đọc | ✅ JWT |
| `PUT` | `/api/notifications/:id/read` | Đánh dấu 1 thông báo đã đọc | ✅ JWT |
| `PUT` | `/api/notifications/mark-all-read` | Đánh dấu tất cả đã đọc | ✅ JWT |
| `DELETE` | `/api/notifications/:id` | Xóa 1 thông báo | ✅ JWT |

**Chi tiết từng endpoint:**

#### `GET /api/notifications`
- **Query params:** `page` (default 1), `limit` (default 20), `type` (filter), `is_read` (filter)
- **Sort:** Mới nhất trước (theo `createdAt`)
- **Response:** `{ data: [...], pagination: { page, limit, total, totalPages } }`

#### `GET /api/notifications/unread-count`
- **Response:** `{ count: Number }`

#### `PUT /api/notifications/:id/read`
- **Validation:** Chỉ user sở hữu mới đánh dấu được
- **Idempotent:** Gọi nhiều lần không lỗi

#### `PUT /api/notifications/mark-all-read`
- **Logic:** Cập nhật tất cả `is_read: false` → `true` của user hiện tại

#### `DELETE /api/notifications/:id`
- **Validation:** Chỉ user sở hữu mới xóa được

### 4.3. NotificationService
- `createNotification({ user_id, type, title, message, target_type?, target_id? })` — Tạo thông báo cho user
- `getNotifications(user_id, query)` — Lấy danh sách + phân trang
- `getUnreadCount(user_id)` — Đếm chưa đọc
- `markAsRead(notification_id, user_id)` — Đánh dấu đã đọc
- `markAllAsRead(user_id)` — Đánh dấu tất cả đã đọc
- `deleteNotification(notification_id, user_id)` — Xóa

### 4.4. Register Routes
- Thêm `app.use("/api/notifications", notificationRoutes)` vào `app.js`

---

## 5. Frontend - Sẽ xây dựng

### 5.1. File Structure

```
frontend/src/
├── pages/
│   ├── NotificationPage.jsx         # MỚI - Trang chính
│   └── components/                   # MỚI
│       ├── NotificationItem.jsx     # Component 1 thông báo
│       ├── NotificationBadge.jsx    # Badge đếm chưa đọc (gắn vào sidebar)
│       └── NotificationSkeleton.jsx # Loading skeleton
├── services/
│   └── notificationService.js       # MỚI - API calls
```

### 5.2. Pages

#### NotificationPage (`/notifications`)
- **URL:** `/notifications`
- **Bố cục:**
  ```
  ┌─────────────────────────────────────────────┐
  │ [Title] Thông báo            [Mark all read] │
  ├─────────────────────────────────────────────┤
  │ [Filter tabs: Tất cả | System | Task | Warn] │
  ├─────────────────────────────────────────────┤
  │ NotificationItem 1                           │
  │ NotificationItem 2                           │
  │ ...                                          │
  │ [Phân trang]                                 │
  └─────────────────────────────────────────────┘
  ```

- **Filter tabs:** 4 tab: `Tất cả`, `Hệ thống`, `Công việc`, `Cảnh báo`
  - Tương ứng: `all`, `System`, `Task_Update`, `Warning`
- **Sort:** Mới nhất → cũ nhất (mặc định). Có thể toggle để xem cũ → mới.
- **Phân trang:** 20 items/trang, nút Previous/Next + hiển thị "trang X/Y"
- **Empty state:** "Chưa có thông báo nào" + icon
- **Loading state:** Skeleton loading 3 items
- **Error state:** "Không thể tải thông báo" + button "Thử lại"

### 5.3. Components

#### NotificationItem
- **Hiển thị:**
  ```
  ┌──────────────────────────────────────────────┐
  │ [●] [Icon] Tên loại   ·   5 phút trước    [🗑] │
  │        Tiêu đề thông báo (bold nếu chưa đọc)    │
  │        Nội dung thông báo (1-2 dòng)            │
  └──────────────────────────────────────────────┘
  ```
- **Icon theo loại:**
  - `System` → 🔔 (gray)
  - `Task_Update` → 📋 (blue)
  - `Warning` → ⚠️ (orange)
  - `Payment` → 💰 (green)
- **Relative time:** Hiển thị "Vừa xong", "X phút trước", "X giờ trước", "Hôm qua", "Ngày X"
- **Unread indicator:** Dấu ● xanh bên trái + title **bold**
- **Hover effect:** Đổi màu nền
- **Click:** Thông báo đã đọc tự động đánh dấu `is_read = true`
- **Actions:** Icon xóa (🗑) - có confirm dialog

#### NotificationBadge
- Hiển thị số thông báo chưa đọc trên menu sidebar
- Nếu count = 0, không hiển thị
- Nếu count > 99, hiển thị "99+"
- Polling mỗi 30 giây để cập nhật

#### NotificationSkeleton
- 3 placeholder items với hiệu ứng pulse/loading
- Dùng trong lúc fetch dữ liệu

### 5.4. Services

#### `notificationService.js`
```javascript
// Sử dụng apiClient hiện có (axios + auto-refresh token)
- getNotifications({ page, limit, type, is_read })
- getUnreadCount()
- markAsRead(id)
- markAllAsRead()
- deleteNotification(id)
```

### 5.5. Routes
- Thêm `<Route path="/notifications" element={<NotificationPage />} />` vào `AppRoutes.jsx`
- Nằm trong ProtectedLayout (yêu cầu đăng nhập)

---

## 6. Database

### 6.1. Sử dụng nguyên NotificationModel hiện có
- **Không thêm field mới** (giữ nguyên `user_id`, `target_type`, `target_id`, `title`, `message`, `type`, `is_read`, `timestamps`)
- **Chỉ thêm 1 index duy nhất:**

```javascript
notificationSchema.index({ user_id: 1, createdAt: -1 });
```

---

## 7. Luồng hoạt động (Data Flow)

```
[User click menu "Thông báo"]
        ↓
[NotificationPage mount]
        ↓
[GET /api/notifications?page=1&limit=20]   ← notificationService
        ↓
[Controller → Service → MongoDB]
        ↓
[Render danh sách NotificationItem]
        ↓
[Polling: GET /api/notifications/unread-count (mỗi 30s)]
        ↓
[Cập nhật NotificationBadge trên sidebar]
```

---

## 8. Seed Data

Script seed (`backend/scripts/seedNotifications.js`) sẽ tạo thông báo mẫu theo từng role:

| Role | Số lượng | Các loại |
|---|---|---|
| Admin | 5 | 2 System, 2 Warning, 1 Task_Update |
| Mangaka | 6 | 2 System, 2 Task_Update, 1 Warning, 1 Payment |
| Assistant | 4 | 3 Task_Update, 1 Warning |
| Tantou Editor | 5 | 1 System, 2 Task_Update, 2 Warning |
| Editorial Board | 4 | 1 System, 2 Task_Update, 1 Warning |

---

## 9. Những gì KHÔNG làm trong Phase 1

| Tính năng | Lý do không làm |
|---|---|
| WebSocket/Socket.IO (real-time) | Phức tạp, dùng polling là đủ cho MVP |
| NotificationPreferences (cài đặt) | Yêu cầu thêm model + UI phức tạp |
| Email notification | Cần tích hợp email service |
| Push notification browser | Cần service worker |
| Bulk delete (xóa nhiều) | Thêm UX phức tạp, chưa cần thiết |
| Deep linking (click vào link) | Sẽ làm ở Phase 2 |
| Tự động tạo notification khi có sự kiện | Phase 1 chỉ có UI quản lý + seed data mẫu |
| Advanced analytics/thống kê | Chưa cần |

---

## 10. Thiết kế giao diện (chi tiết)

### 10.1. NotificationPage - Desktop

```
┌──────────────────────────────────────────────────────────────────────┐
│  🔔 Thông báo                                             [✓ Đã đọc] │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │ [Tất cả] [📋 Công việc]  [⚠️ Cảnh báo] [🔔 Hệ thống]          │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ● 📋 Công việc · 2 phút trước                                    🗑 │
│    Task #456 đã được duyệt                                            │
│    Chapter 3 của series "ABC" đã được phê duyệt                       │
│  ───────────────────────────────────────────────────────────────────  │
│                                                                      │
│  ● ⚠️ Cảnh báo · 1 giờ trước                                      🗑 │
│    Deadline sắp đến hạn                                               │
│    Chapter 5 cần hoàn thành trước 20/07/2026                          │
│  ───────────────────────────────────────────────────────────────────  │
│                                                                      │
│    📋 Công việc · Hôm qua                                           🗑 │
│    Task #123 đã được giao cho bạn                                     │
│    Vui lòng kiểm tra và bắt đầu thực hiện                             │
│  ───────────────────────────────────────────────────────────────────  │
│                                                                      │
│  🔔 Hệ thống · 3 ngày trước                                        🗑 │
│    Chào mừng bạn đến với Hệ thống                                     │
│    Hệ thống quản lý Manga đã sẵn sàng để sử dụng                      │
│  ───────────────────────────────────────────────────────────────────  │
│                                                                      │
│                                      [Trước 1/3 Sau]                 │
└──────────────────────────────────────────────────────────────────────┘
```

### 10.2. NotificationPage - Mobile

```
┌──────────────────────┐
│ 🔔 Thông báo   [✓]   │
├──────────────────────┤
│ [Tất cả] [📋] [⚠️]   │
├──────────────────────┤
│ ● 📋 · 2 phút 🗑    │
│ Task #456 được duyệt │
│──────────────────────│
│ ● ⚠️ · 1 giờ  🗑    │
│ Deadline sắp đến   │
│──────────────────────│
│   📋 · Hôm qua  🗑   │
│ Task #123 đã giao   │
│──────────────────────│
│   🔔 · 3 ngày  🗑    │
│ Chào mừng bạn       │
└──────────────────────┘
```

### 10.3. Empty State

```
┌────────────────────────────────────┐
│  📭                               │
│  Chưa có thông báo nào            │
│  Khi có thông báo mới, chúng      │
│  sẽ xuất hiện ở đây.              │
└────────────────────────────────────┘
```

---

## 11. Timeline dự kiến

| Bước | Nội dung | Thời gian |
|---|---|---|
| 1 | Backend: Service + Controller + Routes | ~1.5h |
| 2 | Backend: Seed data + Register routes | ~0.5h |
| 3 | Frontend: notificationService | ~0.5h |
| 4 | Frontend: NotificationItem + NotificationBadge + Skeleton | ~1h |
| 5 | Frontend: NotificationPage (full) | ~1.5h |
| 6 | Frontend: Register routes + sidebar badge | ~0.5h |
| 7 | Kiểm tra + fix lỗi | ~1h |

**Tổng:** ~6-7h làm việc

---

## 12. Công nghệ sử dụng

- **Backend:** Express.js, Mongoose, JWT middleware (có sẵn)
- **Frontend:** React 19, Tailwind CSS 4, Zustand, React Router 7, lucide-react
- **API Client:** Axios (apiClient có sẵn trong project)
- **Testing:** Jest + Supertest (backend)

---

## 13. Thứ tự thực hiện sau khi duyệt

1. **Backend** → notificationService → notificationController → notificationRoutes → seed → app.js
2. **Frontend** → notificationService → components (Item, Badge, Skeleton) → NotificationPage → routes → sidebar

---

*Tạo ngày: 05/07/2026*
*Project: Manga Management System - Notification Module Phase 1*
