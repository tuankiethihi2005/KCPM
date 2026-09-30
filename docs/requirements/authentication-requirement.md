# Authentication Module Requirement

## 1. Muc dich
Module `Authentication` chiu trach nhiem xac minh danh tinh nguoi dung va quan ly phien dang nhap cho toan he thong Manga Editorial & Production Management System.

Muc tieu la tach rieng phan dang nhap, dang xuat, quan ly token, xac thuc request, cung cap thong tin nguoi dung hien tai, va cac tac vu quan tri tai khoan noi bo thanh mot module doc lap de moi module nghiep vu khac co the dung chung.

## 2. Pham vi
### 2.1 In scope
- Dang nhap bang `email` va `password`.
- Dang xuat.
- Lam moi access token bang refresh token.
- Xac thuc request bang access token.
- Cung cap endpoint lay thong tin user hien tai.
- Chan truy cap neu tai khoan khong hop le hoac khong hoat dong.
- Admin tao tai khoan nhan vien.
- Admin reset mat khau cho nhan vien.

### 2.2 Out of scope
- Phan quyen theo role hoac permission.
- User tu dang ky tai khoan.
- Social login.
- MFA/2FA.
- Passwordless login.
- SSO enterprise.

## 3. Actors
- Nguoi dung he thong: `Mangaka`, `Assistant`, `Tantou Editor`, `Editorial Board`, `Admin`.
- Frontend web app.
- Backend modules can xac thuc request.
- Admin quan tri tai khoan noi bo.

## 4. Use cases chinh
### UC-01: Dang nhap
User nhap `email` va `password`.
He thong xac minh tai khoan va tra ve token cung profile co ban.

### UC-02: Dang xuat
User ket thuc phien hien tai.
He thong vo hieu hoa refresh token hoac session tuong ung.

### UC-03: Lam moi token
Client gui refresh token hop le de lay access token moi.

### UC-04: Xac thuc request
Client gui access token trong header `Authorization: Bearer <token>`.
Middleware xac minh token truoc khi cho qua cac API bao ve.

### UC-05: Lay thong tin user hien tai
Frontend goi endpoint `me` de lay profile co ban sau khi da dang nhap.

### UC-06: Admin creates employee account
Admin tao tai khoan cho nhan vien noi bo.
He thong luu user voi `role`, `status`, thong tin co ban, va mat khau khoi tao.

### UC-07: Admin resets employee password
Admin chon tai khoan nhan vien va reset mat khau.
He thong cap nhat mat khau moi theo chuan hash an toan va vo hieu hoa cac phien dang nhap cu neu ap dung.

## 5. Yeu cau chuc nang
### 5.1 Dang nhap
- Nhan `email` va `password`.
- Kiem tra email ton tai.
- So sanh mat khau bang hashing an toan.
- Tu choi tai khoan co `status` khac `Active`.
- Tra ve:
  - `accessToken`
  - `refreshToken` neu dung refresh flow
  - `user`: `id`, `name`, `email`, `role`, `avatar`, `status`

### 5.2 Dang xuat
- Cho phep dang xuat phien hien tai.
- Refresh token cua phien do phai bi vo hieu hoa hoac danh dau thu hoi.

### 5.3 Lam moi token
- Chi chap nhan refresh token hop le, chua het han, chua bi thu hoi.
- Tra access token moi.
- Co the xoay refresh token neu he thong ap dung refresh token rotation.

### 5.4 Xac thuc request
- Kiem tra access token o moi API yeu cau xac thuc.
- Neu thieu token, tra `401 Unauthorized`.
- Neu token sai, het han, hoac khong hop le, tra `401 Unauthorized`.
- Neu user khong con ton tai hoac bi khoa sau khi token duoc cap, request phai bi tu choi.

### 5.5 Endpoint `me`
- Tra ve profile hien tai cua user da xac thuc.
- Khong tra `password` hoac du lieu nhay cam.

### 5.6 Admin create user
- Chi `Admin` duoc phep tao tai khoan nhan vien.
- Input toi thieu:
  - `name`
  - `email`
  - `role`
  - `status`
  - `password` khoi tao hoac co che sinh mat khau tam thoi
- Email phai duy nhat.
- Password phai duoc hash truoc khi luu.
- User moi tao phai duoc dung ngay cho flow login neu `status = Active`.

### 5.7 Admin reset password
- Chi `Admin` duoc phep reset mat khau cho tai khoan khac.
- Admin khong can biet mat khau cu cua user.
- Mat khau moi phai duoc validate theo chinh sach password.
- Mat khau moi phai duoc hash truoc khi luu.
- He thong nen revoke toan bo refresh session hien tai cua user do sau khi reset.

## 6. Yeu cau phi chuc nang
- Password phai duoc hash truoc khi luu.
- Khong luu password dang plain text.
- Token phai co thoi han ro rang.
- Access token nen ngan han.
- Refresh token nen dai han hon access token.
- Module phai dung lai duoc cho toan bo backend.
- Can co test cho login, logout, refresh, verify token, trang thai tai khoan, admin create user, va admin reset password.

## 7. API de xuat
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/refresh`
- `GET /api/auth/me`
- `POST /api/auth/users`
- `POST /api/auth/users/:id/reset-password`

## 8. Data model toi thieu
### User
- `id`
- `name`
- `email`
- `password`
- `role`
- `avatar`
- `status`
- `createdAt`
- `updatedAt`

### Session hoac RefreshToken
- `id`
- `userId`
- `token`
- `expiresAt`
- `revokedAt`
- `createdAt`

Client khong duoc doc refresh token truc tiep. Refresh token phai duoc gui ve frontend bang httpOnly cookie.

## 9. Rule he thong
- Khong cho tai khoan `Inactive` hoac `Suspended` dang nhap.
- Khong cho client tu khai bao danh tinh user trong request body de thay cho token.
- Khong dung header gia lap user cho moi truong production.
- Neu token het han, client phai refresh hoac dang nhap lai.
- Hinh thuc cung cap tai khoan la `Admin-managed only`, khong ho tro self-registration.
- Refresh token khong duoc luu trong `localStorage`.
- Frontend chi giu access token trong memory runtime.

## 10. Tich hop voi module khac
Module `Authentication` la nen tang cho:
- `series`
- `chapter`
- `page`
- `publish`
- `task8`
- cac dashboard theo role

Moi module tren phai lay user hien tai tu auth context cua backend thay vi nhan `user_id` tu frontend nhu mot nguon tin cay.

## 11. Acceptance criteria
- User dang nhap thanh cong khi nhap dung thong tin va account dang `Active`.
- User khong dang nhap duoc khi sai mat khau hoac tai khoan bi khoa.
- Request khong co token bi chan voi `401`.
- Request co token sai hoac het han bi chan voi `401`.
- Frontend goi duoc `GET /api/auth/me` de lay profile hien tai.
- Cac API nghiep vu dung chung middleware xac thuc thay vi tu cai rieng.
- Admin tao duoc tai khoan nhan vien voi role va status hop le.
- Admin reset duoc mat khau user va user dung mat khau moi dang nhap duoc.

## 12. MVP priority
### P1
- Login
- Logout
- Verify token
- `me` endpoint

### P2
- Refresh token
- Change password
- Session invalidation
- Admin create employee account
- Admin reset employee password

### P3
- Password reset self-service
- Session history

## 13. Ghi chu trien khai theo repo hien tai
Repo hien co `User` model o [backend/src/models/UserModel.js](D:/study/uth/Cnpm/Project_CNPM/backend/src/models/UserModel.js), da co cac truong `email`, `password`, `role`, `status`.

Hien chua co self-registration va dieu nay phu hop voi bai toan noi bo. He thong nen duoc thiet ke theo huong tai khoan do `Admin` cap phat, quan ly, va thu hoi.

Mot so phan trong repo van dang gia lap user hoac role o tang request, nen can thay bang middleware xac thuc chuan cua module nay.
