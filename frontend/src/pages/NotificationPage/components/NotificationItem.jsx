import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../../stores/authStore";
import { getNotificationPath } from "../utils/notificationLinks";

const TYPE_CONFIG = {
  System: { icon: "🔔", label: "Hệ thống", color: "bg-gray-100 border-gray-300", iconBg: "bg-gray-200" },
  Task_Update: { icon: "📋", label: "Công việc", color: "bg-blue-50 border-blue-300", iconBg: "bg-blue-100" },
  Warning: { icon: "⚠️", label: "Cảnh báo", color: "bg-orange-50 border-orange-300", iconBg: "bg-orange-100" },
  Payment: { icon: "💰", label: "Thanh toán", color: "bg-green-50 border-green-300", iconBg: "bg-green-100" },
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

export default function NotificationItem({ notification, onMarkRead, onDelete, onOpenDetail }) {
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();
  const userRole = useAuthStore((s) => s.user?.role);
  const config = TYPE_CONFIG[notification.type] || TYPE_CONFIG.System;
  const isUnread = !notification.is_read;
  const linkPath = getNotificationPath(notification, userRole);

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm("Bạn có chắc muốn xóa thông báo này?")) return;
    setDeleting(true);
    try {
      await onDelete(notification._id);
    } finally {
      setDeleting(false);
    }
  };

  const handleClick = () => {
    onOpenDetail(notification);
  };

  const handleDeepLink = (e) => {
    e.stopPropagation();
    if (!linkPath) return;
    navigate(linkPath);
  };

  return (
    <div
      onClick={handleClick}
      className={`group flex items-start gap-3 p-4 border-2 border-black mb-2 cursor-pointer transition-all
        ${isUnread ? "bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]" : "bg-[#F4F4F0] shadow-none opacity-80"}
        hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] active:shadow-none active:translate-y-0
        ${deleting ? "opacity-50" : ""}`}
    >
      {/* Unread indicator */}
      {isUnread && <span className="w-2.5 h-2.5 rounded-full bg-[#23A094] mt-2 shrink-0" />}
      {!isUnread && <span className="w-2.5 h-2.5 shrink-0" />}

      {/* Icon */}
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 border-2 border-black ${config.iconBg}`}>
        {config.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`text-[11px] font-black uppercase tracking-wider px-2 py-0.5 border border-black ${config.iconBg}`}>
            {config.label}
          </span>
          <span className="text-[11px] text-gray-500 font-medium">
            {formatRelativeTime(notification.createdAt)}
          </span>
        </div>
        <h3 className={`text-sm ${isUnread ? "font-black" : "font-semibold"} text-black truncate`}>
          {notification.title}
        </h3>
        <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
          {notification.message}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {linkPath && (
          <button
            onClick={handleDeepLink}
            className="p-1.5 text-gray-400 hover:text-[#23A094] hover:bg-[#23A094]/10 border-2 border-transparent hover:border-[#23A094] transition-all"
            title="Đi đến"
          >
            ↗
          </button>
        )}
        <button
          onClick={handleDelete}
          disabled={deleting}
          className={`p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 border-2 border-transparent hover:border-red-200 transition-all shrink-0 ${deleting ? "opacity-30" : ""}`}
          title="Xóa thông báo"
        >
          🗑
        </button>
      </div>
    </div>
  );
}
