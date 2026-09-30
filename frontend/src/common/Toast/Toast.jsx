import React, { useState, useEffect } from "react";
import "./Toast.css";

export default function Toast({ type, message, onClose }) {
  const [isClosing, setIsClosing] = useState(false);
  const icons = { success: "✅", error: "🚨", info: "💡" };
  useEffect(() => {
    // 1. Chờ 2000ms (2 giây) rồi bắt đầu kích hoạt hiệu ứng đóng
    const closeTimer = setTimeout(() => {
      setIsClosing(true);
    }, 2000);

    return () => clearTimeout(closeTimer);
  }, []);

  useEffect(() => {
    // 2. Khi isClosing được bật, đợi CSS chạy xong rồi mới xóa hẳn
    if (isClosing) {
      const removeTimer = setTimeout(() => {
        onClose();
      }, 300); // 300ms này phải khớp với thời gian animation trong CSS
      return () => clearTimeout(removeTimer);
    }
  }, [isClosing, onClose]);

  return (
    <div className={`toast-box toast-${type} ${isClosing ? "closing" : ""}`}>
      <span className="toast-icon">{icons[type]}</span>
      <span className="toast-text">{message}</span>
    </div>
  );
}
