import React, { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import { useToast } from "../../contexts/ToastContext";
import "./LoginPage.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const sessionStatus = useAuthStore((state) => state.sessionStatus);
  const login = useAuthStore((state) => state.login);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Thêm state để quản lý trạng thái ẩn/hiện mật khẩu
  const [showPassword, setShowPassword] = useState(false);

  const redirectTarget = "/";

  if (isAuthenticated) {
    return <Navigate to={redirectTarget} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      await login({ email, password });
      toast.success("Đăng nhập thành công!");
      navigate(redirectTarget, { replace: true });
    } catch (error) {
      toast.error(error.message || "Đăng nhập thất bại. Vui lòng thử lại.");
    }
  };

  return (
    <div className="login-wrapper">
      <form onSubmit={handleSubmit} className="login-card">
        <div className="login-header">
          <div className="login-subtitle">Manga Editorial System</div>
          <h1 className="login-title">Đăng nhập</h1>
          <p className="login-desc">
            Sử dụng email và mật khẩu để truy cập hệ thống quản lý.
          </p>
        </div>

        <label htmlFor="email" className="login-label">
          <span>Email</span>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="mangaka@studio.com"
            autoComplete="email"
            required
            className="login-input"
          />
        </label>

        {/* Khung nhập mật khẩu có chứa nút Show/Hide */}
        <div className="login-label">
          <span>Mật khẩu</span>
          <div className="password-wrapper">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              className="password-input"
            />
            <button
              type="button"
              className="toggle-password-btn"
              onClick={() => setShowPassword(!showPassword)}
              title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              {showPassword ? <div>🙈</div> : <div>🙉</div>}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={sessionStatus === "authenticating"}
          className="login-btn"
        >
          {sessionStatus === "authenticating"
            ? "Đang vào hệ thống..."
            : "Xác nhận Đăng nhập"}
        </button>
      </form>
    </div>
  );
}
