import React from "react";

export default function NotificationSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex items-start gap-3 p-4 border-2 border-black bg-white animate-pulse"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-gray-200 mt-2 shrink-0" />
          <div className="w-10 h-10 rounded-full bg-gray-200 border-2 border-black shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex gap-2">
              <div className="h-4 w-16 bg-gray-200 border border-black" />
              <div className="h-4 w-20 bg-gray-200" />
            </div>
            <div className="h-4 w-3/4 bg-gray-200" />
            <div className="h-3 w-1/2 bg-gray-200" />
          </div>
        </div>
      ))}
    </div>
  );
}
