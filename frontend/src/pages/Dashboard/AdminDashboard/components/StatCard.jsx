import React from "react";
import { Link } from "react-router-dom";

export default function StatCard({ icon, label, value, sublabel, color = "bg-white", to }) {
  const content = (
    <div className="flex items-center gap-3">
      <span className="text-3xl">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black text-black">{value}</span>
          {sublabel && (
            <span className="text-xs font-bold text-gray-500 uppercase">{sublabel}</span>
          )}
        </div>
        <p className="text-sm font-bold text-gray-700 mt-0.5 truncate">{label}</p>
      </div>
    </div>
  );

  const classes = `${color} border-4 border-black p-5 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]
    hover:shadow-[7px_7px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[2px] transition-all
    ${to ? "cursor-pointer block" : ""}`;

  if (to) {
    return <Link to={to} className={classes}>{content}</Link>;
  }

  return <div className={classes}>{content}</div>;
}
