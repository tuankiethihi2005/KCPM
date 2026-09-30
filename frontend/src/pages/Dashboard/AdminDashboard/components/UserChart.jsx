import React from "react";

const ROLE_COLORS = {
  Admin: "bg-black",
  Mangaka: "bg-blue-600",
  Assistant: "bg-[#23A094]",
  "Tantou Editor": "bg-[#FFD000]",
  "Editorial Board": "bg-[#FF5C00]",
};

const ROLE_ICONS = {
  Admin: "👑",
  Mangaka: "✍️",
  Assistant: "🛠️",
  "Tantou Editor": "📋",
  "Editorial Board": "📊",
};

export default function UserChart({ byRole = {}, total = 0 }) {
  const roles = Object.entries(byRole).sort((a, b) => b[1] - a[1]);

  if (total === 0) {
    return (
      <div className="bg-white border-4 border-black p-5 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
        <h3 className="text-lg font-black uppercase mb-3">👥 Người dùng</h3>
        <p className="text-sm text-gray-500">Chưa có dữ liệu</p>
      </div>
    );
  }

  return (
    <div className="bg-white border-4 border-black p-5 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
      <h3 className="text-lg font-black uppercase mb-4">👥 Người dùng</h3>

      {/* Visual bar chart */}
      <div className="space-y-2.5">
        {roles.map(([role, count]) => {
          const pct = Math.max(Math.round((count / total) * 100), 1);
          return (
            <div key={role}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-bold flex items-center gap-1.5">
                  <span>{ROLE_ICONS[role] || "•"}</span>
                  <span>{role}</span>
                </span>
                <span className="font-black text-black">{count}</span>
              </div>
              <div className="w-full h-4 bg-gray-100 border-2 border-black">
                <div
                  className={`h-full ${ROLE_COLORS[role] || "bg-gray-400"} transition-all duration-500`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-500 font-medium mt-3">
        Tổng cộng: <span className="font-black text-black">{total}</span> người dùng
      </p>
    </div>
  );
}
