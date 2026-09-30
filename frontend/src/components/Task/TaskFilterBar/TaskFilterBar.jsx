// components/TaskFilterBar.jsx
import React from "react";
import { translateStatus } from "../../../utils/taskHelpers";

export default function TaskFilterBar({ statusFilter, setStatusFilter }) {
  const statuses = [
    "",
    "Assigned",
    "In Progress",
    "Submitted",
    "Approved",
    "Revision Requested",
    "Rejected",
  ];

  return (
    <div className="atp-filter-bar">
      <span className="atp-filter-label">Trạng thái:</span>
      <div className="atp-filter-options">
        {statuses.map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`atp-filter-btn ${statusFilter === status ? "active" : ""}`}
          >
            {status === "" ? "Tất cả" : translateStatus(status)}
          </button>
        ))}
      </div>
    </div>
  );
}
