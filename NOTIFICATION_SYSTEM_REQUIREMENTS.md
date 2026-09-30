# Hệ Thống Thông Báo - Yêu Cầu Bổ Sung

## Trạng Thái Hiện Tại

### ✅ Có sẵn:
1. **Notification Model** (`backend/src/models/NotificationModel.js`)
   - Cấu trúc cơ bản với các trường: `user_id`, `target_type`, `target_id`, `title`, `message`, `type`, `is_read`
   - Phân loại thông báo: `System`, `Task_Update`, `Warning`

2. **Menu "Thông báo"** trong `ProtectedLayout.jsx`
   - Đường dẫn: `/notifications`
   - Hiển thị cho tất cả người dùng đã đăng nhập

### ❌ Thiếu hoàn toàn:
- **Backend API**: Controller, routes, service
- **Frontend Pages**: Trang `/notifications`
- **UI Components**: Notification item, badge, dropdown
- **Real-time updates**: WebSocket/polling
- **Notification logic**: Hệ thống tạo/thông báo sự kiện

## Yêu Cầu Bổ Sung

### 1. Backend API

#### Controller & Routes:
```
GET    /api/notifications           - Lấy danh sách thông báo của user
GET    /api/notifications/unread    - Lấy số lượng thông báo chưa đọc
PUT    /api/notifications/:id/read  - Đánh dấu thông báo đã đọc
PUT    /api/notifications/mark-all-read - Đánh dấu tất cả đã đọc
POST   /api/notifications           - Tạo thông báo mới (admin/system)
DELETE /api/notifications/:id       - Xóa thông báo
```

#### Service Layer:
- **NotificationService**: Xử lý logic tạo, lấy, cập nhật thông báo
- **NotificationEventEmitter**: Phát sự kiện thông báo từ các module khác
- **Real-time Service**: WebSocket/SSE cho real-time updates

### 2. Frontend Components

#### Pages:
- **NotificationPage** (`/notifications`)
  - Hiển thị danh sách thông báo
  - Filter theo loại (Task, Series, System, Warning)
  - Sort theo thời gian (mới nhất, cũ nhất)
  - Bulk actions (mark all read, delete selected)

#### Components:
- **NotificationItem**: Hiển thị từng thông báo
  - Icon theo loại
  - Title & message
  - Time format (relative: "5 phút trước", "hôm qua")
  - Read/unread indicator
  - Action buttons (mark read, delete)

- **NotificationBadge**: Hiển thị số thông báo chưa đọc
  - Trên menu navigation
  - Real-time updates

- **NotificationDropdown**: Dropdown trên header
  - Hiển thị 5-10 thông báo gần nhất
  - Quick actions (mark as read)
  - Link đến trang thông báo đầy đủ

### 3. Các Loại Thông Báo Cần Thiết

#### A. Task Updates (Assistant/Mangaka):
- Task được giao mới
- Task hoàn thành
- Task bị từ chối/chỉnh sửa
- Deadline sắp đến

#### B. Series Approvals (Mangaka/Editor/Board):
- Series mới được tạo
- Series được duyệt/từ chối
- Series có nguy cơ (at-risk)
- Series ranking thay đổi

#### C. Chapter Publishing (Mangaka/Editor):
- Chapter được publish
- Chapter cần chỉnh sửa
- Chapter bị từ chối

#### D. System Announcements (All users):
- Thông báo hệ thống từ Admin
- Maintenance schedule
- Feature updates

#### E. Warning Notifications (All users):
- Series có nguy cơ bị hủy
- Deadline sắp hết hạn
- Quality warnings

### 4. Tính Năng Cần Có

#### Core Features:
1. **Real-time updates**: WebSocket hoặc polling mỗi 30 giây
2. **Filter & Sort**: Lọc theo loại, trạng thái, thời gian
3. **Bulk actions**: Đánh dấu nhiều thông báo cùng lúc
4. **Deep linking**: Click thông báo dẫn đến trang liên quan
5. **Push notifications**: Thông báo trình duyệt (optional)

#### Advanced Features:
1. **Notification preferences**: User có thể tắt loại thông báo không mong muốn
2. **Email notifications**: Gửi email cho thông báo quan trọng
3. **Notification templates**: Template cho từng loại thông báo
4. **Notification analytics**: Thống kê số lượng thông báo theo loại

### 5. UI/UX Requirements

#### Visual Design:
- **Color coding**: Màu sắc khác nhau cho từng loại thông báo
  - Task: Blue
  - Series: Green  
  - Warning: Orange
  - System: Gray

- **Icons**: Icon phù hợp với từng loại
  - Task: 📝
  - Series: 📚
  - Warning: ⚠️
  - System: 🔔

#### Responsive Design:
- **Mobile**: Danh sách dọc, swipe actions
- **Tablet**: 2-column layout
- **Desktop**: 3-column layout với filter sidebar

#### Accessibility:
- Keyboard navigation
- Screen reader support
- High contrast mode

### 6. Integration Points

#### Backend Events cần trigger thông báo:
1. **Task Service**:
   - `task.created` → Thông báo cho Assistant
   - `task.completed` → Thông báo cho Mangaka
   - `task.updated` → Thông báo cho cả hai

2. **Series Service**:
   - `series.created` → Thông báo cho Mangaka
   - `series.approved` → Thông báo cho Mangaka, Editor
   - `series.rejected` → Thông báo cho Mangaka
   - `series.atRisk` → Thông báo cho Board, Editor

3. **Chapter Service**:
   - `chapter.published` → Thông báo cho Mangaka, Editor
   - `chapter.needsRevision` → Thông báo cho Mangaka

4. **System Events**:
   - `system.announcement` → Thông báo cho tất cả users
   - `system.maintenance` → Thông báo cho tất cả users

### 7. Ưu Tiên Triển Khai

#### Phase 1 (MVP - 1 tuần):
1. Backend API cơ bản (GET notifications, mark as read)
2. NotificationPage frontend đơn giản
3. NotificationBadge trên menu
4. Basic real-time updates (polling)

#### Phase 2 (2 tuần):
1. Filter & sort functionality
2. Bulk actions
3. Deep linking
4. Email notifications cho thông báo quan trọng

#### Phase 3 (3 tuần):
1. Push notifications
2. Notification preferences
3. Advanced analytics
4. Performance optimization

### 8. Technical Stack

#### Backend:
- **Controller**: Express.js
- **Database**: MongoDB (NotificationModel)
- **Real-time**: Socket.io hoặc Server-Sent Events (SSE)
- **Event System**: Node.js EventEmitter

#### Frontend:
- **Framework**: React.js
- **State Management**: Zustand (existing authStore pattern)
- **Real-time**: Socket.io client hoặc polling với axios
- **UI Library**: Tailwind CSS (existing)

#### Testing:
- **Backend**: Jest, Supertest
- **Frontend**: Jest, React Testing Library
- **E2E**: Cypress hoặc Playwright

### 9. Database Schema Extensions

#### NotificationModel cần bổ sung:
```javascript
{
  // Existing fields...
  priority: { type: String, enum: ["low", "medium", "high", "urgent"], default: "medium" },
  action_url: { type: String }, // URL để navigate khi click
  metadata: { type: mongoose.Schema.Types.Mixed }, // Additional data
  expires_at: { type: Date }, // Auto-delete after expiry
  category: { type: String, enum: ["task", "series", "chapter", "system", "warning"] }
}
```

#### Indexes cần thiết:
```javascript
notificationSchema.index({ user_id: 1, is_read: 1, created_at: -1 });
notificationSchema.index({ created_at: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 }); // 30 days TTL
```

### 10. Security Considerations

1. **Authentication**: Chỉ user mới xem được thông báo của mình
2. **Authorization**: Kiểm tra role-based permissions
3. **Rate Limiting**: Giới hạn số lượng thông báo tạo ra
4. **Data Privacy**: Không expose thông tin nhạy cảm trong thông báo
5. **XSS Protection**: Sanitize thông báo content

---

## Kết Luận

Hệ thống thông báo hiện tại chỉ có **model** mà không có **UI** hay **API**. Cần xây dựng từ đầu hệ thống thông báo đầy đủ để người dùng có thể nhận và quản lý thông báo từ hệ thống manga management.

**Ưu tiên cao**: Triển khai Phase 1 (MVP) để có hệ thống thông báo cơ bản hoạt động, sau đó mở rộng với các tính năng nâng cao.