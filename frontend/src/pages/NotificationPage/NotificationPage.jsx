import React, { useState, useEffect, useCallback } from "react";
import NotificationItem from "./components/NotificationItem";
import NotificationDetailModal from "./components/NotificationDetailModal";
import NotificationSkeleton from "./components/NotificationSkeleton";
import {
  getNotificationsApi,
  getUnreadCountApi,
  markAsReadApi,
  markAllAsReadApi,
  deleteNotificationApi,
} from "../../services/notificationService";

const FILTER_TABS = [
  { key: "", label: "Tất cả", icon: "📬" },
  { key: "System", label: "Hệ thống", icon: "🔔" },
  { key: "Task_Update", label: "Công việc", icon: "📋" },
  { key: "Warning", label: "Cảnh báo", icon: "⚠️" },
];

export default function NotificationPage() {
  const [notifications, setNotifications] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotification, setSelectedNotification] = useState(null);

  const fetchNotifications = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getNotificationsApi({
        page,
        limit: 20,
        type: activeFilter || undefined,
      });
      if (result.success !== false) {
        setNotifications(result.data || []);
        setPagination(result.pagination || { page: 1, totalPages: 1 });
      } else {
        setError(result.message || "Không thể tải thông báo");
      }
    } catch (err) {
      setError("Không thể tải thông báo. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [activeFilter]);

  const fetchUnreadCount = useCallback(async () => {
    const result = await getUnreadCountApi();
    if (result.success !== false) {
      setUnreadCount(result.count || 0);
    }
  }, []);

  useEffect(() => {
    fetchNotifications(1);
  }, [fetchNotifications]);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  const handleFilterChange = (filterKey) => {
    setActiveFilter(filterKey);
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    fetchNotifications(newPage);
  };

  const handleMarkAsRead = async (id) => {
    await markAsReadApi(id);
    fetchNotifications(pagination.page);
    fetchUnreadCount();
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsReadApi();
    fetchNotifications(pagination.page);
    fetchUnreadCount();
  };

  const handleDelete = async (id) => {
    await deleteNotificationApi(id);
    fetchNotifications(pagination.page);
    fetchUnreadCount();
  };

  const handleOpenDetail = (notification) => {
    setSelectedNotification(notification);
  };

  const handleCloseDetail = () => {
    setSelectedNotification(null);
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-black">
            🔔 Thông báo
          </h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-600 mt-1 font-medium">
              Bạn có <span className="font-black text-[#23A094]">{unreadCount}</span> thông báo chưa đọc
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-1.5 px-4 py-2 bg-white border-2 border-black text-sm font-bold text-black
              hover:bg-[#23A094] hover:text-white hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px]
              active:shadow-none active:translate-y-0 transition-all"
          >
            <span>✓</span>
            <span>Đã đọc tất cả</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 mb-6 flex-wrap">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleFilterChange(tab.key)}
            className={`px-4 py-2 text-sm font-bold border-2 border-black transition-all
              ${
                activeFilter === tab.key
                  ? "bg-[#23A094] text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] -translate-y-[1px]"
                  : "bg-white text-black hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px]"
              }
              active:shadow-none active:translate-y-0`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading && <NotificationSkeleton />}

      {!loading && error && (
        <div className="text-center py-12 border-2 border-black bg-white">
          <p className="text-gray-600 font-medium mb-4">{error}</p>
          <button
            onClick={() => fetchNotifications(pagination.page)}
            className="px-6 py-2 bg-[#FF5C00] text-white font-bold border-2 border-black
              hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px]
              active:shadow-none active:translate-y-0 transition-all"
          >
            Thử lại
          </button>
        </div>
      )}

      {!loading && !error && notifications.length === 0 && (
        <div className="text-center py-16 border-2 border-black bg-white">
          <div className="text-5xl mb-4">📭</div>
          <h3 className="text-lg font-black text-black mb-2">Chưa có thông báo nào</h3>
          <p className="text-sm text-gray-500">
            Khi có thông báo mới, chúng sẽ xuất hiện ở đây.
          </p>
        </div>
      )}

      {!loading && !error && notifications.length > 0 && (
        <>
          <div className="space-y-2">
            {notifications.map((notif) => (
              <NotificationItem
                key={notif._id}
                notification={notif}
                onMarkRead={handleMarkAsRead}
                onDelete={handleDelete}
                onOpenDetail={handleOpenDetail}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-4 py-2 text-sm font-bold border-2 border-black bg-white disabled:opacity-30 disabled:cursor-not-allowed
                  hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] active:shadow-none active:translate-y-0 transition-all"
              >
                ← Trước
              </button>
              <span className="text-sm font-bold text-gray-600">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="px-4 py-2 text-sm font-bold border-2 border-black bg-white disabled:opacity-30 disabled:cursor-not-allowed
                  hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] active:shadow-none active:translate-y-0 transition-all"
              >
                Sau →
              </button>
            </div>
          )}
        </>)}

        {/* Detail Modal */}
        {selectedNotification && (
          <NotificationDetailModal
            notification={selectedNotification}
            onClose={handleCloseDetail}
            onMarkRead={handleMarkAsRead}
          />
        )}
      </div>
  );
}
