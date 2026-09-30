import React from "react";

export default function NotificationBadge({ count }) {
  if (!count || count === 0) return null;

  const display = count > 99 ? "99+" : count;

  return (
    <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-black text-white bg-[#FF5C00] border-2 border-black leading-none ml-1">
      {display}
    </span>
  );
}
