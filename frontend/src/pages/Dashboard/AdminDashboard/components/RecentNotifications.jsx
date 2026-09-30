import React from "react";
import { Link } from "react-router-dom";

const TYPE_ICONS = {
  System: "🔔",
  Task_Update: "📋",
  Warning: "⚠️",
  Payment: "💰",
};

function formatRelativeTime(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Vừa xong";
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays === 1) return "Hôm qua";
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return date.toLocaleDateString("vi-VN");
}

export default function RecentNotifications({ notifications = [] }) {
  return (
    <div className="bg-white border-4 border-black p-5 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-black uppercase">🔔 Thông báo gần đây</h3>
        <Link
          to="/notifications"
          className="text-[11px] font-bold border-2 border-black px-2 py-1 hover:bg-black hover:text-white transition-all"
        >
          Xem tất cả →
        </Link>
      </div>

      {notifications.length === 0 ? (
        <p className="text-sm text-gray-500">Chưa có thông báo nào.</p>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n._id}
              className="flex items-start gap-2 p-2 border-b-2 border-gray-100 last:border-0"
            >
              <span className="text-lg shrink-0">{TYPE_ICONS[n.type] || "🔔"}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-bold uppercase ${n.is_read ? "text-gray-400" : "text-[#23A094]"}`}>
                    {n.type === "Task_Update" ? "Công việc" : n.type}
                  </span>
                  <span className="text-[10px] text-gray-400">·</span>
                  <span className="text-[10px] text-gray-400">{formatRelativeTime(n.createdAt)}</span>
                </div>
                <p className={`text-xs mt-0.5 truncate ${n.is_read ? "text-gray-600" : "font-bold text-black"}`}>
                  {n.title}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
