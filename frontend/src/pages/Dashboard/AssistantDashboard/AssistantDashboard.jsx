import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import SeriesProgressTable from "../../../components/dashboard/SeriesProgressTable/SeriesProgressTable";
import { getTasksApi } from "../../../services/task/taskService";
import { getIncomeStatsApi } from "../../../services/income/incomeService";
import { useToast } from "../../../contexts/ToastContext";
import Loading from "../../../common/Loading/Loading";
import "./AssistantDashboard.css";

const AssistantDashboard = () => {
  const toast = useToast();
  const [tasks, setTasks] = useState([]);
  const [incomeStats, setIncomeStats] = useState({
    totalEarned: 0,
    pendingAmount: 0,
    paidAmount: 0,
    approvedTasksCount: 0,
    totalTasksCount: 0,
  });
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [isLoadingIncome, setIsLoadingIncome] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    setIsLoadingTasks(true);
    setIsLoadingIncome(true);

    // 1. Fetch Tasks
    const taskResult = await getTasksApi();
    if (taskResult.success === false) {
      toast.error(taskResult.message);
    } else {
      // Chỉ lấy tối đa 3 task đang làm / mới giao gần nhất để hiển thị ở trang chủ
      const activeTasks = (taskResult.tasks || [])
        .filter((t) =>
          ["Assigned", "In Progress", "Revision Requested"].includes(t.status),
        )
        .slice(0, 3);
      setTasks(activeTasks);
    }
    setIsLoadingTasks(false);

    // 2. Fetch Income
    const incomeResult = await getIncomeStatsApi();
    if (incomeResult.success === false) {
      toast.error(incomeResult.message);
    } else {
      setIncomeStats(
        incomeResult.statistics || {
          totalEarned: 0,
          pendingAmount: 0,
          paidAmount: 0,
          approvedTasksCount: 0,
          totalTasksCount: 0,
        },
      );
    }
    setIsLoadingIncome(false);
  }, [toast]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const translateStatus = (status) => {
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

  const getStatusColor = (status) => {
    const s = (status || "").toLowerCase().trim();
    if (s === "assigned") return "bg-[#FFD000] text-black";
    if (s === "in progress") return "bg-[#23A094] text-white";
    if (s === "revision requested") return "bg-[#FF5C00] text-white";
    return "bg-white text-black";
  };

  return (
    <div className="dashboard-wrapper">
      <h1 className="dashboard-title">
        Không gian làm việc Trợ lý (Assistant)
      </h1>

      <div className="dashboard-grid-2">
        {/* CỘT TRÁI: NHIỆM VỤ ĐƯỢC GIAO */}
        <div className="task-column">
          <div className="task-column-header">
            <div>
              <h2 className="card-title">Nhiệm vụ được giao</h2>
              <p className="card-desc">
                Tải tài nguyên, hoàn thiện phông nền/hiệu ứng và nộp kết quả.
              </p>
            </div>
            <Link to="/assistant/tasks" className="view-all-link">
              Xem tất cả →
            </Link>
          </div>

          {isLoadingTasks ? (
            <div className="task-loading-box">Đang tải nhiệm vụ...</div>
          ) : tasks.length === 0 ? (
            <div className="empty-tasks-box">
              <p> Tuyệt vời! Bạn không còn task nào đang dang dở.</p>
            </div>
          ) : (
            <div className="dashboard-task-list">
              {tasks.map((task) => {
                const pageNum = task.page_id?.page_number || "?";
                const seriesTitle =
                  task.page_id?.chapter_id?.series_id?.title || "Không rõ";
                return (
                  <div key={task._id} className="dashboard-task-item">
                    <div className="task-item-top">
                      <span
                        className={`task-item-badge ${getStatusColor(task.status)}`}
                      >
                        {translateStatus(task.status)}
                      </span>
                      <span className="task-item-price">
                        💵 {task.price.toLocaleString()}đ
                      </span>
                    </div>
                    <h3 className="task-item-title">{task.task_type}</h3>
                    <p className="task-item-meta">
                      <strong>Series:</strong> {seriesTitle} |{" "}
                      <strong>Trang:</strong> {pageNum}
                    </p>
                    <div className="task-item-footer">
                      <span>
                        📅 Hạn:{" "}
                        {new Date(task.deadline).toLocaleDateString("vi-VN")}
                      </span>
                      <Link
                        to={`/assistant/tasks?taskId=${task._id}`}
                        className="btn-action-task"
                      >
                        Chi tiết & Nộp bài
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* CỘT PHẢI: THỐNG KÊ THU NHẬP */}
        <div className="income-column">
          <div className="income-column-header">
            <div>
              <h2 className="card-title">Thống kê thu nhập</h2>
              <p className="card-desc">
                Theo dõi các task đã được Mangaka duyệt và tính doanh thu.
              </p>
            </div>
            <Link to="/assistant/income" className="view-all-link-teal">
              Chi tiết →
            </Link>
          </div>

          {isLoadingIncome ? (
            <div className="income-loading-box">Đang tải số liệu...</div>
          ) : (
            <div className="income-stats-box">
              <div className="income-amount">
                {incomeStats.totalEarned.toLocaleString()} VND
              </div>
              <div className="income-detail-rows">
                <div className="income-detail-row">
                  <span>Đã nhận:</span>
                  <strong className="text-teal-700">
                    {incomeStats.paidAmount.toLocaleString()}đ
                  </strong>
                </div>
                <div className="income-detail-row">
                  <span>Chờ thanh toán:</span>
                  <strong className="text-orange-600">
                    {incomeStats.pendingAmount.toLocaleString()}đ
                  </strong>
                </div>
                <div className="income-detail-row pt-2 border-t-2 border-dashed border-gray-300">
                  <span>Task hoàn thành:</span>
                  <strong>
                    {incomeStats.approvedTasksCount} /{" "}
                    {incomeStats.totalTasksCount}
                  </strong>
                </div>
              </div>
              <div className="income-status mt-4">
                Trạng thái:{" "}
                {incomeStats.pendingAmount > 0
                  ? "Có khoản chờ thanh toán"
                  : "Đã thanh toán hết"}
              </div>
            </div>
          )}
        </div>

        {/* TIẾN ĐỘ SERIES */}
        <div className="col-span-full">
          <SeriesProgressTable />
        </div>
      </div>
    </div>
  );
};

export default AssistantDashboard;
