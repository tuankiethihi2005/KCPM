import React from "react";
import { Link } from "react-router-dom";

const ACTIONS = [
  { path: "/admin/users", icon: "👥", label: "Quản lý User", color: "bg-gray-200 hover:bg-black hover:text-white" },
  { path: "/admin/ranking", icon: "📊", label: "Bảng xếp hạng", color: "bg-[#FFD000] hover:bg-black hover:text-white" },
  { path: "/notifications", icon: "🔔", label: "Thông báo", color: "bg-blue-100 hover:bg-black hover:text-white" },
  { path: "/admin/series", icon: "📚", label: "Series", color: "bg-green-100 hover:bg-black hover:text-white" },
  { path: "/", icon: "🏠", label: "Dashboard", color: "bg-[#23A094] text-white hover:bg-black" },
];

export default function QuickActions() {
  return (
    <div className="bg-white border-4 border-black p-5 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
      <h3 className="text-lg font-black uppercase mb-4">⚡ Truy cập nhanh</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {ACTIONS.map((action) => (
          <Link
            key={action.path}
            to={action.path}
            className={`flex flex-col items-center justify-center p-3 border-2 border-black text-center
              ${action.color} transition-all
              hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px]
              active:shadow-none active:translate-y-0`}
          >
            <span className="text-2xl mb-1">{action.icon}</span>
            <span className="text-[11px] font-black uppercase leading-tight">{action.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
