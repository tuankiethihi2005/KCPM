import React from "react";

const STATUS_COLORS = {
  Active: "bg-[#23A094]",
  Draft: "bg-gray-400",
  "At Risk": "bg-[#FF5C00]",
  Hiatus: "bg-[#FFD000]",
  Cancelled: "bg-red-600",
  Completed: "bg-blue-600",
  "Changed Schedule": "bg-purple-500",
};

const RISK_COLORS = {
  Safe: "bg-[#23A094]",
  Warning: "bg-[#FFD000]",
  Critical: "bg-[#FF5C00]",
};

export default function SeriesChart({ byStatus = {}, byRiskStatus = {}, total = 0 }) {
  const statuses = Object.entries(byStatus).sort((a, b) => b[1] - a[1]);
  const risks = Object.entries(byRiskStatus).sort((a, b) => b[1] - a[1]);

  if (total === 0) {
    return (
      <div className="bg-white border-4 border-black p-5 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
        <h3 className="text-lg font-black uppercase mb-3">📚 Series</h3>
        <p className="text-sm text-gray-500">Chưa có dữ liệu</p>
      </div>
    );
  }

  return (
    <div className="bg-white border-4 border-black p-5 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
      <h3 className="text-lg font-black uppercase mb-4">📚 Series</h3>

      {/* Status bars */}
      <div className="space-y-2 mb-5">
        <p className="text-xs font-bold uppercase text-gray-500 mb-2">Theo trạng thái</p>
        {statuses.map(([status, count]) => {
          const pct = Math.max(Math.round((count / total) * 100), 1);
          return (
            <div key={status}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-bold">{status}</span>
                <span className="font-black text-black">{count}</span>
              </div>
              <div className="w-full h-3 bg-gray-100 border-2 border-black">
                <div
                  className={`h-full ${STATUS_COLORS[status] || "bg-gray-400"} transition-all duration-500`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Risk status */}
      <div>
        <p className="text-xs font-bold uppercase text-gray-500 mb-2">Theo rủi ro</p>
        <div className="flex gap-2">
          {risks.map(([risk, count]) => (
            <div
              key={risk}
              className={`flex-1 border-2 border-black p-2 text-center ${risk === "Critical" ? "bg-red-50" : risk === "Warning" ? "bg-yellow-50" : "bg-gray-50"}`}
            >
              <span className="block text-lg font-black">{count}</span>
              <span className="block text-[10px] font-bold uppercase">{risk}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-500 font-medium mt-3">
        Tổng cộng: <span className="font-black text-black">{total}</span> series
      </p>
    </div>
  );
}
