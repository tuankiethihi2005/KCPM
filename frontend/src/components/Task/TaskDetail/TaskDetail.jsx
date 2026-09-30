// components/TaskDetail.jsx
import React from "react";
import Loading from "../../../common/Loading/Loading";
import TaskSubmitForm from "../TaskSubmitForm/TaskSubmitForm";
import { translateStatus, getStatusColor } from "../../../utils/taskHelpers";

export default function TaskDetail({
  selectedTask,
  detailLoading,
  onRefreshData,
}) {
  if (detailLoading) {
    return (
      <div className="atp-detail-section">
        <Loading text="Đang tải chi tiết..." />
      </div>
    );
  }

  if (!selectedTask) {
    return (
      <div className="atp-detail-placeholder">
        <span className="placeholder-icon">👉</span>
        <h3>Chọn một công việc</h3>
        <p>
          Vui lòng click vào một công việc bên trái để xem tài nguyên và nộp bài
          vẽ thành phẩm.
        </p>
      </div>
    );
  }

  const { task, submissions } = selectedTask;
  console.log("Selected Task:", submissions);

  // Kiểm tra xem có được nộp bài không
  const canSubmit = [
    "Assigned",
    "In Progress",
    "Revision Requested",
    "Rejected",
  ].includes(task.status);

  // Kiểm tra xem URL có phải là ảnh không (hỗ trợ cả link Cloudinary)
  const checkIsImage = (url) => {
    if (!url) return false;
    const lowerUrl = url.toLowerCase();

    // 1. Nếu là link Cloudinary, cứ thấy "/image/" là chắc chắn 100% là ảnh
    if (lowerUrl.includes("/image/upload/")) {
      return true;
    }
  };

  return (
    <div className="atp-detail-card">
      <div className="atp-detail-header">
        <h2>{task.task_type}</h2>
        <span className={`atp-badge ${getStatusColor(task.status)}`}>
          {translateStatus(task.status)}
        </span>
      </div>

      <div className="atp-detail-info-grid">
        <div>
          <strong>Truyện:</strong>{" "}
          {task.page_id?.chapter_id?.series_id?.title || "Không rõ"}
        </div>
        <div>
          <strong>Chương:</strong>{" "}
          {task.page_id?.chapter_id?.title || "Không rõ"}
        </div>
        <div>
          <strong>Số trang:</strong> Trang {task.page_id?.page_number || "?"}
        </div>
        <div>
          <strong>Tiền công:</strong>{" "}
          <span className="text-teal-600 font-bold">
            {task.price.toLocaleString()}đ
          </span>
        </div>
        <div>
          <strong>Người giao:</strong> {task.assigned_by?.name} (
          {task.assigned_by?.email})
        </div>
        <div>
          <strong>Hạn chót:</strong>{" "}
          {new Date(task.deadline).toLocaleString("vi-VN")}
        </div>
      </div>

      {task.description && (
        <div className="atp-detail-desc">
          <h3>Yêu cầu công việc:</h3>
          <p>{task.description}</p>
        </div>
      )}

      {/* TẢI TÀI NGUYÊN */}
      <div className="atp-detail-resources">
        <h3>Tài nguyên bản thảo:</h3>
        <div className="atp-resource-buttons">
          <a
            href={task.page_id?.current_source_file_url}
            target="_blank"
            rel="noreferrer"
            download
            className="atp-download-btn"
          >
            💾 Tải File Gốc (.PSD)
          </a>
          {task.page_id?.attached_resource_url ? (
            <a
              href={task.page_id?.attached_resource_url}
              target="_blank"
              rel="noreferrer"
              download
              className="atp-download-btn resource"
            >
              📦 Tải Tài Nguyên (.ZIP)
            </a>
          ) : (
            <span className="atp-no-resource">
              Không có tài nguyên đính kèm
            </span>
          )}
        </div>
      </div>

      {/* FORM NỘP BÀI */}
      {canSubmit && (
        <TaskSubmitForm taskId={task._id} onSubmissionSuccess={onRefreshData} />
      )}

      {/* LỊCH SỬ SUBMISSION */}
      {submissions && submissions.length > 0 && (
        <div className="atp-history-section">
          <h3>Lịch sử nộp bài ({submissions.length})</h3>
          <div className="atp-history-list">
            {/* CHÚ Ý: Lấy thêm index (idx) từ hàm map */}
            {submissions.map((sub, idx) => {
              const isLatest = idx === 0; // Vị trí đầu tiên luôn là mới nhất
              const isImage = checkIsImage(sub.file_url);
              console.log(
                `Submission ${idx + 1}: isLatest=${isLatest}, isImage=${isImage}`,
                "link:",
                sub.file_url,
              );

              return (
                <div key={sub._id} className="atp-history-item">
                  <div className="atp-history-header">
                    <span className="atp-history-date">
                      {new Date(sub.submitted_at).toLocaleString("vi-VN")}
                    </span>
                    <span
                      className={`atp-badge-small ${getStatusColor(sub.status)}`}
                    >
                      {translateStatus(sub.status)}
                    </span>
                  </div>

                  <p className="atp-history-note">
                    <strong>Ghi chú:</strong> {sub.note || "Không có ghi chú"}
                  </p>

                  <div className="atp-history-file-container flex-col items-start gap-2 mt-2">
                    {/* CHỈ HIỆN ẢNH PREVIEW NẾU LÀ ẢNH VÀ LÀ BẢN MỚI NHẤT */}
                    {isLatest && isImage && (
                      <div className="border-2 border-black p-1 bg-white inline-block shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all mb-2">
                        <a
                          href={sub.file_url}
                          target="_blank"
                          rel="noreferrer"
                          title="Nhấn để xem ảnh kích thước thật"
                        >
                          <img
                            src={sub.primary_preview_url}
                            alt="Preview bài nộp"
                            className="max-w-[200px] h-auto object-contain cursor-pointer"
                            loading="lazy"
                          />
                        </a>
                      </div>
                    )}

                    {/* LUÔN HIỆN NÚT TẢI/XEM CHO TẤT CẢ CÁC BẢN */}
                    <a
                      href={sub.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="atp-history-file-link flex items-center gap-1 font-black"
                    >
                      {isImage && !isLatest ? "🖼️" : "📦"} Nhấn để tải/xem file
                      gốc
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
