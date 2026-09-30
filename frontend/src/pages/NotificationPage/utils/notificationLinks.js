/**
 * Ánh xạ notification → đường dẫn deep link
 * target_type: Loại đối tượng (Task, Chapter, Series,...)
 * target_id: ID của đối tượng
 * userRole: Role của user đăng nhập (phân biệt link theo role)
 */
export function getNotificationPath(notification, userRole) {
  const { type, target_type, target_id } = notification;

  // Ưu tiên target_type nếu có
  if (target_type && target_id) {
    switch (target_type) {
      case "Task": {
        if (userRole === "Assistant") return `/assistant/tasks`;
        if (userRole === "Mangaka") return `/mangaka/tasks`;
        return `/assistant/tasks`; // fallback
      }
      case "Chapter":
        return `/chapter-list/${target_id}`;
      case "Series": {
        if (userRole === "Mangaka") return "/mangaka/series";
        if (userRole === "Tantou Editor") return "/editor/series";
        if (userRole === "Editorial Board" || userRole === "Admin") return "/board/all-series";
        return "/board/all-series"; // fallback
      }
      default:
        return null;
    }
  }

  // Fallback theo loại thông báo
  switch (type) {
    case "Warning":
      return "/board/at-risk";
    case "Task_Update":
      return null;
    case "System":
      return null;
    case "Payment":
      return "/assistant/income";
    default:
      return null;
  }
}

/**
 * Lấy label cho nút deep link
 */
export function getActionLabel(notification) {
  const { type, target_type } = notification;

  if (target_type === "Task") return "Xem task →";
  if (target_type === "Chapter") return "Xem chapter →";
  if (target_type === "Series") return "Xem series →";

  switch (type) {
    case "Warning":
      return "Xem danh sách →";
    case "Payment":
      return "Xem thu nhập →";
    default:
      return "Xem chi tiết →";
  }
}
