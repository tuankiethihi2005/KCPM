import React from "react";
import { useNavigate } from "react-router-dom";
import { getNotificationPath, getActionLabel } from "../utils/notificationLinks";

const TYPE_CONFIG = {
  System: { icon: "🔔", label: "Hệ thống", bg: "bg-gray-100 border-gray-300" },
  Task_Update: { icon: "📋", label: "Công việc", bg: "bg-blue-50 border-blue-300" },
  Warning: { icon: "⚠️", label: "Cảnh báo", bg: "bg-orange-50 border-orange-300" },
  Payment: { icon: "💰", label: "Thanh toán", bg: "bg-green-50 border-green-300" },
};

function formatFullTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function NotificationDetailModal({ notification, onClose, onMarkRead }) {
  const navigate = useNavigate();
  const config = TYPE_CONFIG[notification.type] || TYPE_CONFIG.System;
  const linkPath = getNotificationPath(notification);

  const handleGo = () => {
    onMarkRead(notification._id);
    if (linkPath) {
      navigate(linkPath);
    }
    onClose();
  };

  const handleClose = () => {
    if (!notification.is_read) {
      onMarkRead(notification._id);
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={handleClose}
    >
      <div
        className="bg-white border-4 border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] w-full max-w-lg mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b-2 border-black ${config.bg}`}>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{config.icon}</span>
            <div>
              <span className={`text-xs font-black uppercase px-2 py-0.5 border border-black ${config.bg}`}>
                {config.label}
              </span>
              <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                {formatFullTime(notification.createdAt)}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center border-2 border-black font-bold text-lg
              hover:bg-red-100 hover:text-red-600 transition-all"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          <h2 className="text-lg font-black text-black mb-3">
            {notification.title}
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {notification.message}
          </p>

          {/* Status */}
          <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
            <span>Trạng thái:</span>
            {notification.is_read ? (
              <span className="font-bold text-gray-400">Đã đọc</span>
            ) : (
              <span className="font-bold text-[#23A094]">Chưa đọc</span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex border-t-2 border-black">
          <button
            onClick={handleClose}
            className="flex-1 py-3 text-sm font-bold border-r-2 border-black
              hover:bg-gray-100 transition-all"
          >
            Đóng
          </button>
          {linkPath && (
            <button
              onClick={handleGo}
              className="flex-1 py-3 text-sm font-bold bg-black text-white
                hover:bg-[#23A094] transition-all"
            >
              {getActionLabel(notification)}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
