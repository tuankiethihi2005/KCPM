import React from "react";
import "./Loading.css";

export default function Loading({ text = " Đang xử lý..." }) {
  return (
    <div className="loading-overlay">
      <div className="loading-spinner"></div>
      <p className="loading-text">{text}</p>
    </div>
  );
}
