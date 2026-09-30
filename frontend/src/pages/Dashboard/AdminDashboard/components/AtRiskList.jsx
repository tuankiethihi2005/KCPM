import React from "react";

const RISK_BADGES = {
  Critical: { bg: "bg-red-600", text: "text-white", label: "CRITICAL" },
  Warning: { bg: "bg-[#FFD000]", text: "text-black", label: "WARNING" },
};

export default function AtRiskList({ series = [] }) {
  if (series.length === 0) {
    return (
      <div className="bg-white border-4 border-black p-5 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
        <h3 className="text-lg font-black uppercase mb-2">⚠️ Series có nguy cơ</h3>
        <p className="text-sm text-gray-500">Không có series nào đang gặp vấn đề.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border-4 border-black p-5 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-black uppercase">⚠️ Series có nguy cơ</h3>
        <span className="text-xs font-bold bg-black text-white px-3 py-1 border-2 border-black">
          {series.length} series
        </span>
      </div>

      <div className="space-y-2">
        {series.map((s) => {
          const badge = RISK_BADGES[s.risk_status] || RISK_BADGES.Warning;
          return (
            <div
              key={s._id}
              className="flex items-center justify-between p-3 border-2 border-black bg-gray-50
                hover:bg-white hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] transition-all"
            >
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm truncate">{s.title}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`text-[10px] font-black px-1.5 py-0.5 border border-black ${badge.bg} ${badge.text}`}
                  >
                    {badge.label}
                  </span>
                  <span className="text-[11px] text-gray-500">
                    {s.overdueTasks} tasks quá hạn
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
