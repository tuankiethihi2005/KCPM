import React from "react";
// Import authStore của bạn để lấy thông tin user đã đăng nhập
import { useAuthStore } from "../../stores/authStore";

// Import các file Dashboard của từng Role do các thành viên khác code
import MangakaDashboard from "./MangakaDashboard/MangakaDashboard";
import AssistantDashboard from "./AssistantDashboard/AssistantDashboard";
import EditorDashboard from "./EditorDashboard/EditorDashboard";
import BoardDashboard from "./BoardDashboard/BoardDashboard";
import AdminDashboard from "./AdminDashboard/AdminDashboard";

const DashboardIndex = () => {
  // Lấy thông tin user hiện tại từ store (hoặc context tùy cách bạn setup)
  const { user } = useAuthStore();

  // Nếu chưa load xong user thì hiện loading
  if (!user) return <div>Đang tải dữ liệu...</div>;

  const role = user.role;

  // Điều hướng (Render) component tương ứng với Role
  switch (role) {
    case "Mangaka":
      return <MangakaDashboard />;
    case "Assistant":
      return <AssistantDashboard />;
    case "Tantou Editor":
      return <EditorDashboard />;
    case "Editorial Board":
      return <BoardDashboard />;
    case "Admin":
      return <AdminDashboard />;
    default:
      return <div>Bạn không có quyền truy cập hệ thống.</div>;
  }
};

export default DashboardIndex;
