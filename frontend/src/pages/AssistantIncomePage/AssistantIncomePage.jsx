import React, { useEffect, useState, useCallback } from "react";
import { getIncomeStatsApi } from "../../services/income/incomeService";
import { useToast } from "../../contexts/ToastContext";
import Loading from "../../common/Loading/Loading";
import "./AssistantIncomePage.css";

export default function AssistantIncomePage() {
  const toast = useToast();
  const [stats, setStats] = useState({
    totalEarned: 0,
    pendingAmount: 0,
    paidAmount: 0,
    approvedTasksCount: 0,
    totalTasksCount: 0
  });
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("");

  const fetchIncomeData = useCallback(async () => {
    setLoading(true);
    const result = await getIncomeStatsApi();
    if (result.success === false) {
      toast.error(result.message);
    } else {
      setStats(result.statistics || {
        totalEarned: 0,
        pendingAmount: 0,
        paidAmount: 0,
        approvedTasksCount: 0,
        totalTasksCount: 0
      });
      setRecords(result.records || []);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchIncomeData();
  }, [fetchIncomeData]);

  // Extract unique months for filtering
  const months = [...new Set(records.map(r => r.month))].sort((a, b) => b.localeCompare(a));

  const filteredRecords = selectedMonth
    ? records.filter(r => r.month === selectedMonth)
    : records;

  const translateStatus = (status) => {
    const s = (status || "").toLowerCase().trim();
    if (s === "pending") return "Chờ xử lý";
    if (s === "approved") return "Chờ thanh toán";
    if (s === "paid") return "Đã thanh toán";
    if (s === "cancelled") return "Đã hủy";
    return status;
  };

  const getStatusClass = (status) => {
    const s = (status || "").toLowerCase().trim();
    if (s === "pending") return "status-pending";
    if (s === "approved") return "status-approved";
    if (s === "paid") return "status-paid";
    if (s === "cancelled") return "status-cancelled";
    return "";
  };

  return (
    <div className="aip-container">
      {loading && <Loading text="Đang tải dữ liệu thu nhập..." />}

      <header className="aip-header">
        <h1 className="aip-title">Thu nhập hàng tháng</h1>
        <p className="aip-subtitle">Quản lý lương trợ lý, thống kê số lượng task được duyệt và tiến độ nhận lương</p>
      </header>

      {/* STATS METRIC CARDS - PREMIUM NEO BRUTALISM */}
      <section className="aip-stats-grid">
        <div className="aip-stat-card total">
          <span className="aip-stat-label">Tổng thu nhập tháng này</span>
          <span className="aip-stat-value">{(stats.totalEarned).toLocaleString()}đ</span>
          <span className="aip-stat-sub">Đã duyệt & tính lương</span>
        </div>

        <div className="aip-stat-card paid">
          <span className="aip-stat-label">Đã thanh toán</span>
          <span className="aip-stat-value">{(stats.paidAmount).toLocaleString()}đ</span>
          <span className="aip-stat-sub">Admin đã chuyển khoản</span>
        </div>

        <div className="aip-stat-card pending">
          <span className="aip-stat-label">Đang chờ thanh toán</span>
          <span className="aip-stat-value">{(stats.pendingAmount).toLocaleString()}đ</span>
          <span className="aip-stat-sub">Công việc đã duyệt thành công</span>
        </div>

        <div className="aip-stat-card count">
          <span className="aip-stat-label">Số Task Hoàn Thành</span>
          <span className="aip-stat-value">{stats.approvedTasksCount} / {stats.totalTasksCount}</span>
          <span className="aip-stat-sub">Task được nghiệm thu thành công</span>
        </div>
      </section>

      {/* FILTER PANEL */}
      <div className="aip-filter-panel">
        <div className="aip-filter-group">
          <label htmlFor="monthFilter">Lọc theo Tháng ghi nhận:</label>
          <select
            id="monthFilter"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="aip-select"
          >
            <option value="">Tất cả các tháng</option>
            {months.map(m => (
              <option key={m} value={m}>Tháng {m}</option>
            ))}
          </select>
        </div>
        <button onClick={fetchIncomeData} className="aip-refresh-btn">
          🔄 Tải lại dữ liệu
        </button>
      </div>

      {/* DETAIL RECORDS TABLE */}
      <section className="aip-table-section">
        <div className="aip-table-wrapper">
          <table className="aip-table">
            <thead>
              <tr>
                <th>Tháng</th>
                <th>Công việc / Task</th>
                <th>Thông tin Series</th>
                <th>Đơn giá</th>
                <th>Trạng thái</th>
                <th>Ngày duyệt</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="6" className="aip-table-empty">
                    Không tìm thấy dữ liệu thu nhập ghi nhận nào.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => {
                  const task = record.task_id || {};
                  const page = task.page_id || {};
                  const chapter = page.chapter_id || {};
                  const series = chapter.series_id || {};

                  return (
                    <tr key={record._id}>
                      <td>
                        <span className="aip-table-month">📅 {record.month}</span>
                      </td>
                      <td>
                        <div className="aip-table-tasktype">{task.task_type || "Công việc"}</div>
                        <div className="aip-table-taskdesc text-gray-500 text-xs truncate max-w-xs">
                          Trang {page.page_number || "?"} - {chapter.title || "N/A"}
                        </div>
                      </td>
                      <td>
                        <span className="aip-table-series">{series.title || "Chưa rõ"}</span>
                      </td>
                      <td>
                        <span className="aip-table-amount">+{record.amount.toLocaleString()}đ</span>
                      </td>
                      <td>
                        <span className={`aip-table-status ${getStatusClass(record.status)}`}>
                          {translateStatus(record.status)}
                        </span>
                      </td>
                      <td>
                        <span className="aip-table-date">
                          {new Date(record.createdAt).toLocaleDateString("vi-VN")}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
