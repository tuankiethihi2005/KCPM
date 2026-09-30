# Authentication System Design

## 1. Muc tieu
Tai lieu nay mo ta thiet ke he thong day du cho module `Authentication`, bao gom:
- backend architecture
- API contract
- token va session strategy
- frontend UI/UX pattern
- security rule
- test strategy
- admin account provisioning flow

Pham vi gom:
- dang nhap
- dang xuat
- lam moi access token
- xac thuc request bang access token
- lay thong tin user hien tai
- admin tao tai khoan nhan vien
- admin reset mat khau nhan vien
- xu ly phien het han va tai khoan khong hoat dong

Tai lieu nay bam theo [authentication-requirement.md](/D:/study/uth/Cnpm/Project_CNPM/docs/requirements/authentication-requirement.md).

## 2. Boi canh hien tai
Repo hien co `User` model tai [backend/src/models/UserModel.js](/D:/study/uth/Cnpm/Project_CNPM/backend/src/models/UserModel.js) voi cac truong:
- `email`
- `password`
- `role`
- `status`

He thong la he thong noi bo, do do account provisioning nen do `Admin` quan ly. Khong can thiet ke public signup flow.

## 3. Muc tieu thiet ke
- Co mot module auth duy nhat cho toan he thong.
- Tach ro xac thuc khoi phan quyen.
- Khong tin du lieu user den tu frontend ngoai token hop le.
- Ho tro frontend duy tri phien on dinh voi refresh flow.
- Ho tro quy trinh quan tri tai khoan noi bo do `Admin` thuc hien.
- De tich hop cho cac module `series`, `chapter`, `page`, `publish`, `task8`.

## 4. Kien truc tong the
### 4.1 Backend module structure
De xuat cau truc:
- `backend/src/modules/auth/controllers`
- `backend/src/modules/auth/services`
- `backend/src/modules/auth/repositories`
- `backend/src/modules/auth/routes`
- `backend/src/modules/auth/middlewares`
- `backend/src/modules/auth/validators`
- `backend/src/modules/auth/utils`
- `backend/src/modules/auth/constants`

### 4.2 Thanh phan chinh
- `AuthController`: nhan request va tra response.
- `AuthService`: xu ly login, logout, refresh, verify, me.
- `UserProvisioningService`: xu ly admin create user va admin reset password.
- `TokenService`: tao va xac minh JWT.
- `PasswordService`: hash va compare password.
- `SessionRepository`: luu va revoke refresh token/session.
- `AuthMiddleware`: xac thuc access token, gan `req.user`.

### 4.3 Phu thuoc
- `jsonwebtoken`
- `bcryptjs`
- `mongoose`
- `dotenv`

## 5. Data design
### 5.1 User model
Tai su dung model hien co:
- `id`
- `name`
- `email`
- `password`
- `role`
- `avatar`
- `status`
- `createdAt`
- `updatedAt`

### 5.2 Session hoac RefreshToken model
De xuat them collection moi:
- `user_id`
- `token_hash`
- `expires_at`
- `revoked_at`
- `device_info`
- `ip_address`
- `created_at`
- `updated_at`

Ly do:
- ho tro logout dung nghia
- ho tro revoke token
- ho tro rotation refresh token
- ho tro audit muc co ban

## 6. Token strategy
### 6.1 Access token
- Dung JWT.
- Song ngan han, vi du 15-30 phut.
- Chua:
  - `sub` la user id
  - `role`
  - `status` neu can
  - `iat`
  - `exp`

### 6.2 Refresh token
- Song dai hon access token, vi du 7-30 ngay.
- Nen hash truoc khi luu DB.
- Moi refresh token map toi mot session record.
- Client nhan refresh token qua httpOnly cookie.
- JavaScript frontend khong doc hoac luu refresh token.
- Cookie phai bat `httpOnly`; production nen bat `secure` va cau hinh `sameSite` phu hop voi domain frontend/backend.

### 6.3 Rotation
Khuyen nghi bat refresh token rotation:
1. client gui refresh token
2. backend xac minh
3. backend revoke token cu
4. backend cap access token moi va refresh token moi

### 6.4 Password reset impact
Khi `Admin` reset password:
1. password hash moi duoc ghi de
2. toan bo refresh session cua user nen bi revoke
3. access token cu se het hieu luc tu nhien theo expiry, hoac co the them deny-list neu can muc bao mat cao hon

## 7. API design
### 7.1 `POST /api/auth/login`
Request body:
```json
{
  "email": "user@example.com",
  "password": "secret"
}
```

Success response:
```json
{
  "accessToken": "jwt-access-token",
  "user": {
    "id": "user-id",
    "name": "User Name",
    "email": "user@example.com",
    "role": "Mangaka",
    "avatar": "",
    "status": "Active"
  }
}
```

### 7.2 `POST /api/auth/logout`
Request:
- access token o header
- refresh token o body hoac cookie tuy chien luoc

Response:
```json
{
  "message": "Logged out successfully"
}
```

### 7.3 `POST /api/auth/refresh`
Request body:
```json
{
  "refreshToken": "refresh-token"
}
```

Success response:
```json
{
  "accessToken": "new-access-token"
}
```

### 7.4 `GET /api/auth/me`
Response:
```json
{
  "user": {
    "id": "user-id",
    "name": "User Name",
    "email": "user@example.com",
    "role": "Mangaka",
    "avatar": "",
    "status": "Active"
  }
}
```

### 7.5 `POST /api/auth/users`
Muc dich: `Admin` tao tai khoan nhan vien.

Request body:
```json
{
  "name": "Editor A",
  "email": "editor.a@company.local",
  "password": "temporary-password",
  "role": "Tantou Editor",
  "status": "Active"
}
```

Success response:
```json
{
  "message": "User created successfully",
  "user": {
    "id": "user-id",
    "name": "Editor A",
    "email": "editor.a@company.local",
    "role": "Tantou Editor",
    "status": "Active"
  }
}
```

Rules:
- chi `Admin` duoc goi
- email unique
- khong tra password

### 7.6 `POST /api/auth/users/:id/reset-password`
Muc dich: `Admin` reset mat khau user.

Request body:
```json
{
  "newPassword": "new-secure-password"
}
```

Success response:
```json
{
  "message": "Password reset successfully"
}
```

Rules:
- chi `Admin` duoc goi
- revoke session hien tai cua user sau khi reset

## 8. Middleware chain
### 8.1 `requireAuth`
Luong xu ly:
1. lay header `Authorization`
2. xac minh format `Bearer`
3. verify JWT
4. lay user tu DB neu can
5. kiem tra user con ton tai va `status === Active`
6. gan `req.user`
7. goi `next()`

### 8.2 `requireAdmin`
Dung cho account provisioning APIs:
1. yeu cau `requireAuth`
2. kiem tra `req.user.role === Admin`
3. neu khong dat, tra `403`

## 9. Sequence flow
### 9.1 Login
1. user nhap email/password
2. frontend goi `POST /api/auth/login`
3. backend validate input
4. backend tim user theo email
5. backend compare password
6. backend kiem tra `status`
7. backend tao access token va refresh token
8. backend luu refresh session
9. frontend luu state phien

### 9.2 Refresh token
1. access token het han
2. frontend goi `POST /api/auth/refresh`
3. backend verify refresh token
4. backend kiem tra session chua revoke
5. backend cap token moi
6. frontend cap nhat token moi

### 9.3 Logout
1. user bam dang xuat
2. frontend goi `POST /api/auth/logout`
3. backend revoke refresh session
4. frontend xoa local auth state

### 9.4 Admin creates employee account
1. admin dang nhap
2. admin mo man hinh quan ly user
3. admin nhap thong tin user moi
4. frontend goi `POST /api/auth/users`
5. backend validate input va unique email
6. backend hash password
7. backend tao user
8. backend tra ve profile user vua tao

### 9.5 Admin resets employee password
1. admin dang nhap
2. admin mo chi tiet user hoac action reset
3. admin nhap mat khau moi hoac xac nhan tao mat khau tam
4. frontend goi `POST /api/auth/users/:id/reset-password`
5. backend hash password moi
6. backend cap nhat user
7. backend revoke toan bo refresh session cua user
8. backend tra ve ket qua thanh cong

## 10. Error contract
### 10.1 Response shape khuyen nghi
```json
{
  "error": {
    "code": "AUTH_INVALID_CREDENTIALS",
    "message": "Email hoac mat khau khong dung."
  }
}
```

### 10.2 Error codes khuyen nghi
- `AUTH_INVALID_CREDENTIALS`
- `AUTH_TOKEN_MISSING`
- `AUTH_TOKEN_INVALID`
- `AUTH_TOKEN_EXPIRED`
- `AUTH_REFRESH_INVALID`
- `AUTH_ACCOUNT_INACTIVE`
- `AUTH_ACCOUNT_SUSPENDED`
- `AUTH_EMAIL_ALREADY_EXISTS`
- `AUTH_PASSWORD_POLICY_VIOLATION`
- `AUTH_ADMIN_REQUIRED`
- `AUTH_USER_NOT_FOUND`

## 11. Security design
- Password phai hash bang bcrypt.
- Khong tra password trong bat ky response nao.
- JWT secret luu o env.
- Refresh token nen duoc hash khi luu DB.
- Khong cho phep client truyen `user_id` thay cho token.
- Khong dung header gia lap user trong production.
- Rate limit login nen duoc bo sung o gateway hoac auth route ve sau.
- Password reset boi admin phai duoc audit log.

## 12. Frontend design
### 12.1 UI principles
- It ma sat
- Khong reset form khi login loi
- Khong ro ri thong tin dang nhap
- Hien thi state phien ro rang
- Admin flows tach biet khoi login flow thong thuong

### 12.2 Component inventory
- `AuthShell`
- `LoginForm`
- `PasswordField`
- `InlineError`
- `AuthStatusBanner`
- `SessionExpiredModal`
- `CurrentUserChip`
- `LogoutButton`
- `CreateUserForm`
- `ResetPasswordDialog`

### 12.3 Login page
- Mot cot chinh, tap trung vao form
- Mobile full width tru margin ngoai
- Desktop panel 400-480px
- Field `email`, `password`
- Nut `Dang nhap`

### 12.4 Admin create user surface
- Form gom `name`, `email`, `role`, `status`, `password khoi tao`
- Hien thi validation inline
- Sau khi tao thanh cong, hien thi confirmation ro rang

### 12.5 Admin reset password surface
- Action button trong trang user detail hoac row action
- Dialog xac nhan
- Input `new password`
- Canh bao rang cac phien dang nhap hien tai se bi huy

## 13. State management design
Store auth toi thieu:
- `user`
- `accessToken`
- `isAuthenticated`
- `isRefreshing`
- `sessionStatus`

Refresh token khong nam trong store. Store chi giu access token trong memory; reload trang se goi refresh endpoint bang httpOnly cookie de lay access token moi.

`sessionStatus` khuyen nghi:
- `unauthenticated`
- `authenticating`
- `authenticated`
- `refreshing`
- `expired`
- `logging_out`

## 14. Logging va observability
Nen log:
- login success
- login failure
- refresh success/failure
- logout
- admin create user
- admin reset password
- token verify failure bat thuong

Khong log:
- password
- raw refresh token
- full Authorization header

## 15. Test strategy
### 15.1 Unit test
- hash password
- compare password
- sign token
- verify token
- revoke session
- create user validation
- reset password validation

### 15.2 Integration test
- login dung
- login sai password
- login voi tai khoan suspended
- goi `me` voi token hop le
- goi `me` voi token het han
- refresh thanh cong
- refresh bang token revoked
- admin tao user thanh cong
- admin tao user voi email trung
- admin reset password thanh cong
- user dang nhap bang mat khau moi sau reset

### 15.3 Frontend test
- login form validation
- loading state khi submit
- session expired modal
- logout clears state
- admin create user form validation
- admin reset password dialog flow

## 16. Migration plan cho repo hien tai
1. Tao module `auth` doc lap.
2. Them `Session` hoac `RefreshToken` model.
3. Tao routes `/api/auth/*`.
4. Gan `requireAuth` vao cac route nghiep vu.
5. Them admin provisioning routes cho create user va reset password.
6. Chuyen frontend sang login bang token that.
7. Loai bo moi co che gia lap user o tang request.

## 17. Acceptance criteria
- User dang nhap duoc voi account `Active`.
- Request khong co token bi chan `401`.
- Token sai hoac het han bi chan `401`.
- Refresh flow hoat dong dung.
- Logout revoke duoc session.
- Admin tao duoc tai khoan nhan vien moi.
- Admin reset duoc mat khau user va user dang nhap lai bang mat khau moi.
- Frontend xu ly duoc login, refresh, expired session, va admin account provisioning theo mot pattern thong nhat.
