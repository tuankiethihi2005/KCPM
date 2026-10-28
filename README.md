# KCPM - Manga Management System

KCPM là hệ thống quản lý quy trình sản xuất và phát hành manga. Hệ thống hỗ trợ quản lý series, chapter, page, task cộng tác, feedback biên tập, phê duyệt nội dung, xuất bản chapter, kỳ phát hành, ranking, thu nhập, thông báo và phân quyền theo vai trò.

## 1. Công nghệ sử dụng

### Backend

- Node.js
- Express
- MongoDB với Mongoose
- JWT access token và refresh token
- bcryptjs để băm mật khẩu
- Cloudinary cho tài nguyên/ảnh upload
- Jest và Supertest cho kiểm thử API

### Frontend

- React
- Vite
- React Router
- TanStack React Query
- Zustand
- Tailwind CSS
- Recharts

### Kiểm thử

- Playwright cho E2E test
- CodeceptJS cho một số kịch bản UI/API
- MongoDB Memory Server cho môi trường test hoặc fallback local

### Docker

- Backend chạy trên port `5000`
- Frontend được build bằng Vite và phục vụ qua Nginx trên port `8080`

## 2. Chức năng chính

### Quản lý người dùng và phân quyền

- Đăng nhập, đăng xuất, refresh token và xem thông tin tài khoản.
- Quản lý người dùng bởi Admin.
- Phân quyền theo các vai trò:
  - `Admin`
  - `Mangaka`
  - `Assistant`
  - `Tantou Editor`
  - `Editorial Board`

### Quản lý nội dung manga

- Tạo và quản lý series.
- Tạo chapter theo series.
- Upload và quản lý page.
- Quản lý version của page.
- Tạo region và annotation/feedback trên page.
- Theo dõi tiến độ chapter.

### Biên tập và xuất bản

- Tantou Editor tạo và xử lý feedback.
- Duyệt page.
- Theo dõi task của chapter.
- Kiểm tra điều kiện xuất bản chapter.
- Gắn chapter với release issue.
- Xuất bản chapter.

Chapter chỉ được xuất bản khi:

```text
Có ít nhất một page
AND tất cả page có status = Approved
AND tất cả task có status = Approved hoặc Paid
AND tất cả annotation có status = Resolved
```

### Board, ranking và hiệu suất

- Editorial Board xem series chờ xử lý.
- Board vote và finalize quyết định series.
- Theo dõi ranking theo kỳ phát hành.
- Xem performance chart của series.
- Theo dõi trạng thái rủi ro và cảnh báo hủy.

### Các chức năng khác

- Quản lý release issue.
- Quản lý thu nhập của Assistant.
- Quản lý notification.
- Dashboard cho Admin.

## 3. Cấu trúc thư mục

```text
KCPM/
├── backend/
│   ├── src/
│   │   ├── config/          # MongoDB, Cloudinary và seed helper
│   │   ├── constants/       # Role và hằng số nghiệp vụ
│   │   ├── controllers/     # Xử lý request/response
│   │   ├── helpers/         # Hàm hỗ trợ
│   │   ├── middlewares/     # Upload, auth và middleware chung
│   │   ├── models/          # Mongoose models
│   │   ├── modules/         # Auth và authorization
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business services
│   │   ├── app.js           # Khởi tạo Express app
│   │   └── server.js        # Kết nối database và khởi động server
│   ├── scripts/             # Script seed dữ liệu
│   ├── tests/               # Backend tests
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── config/
│   │   ├── pages/
│   │   ├── services/
│   │   └── stores/
│   ├── Dockerfile
│   └── package.json
├── test/
│   ├── specs/               # Playwright E2E specs
│   ├── helpers/             # Test data và helper
│   ├── playwright.config.js
│   └── TESTING.md
├── api-testing/             # Request dùng cho API testing
├── postman/                 # Collection/environment Postman
├── docs/                    # Tài liệu yêu cầu và kiểm thử
├── DOCKER.md
└── package.json
```

## 4. Yêu cầu môi trường

Đề nghị sử dụng:

- Node.js 20 trở lên
- npm
- MongoDB local hoặc MongoDB Atlas
- Git
- Docker Desktop nếu chạy bằng Docker

Kiểm tra phiên bản:

```powershell
node --version
npm --version
docker --version
```

## 5. Cài đặt project

Từ thư mục gốc:

```powershell
git clone https://github.com/tuankiethihi2005/KCPM.git
cd KCPM
npm install
```

Cài dependency cho backend:

```powershell
cd backend
npm install
cd ..
```

Cài dependency cho frontend:

```powershell
cd frontend
npm install
cd ..
```

## 6. Cấu hình biến môi trường

Tạo file:

```text
backend/.env
```

Các biến được backend sử dụng:

```env
PORT=5000
NODE_ENV=development
FRONTEND_ORIGIN=http://localhost:5173

# MongoDB Atlas
DB_USERNAME=your_mongodb_username
DB_PASSWORD=your_mongodb_password
DB_CLUSTER=your_cluster.mongodb.net
DB_NAME=Project_CNPM

# JWT
JWT_ACCESS_SECRET=replace_with_a_long_random_secret
JWT_REFRESH_SECRET=replace_with_another_long_random_secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Tùy chọn
BOARD_REVIEW_DEADLINE_DAYS=7
```

Không commit `backend/.env`, JWT secret, MongoDB password hoặc Cloudinary secret lên GitHub.

### Cơ chế kết nối MongoDB

Backend ưu tiên theo thứ tự:

1. MongoDB Atlas nếu có đủ `DB_USERNAME`, `DB_PASSWORD` và `DB_CLUSTER`.
2. MongoDB local tại:

   ```text
   mongodb://127.0.0.1:27017/Project_CNPM
   ```

3. MongoDB Memory Server nếu không kết nối được hai lựa chọn trên.

Khi dùng MongoDB Memory Server lần đầu, backend có thể cần tải MongoDB binary về thư mục cache `backend/.cache/mongodb-binaries`.

## 7. Chạy ứng dụng ở chế độ development

### 7.1. Chạy backend

Mở terminal thứ nhất:

```powershell
cd C:\path\to\KCPM\backend
node src\server.js
```

Backend mặc định chạy tại:

```text
http://localhost:5000
```

Kiểm tra backend:

```powershell
Invoke-WebRequest http://localhost:5000/ -UseBasicParsing
```

Kết quả mong đợi:

```json
{
  "message": "Welcome to the Manga Management API"
}
```

### 7.2. Chạy frontend

Mở terminal thứ hai:

```powershell
cd C:\path\to\KCPM\frontend
npm run dev
```

Frontend mặc định chạy tại:

```text
http://localhost:5173
```

Frontend sử dụng API mặc định:

```text
http://localhost:5000/api
```

Nếu cần đổi API URL, tạo `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Sau khi thay đổi biến `VITE_API_BASE_URL`, cần khởi động lại Vite.

### Lưu ý về `server.js` ở thư mục gốc

File `server.js` ở thư mục gốc là server demo cũ dùng dữ liệu tạm trong bộ nhớ. Không dùng file này để chạy ứng dụng chính.

Server chính là:

```text
backend/src/server.js
```

## 8. Tạo tài khoản test

Các script seed nằm trong `backend/scripts`. Có thể chạy từ thư mục gốc:

```powershell
npm run seed:admin
npm run seed:mangaka
npm run seed:assistant
```

Tạo Tantou Editor:

```powershell
cd backend
node scripts\seedTantouEditorUser.js
cd ..
```

Tạo Editorial Board:

```powershell
cd backend
node scripts\seedEditorialUser.js
cd ..
```

Tạo dữ liệu task demo:

```powershell
npm run seed:tasks
```

Tài khoản demo thường dùng:

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Admin | `admin@example.com` | `password123` |
| Mangaka | `mangaka@example.com` | `password123` |
| Assistant | `assistant@example.com` | `password123` |
| Tantou Editor | `editor@example.com` | `password123` |
| Editorial Board | `editorial@example.com` | `password123` |

Chỉ sử dụng các tài khoản trên cho môi trường local/test. Đổi mật khẩu khi triển khai thật.

## 9. API chính

Base URL:

```text
http://localhost:5000/api
```

| Chức năng | Method | Endpoint |
|---|---|---|
| Đăng nhập | POST | `/auth/login` |
| Đăng xuất | POST | `/auth/logout` |
| Refresh token | POST | `/auth/refresh` |
| Thông tin tài khoản hiện tại | GET | `/auth/me` |
| Quản lý chapter | GET/POST/PUT/DELETE | `/chapters/...` |
| Quản lý page | GET/POST/PUT/DELETE | `/pages/...` |
| Quản lý series | GET/POST/PUT/DELETE | `/series/...` |
| Quản lý task | GET/POST/PATCH/DELETE | `/tasks/...` |
| Annotation/feedback | GET/POST/PATCH/DELETE | `/annotations/...` |
| Publish chapter | POST | `/publish/chapter/:chapter_id` |
| Release issue | GET/POST/PUT/DELETE | `/issues/...` |
| Ranking | GET | `/rankings` |
| Performance series | GET | `/rankings/performance/:seriesId` |
| Board review | GET/POST | `/board/...` |
| Notification | GET/PATCH | `/notifications/...` |
| Income | GET/POST/PATCH | `/income/...` |
| Admin dashboard | GET | `/admin/...` |

Các endpoint yêu cầu đăng nhập phải gửi:

```http
Authorization: Bearer <accessToken>
```

Refresh token được backend lưu trong cookie HttpOnly. Khi test bằng Postman, cần bật Cookie Jar.

## 10. Chạy bằng Docker

### 10.1. Build image backend

Chạy từ thư mục gốc:

```powershell
docker build --no-cache -t kcpm-backend:latest .\backend
```

### 10.2. Build image frontend

```powershell
docker build --no-cache `
  --build-arg VITE_API_BASE_URL=http://localhost:5000/api `
  -t kcpm-frontend:latest `
  .\frontend
```

### 10.3. Chạy backend container

Nếu container cũ tồn tại:

```powershell
docker rm -f kcpm-backend
```

Chạy container mới:

```powershell
docker run -d `
  --name kcpm-backend `
  --env-file .\backend\.env `
  -p 5000:5000 `
  kcpm-backend:latest
```

### 10.4. Chạy frontend container

```powershell
docker rm -f kcpm-frontend

docker run -d `
  --name kcpm-frontend `
  -p 8080:80 `
  kcpm-frontend:latest
```

Truy cập:

```text
Frontend: http://localhost:8080
Backend:  http://localhost:5000
```

Kiểm tra container và log:

```powershell
docker ps
docker logs --tail 100 kcpm-backend
docker logs --tail 100 kcpm-frontend
```

### 10.5. Pull image từ Docker Hub

Thay `trongphucx5` bằng username Docker Hub tương ứng nếu repository khác:

```powershell
docker login
docker pull trongphucx5/kcpm-backend:latest
docker pull trongphucx5/kcpm-frontend:latest
```

Chạy backend từ image Docker Hub:

```powershell
docker rm -f kcpm-backend

docker run -d `
  --name kcpm-backend `
  --env-file .\backend\.env `
  -p 5000:5000 `
  trongphucx5/kcpm-backend:latest
```

Trong PowerShell, dấu nối dòng là dấu backtick `` ` ``. Trong Git Bash, dùng một dòng hoặc dấu `\`:

```bash
docker run -d --name kcpm-backend --env-file ./backend/.env -p 5000:5000 trongphucx5/kcpm-backend:latest
```

Không dùng chuỗi placeholder `DOCKERHUB_USERNAME` trong lệnh thực tế.



