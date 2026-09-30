// src/components/chapter/ChapterTable/ChapterTable.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Trash2, ImageIcon, RotateCcw } from "lucide-react";
import "./ChapterTable.css";
import RequirePermission from "../../security/RequirePermission";

const translateStatus = (status) => {
  const s = (status || "").toLowerCase().trim();
  if (s === "draft") return "Bản nháp";
  if (s === "in production" || s === "in progress") return "Đang xử lý";
  if (s === "waiting review" || s === "ready for review") return "Chờ duyệt";
  if (s === "approved") return "Đã duyệt";
  if (s === "published") return "Đã xuất bản";
  return status;
};

export default function ChapterTable({ chapters, onDelete, onRestore }) {
  const [isTrashView, setIsTrashView] = useState(false);

  const activeChapters = chapters?.filter((chap) => !chap.is_deleted) || [];
  const deletedChapters = chapters?.filter((chap) => chap.is_deleted) || [];

  const displayedChapters = isTrashView ? deletedChapters : activeChapters;

  return (
    <div>
      <div className="view-toggle-container">
        <button
          onClick={() => setIsTrashView(false)}
          className={`view-toggle-btn ${!isTrashView ? "active-view" : ""}`}
        >
          <ImageIcon size={18} /> Đang hiển thị ({activeChapters.length})
        </button>
        <RequirePermission required="CAN_DELETE_RESTORE_CHAPTER_PAGE">
          <button
            onClick={() => setIsTrashView(true)}
            className={`view-toggle-btn ${isTrashView ? "trash-view" : ""}`}
          >
            <Trash2 size={18} /> Thùng rác ({deletedChapters.length})
          </button>
        </RequirePermission>
      </div>

      {displayedChapters.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">{isTrashView ? "🗑️" : "📂"}</span>
          <h3>{isTrashView ? "Thùng rác trống" : "Chưa có chapter nào"}</h3>
          <p>
            {isTrashView
              ? "Không có chapter nào đang bị xóa."
              : "Hãy tạo chapter đầu tiên để bắt đầu quy trình sản xuất."}
          </p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th width="15%">Số chương</th>
                <th width="35%">Tiêu đề chapter</th>
                <th width="15%">Trạng thái</th>
                <th width="35%">Khu vực làm việc</th>
              </tr>
            </thead>
            <tbody>
              {/* LẤY THÊM index TỪ VÒNG LẶP ĐỂ TÍNH SỐ HIỂN THỊ */}
              {displayedChapters.map((chap, index) => {
                // Tách biệt logic hiển thị: Active view thì lấy (index + 1) để luôn liên tục
                // Trash view thì lấy chapter_number gốc của DB
                const displayNum = isTrashView
                  ? chap.chapter_number
                  : index + 1;

                return (
                  <tr key={chap._id} className="table-row">
                    <td>
                      <span
                        className={`chapter-number-badge ${isTrashView ? "bg-gray-500" : ""}`}
                      >
                        Chương {displayNum}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`chapter-title ${isTrashView ? "line-through text-gray-500" : ""}`}
                      >
                        {chap.title}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`status-badge status-${chap.status?.toLowerCase().replace(/\s+/g, "-") || "draft"} ${isTrashView ? "opacity-50" : ""}`}
                      >
                        {translateStatus(chap.status || "Draft")}
                      </span>
                    </td>
                    <td>
                      <div className="action-links">
                        {isTrashView ? (
                          <button
                            onClick={() => onRestore(chap._id)}
                            className="btn-restore-chapter"
                          >
                            <RotateCcw size={14} />
                            Khôi phục
                          </button>
                        ) : (
                          <>
                            <Link
                              to={`/page-management/${chap._id}`}
                              className="link-mod4"
                            >
                              Quản lý bản thảo
                            </Link>
                            {chap.status === "Draft" && (
                              <RequirePermission required="CAN_DELETE_RESTORE_CHAPTER_PAGE">
                                <button
                                  onClick={() => onDelete(chap._id)}
                                  className="btn-delete-chapter"
                                >
                                  Hủy chương 🗑️
                                </button>
                              </RequirePermission>
                            )}
                            <RequirePermission required="CAN_PUBLISH_CHAPTER">
                              <Link
                                to={`/publish-approval/${chap._id}`}
                                className="link-mod10"
                              >
                                Trạm xuất bản
                              </Link>
                            </RequirePermission>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
