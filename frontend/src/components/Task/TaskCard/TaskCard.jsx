// components/TaskCard.jsx
import React from "react";
import {
  isOverdue,
  isNearDeadline,
  translateStatus,
  getStatusColor,
} from "../../../utils/taskHelpers";

export default function TaskCard({ task, isSelected, onClick }) {
  const pageNum = task.page_id?.page_number || "?";
  const seriesTitle = task.page_id?.chapter_id?.series_id?.title || "Không rõ";
  const chapterTitle = task.page_id?.chapter_id?.title || "Không rõ";

  const overdue = isOverdue(task);
  const nearDeadline = isNearDeadline(task);

  return (
    <div
      className={`atp-card ${isSelected ? "selected" : ""} ${overdue ? "overdue" : nearDeadline ? "near-deadline" : ""}`}
      onClick={onClick}
    >
      <div className="atp-card-header">
        <span className={`atp-badge ${getStatusColor(task.status)}`}>
          {translateStatus(task.status)}
        </span>
        {overdue && <span className="atp-warning-icon">⚠️</span>}
        <span className="atp-card-price">
          💵 {task.price.toLocaleString()}VNĐ
        </span>
      </div>
      <h3 className="atp-card-tasktype">{task.task_type}</h3>
      <p className="atp-card-meta">
        <strong>Series:</strong> {seriesTitle} <br />
        <strong>Chương:</strong> {chapterTitle} - Trang {pageNum}
      </p>
      <div className="atp-card-footer">
        <span
          className={
            overdue
              ? "text-red-600 font-bold"
              : nearDeadline
                ? "text-orange-600 font-bold"
                : ""
          }
        >
          {overdue
            ? "⚠️ QUÁ HẠN: "
            : nearDeadline
              ? "⏰ SẮP HẠN: "
              : "Hạn chót: "}
          {new Date(task.deadline).toLocaleDateString("vi-VN")}
        </span>
      </div>
    </div>
  );
}
