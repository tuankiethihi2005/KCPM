// utils/taskHelpers.js

export const isOverdue = (task) => {
  const completedStatuses = ["Approved", "Paid"];
  if (completedStatuses.includes(task.status)) return false;
  if (!task.deadline) return false;
  return new Date() > new Date(task.deadline);
};

export const isNearDeadline = (task) => {
  const completedStatuses = ["Approved", "Paid"];
  if (completedStatuses.includes(task.status)) return false;
  if (!task.deadline) return false;
  const timeDiff = new Date(task.deadline).getTime() - new Date().getTime();
  return timeDiff > 0 && timeDiff < 48 * 3600 * 1000; // Trong vòng 48h
};

export const translateStatus = (status) => {
  const s = (status || "").toLowerCase().trim();
  if (s === "assigned") return "Mới phân công";
  if (s === "in progress") return "Đang vẽ";
  if (s === "submitted") return "Chờ duyệt";
  if (s === "approved") return "Đã duyệt";
  if (s === "revision requested") return "Cần sửa đổi";
  if (s === "rejected") return "Bị từ chối";
  if (s === "paid") return "Đã thanh toán";
  return status;
};

export const getStatusColor = (status) => {
  const s = (status || "").toLowerCase().trim();
  if (s === "assigned") return "bg-[#FFD000]";
  if (s === "in progress") return "bg-[#23A094] text-white";
  if (s === "submitted") return "bg-[#FF90E8]";
  if (s === "approved") return "bg-[#23A094] text-white";
  if (s === "revision requested") return "bg-[#FF5C00] text-white";
  if (s === "rejected") return "bg-red-500 text-white";
  if (s === "paid") return "bg-blue-600 text-white";
  return "bg-gray-300";
};
