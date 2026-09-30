import React from "react";
import "./PublishScanner.css";

export default function PublishScanner({
  steps,
  currentStep,
  scanStatus,
  errorMessage,
}) {
  const progressPercentage =
    scanStatus === "idle"
      ? 0
      : scanStatus === "success"
        ? 100
        : (currentStep / (steps.length - 1)) * 100;

  return (
    <div className="scanner-card">
      <h3 className="scanner-title">TIẾN ĐỘ QUÉT ĐIỀU KIỆN XUẤT BẢN</h3>

      <div className="progress-bar-container">
        <div
          className={`progress-bar-fill ${scanStatus}`}
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>

      <div className="scanner-steps">
        {steps.map((step, index) => {
          let stepState = "pending";
          if (scanStatus === "scanning") {
            if (index < currentStep) stepState = "passed";
            if (index === currentStep) stepState = "scanning";
          } else if (scanStatus === "failed") {
            if (index < currentStep) stepState = "passed";
            if (index === currentStep) stepState = "failed";
          } else if (scanStatus === "success") {
            stepState = "passed";
          }
          return (
            <div key={index} className={`step-item state-${stepState}`}>
              <div className="step-icon">
                {stepState === "pending" && "⏳"}
                {/* Đã thay Loading bằng div custom */}
                {stepState === "scanning" && (
                  <div className="inline-spinner"></div>
                )}
                {stepState === "passed" && "✅"}
                {stepState === "failed" && "❌"}
              </div>
              <div className="step-content">
                <h4>{step.label}</h4>
                {stepState === "failed" && (
                  <p className="step-error-msg">{errorMessage}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
