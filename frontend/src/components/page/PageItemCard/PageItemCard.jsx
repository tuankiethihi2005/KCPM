import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import RequirePermission from "../../security/RequirePermission";
import ConfirmDeleteModal from "../../../common/ConfirmDeleteModal/ConfirmDeleteModal";
import { Trash2, RotateCcw } from "lucide-react";
import "./PageItemCard.css";

export default function PageItemCard({
  page,
  displayPageNumber, // Nhận prop số trang (mới)
  isTrashView, // Nhận prop check thùng rác (mới)
  onDelete, // Hàm xóa (mới)
  onRestore, // Hàm khôi phục (mới)
  onChangeStatus,
}) {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const confirmDelete = () => {
    setIsModalOpen(false);
    onDelete(page._id);
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case "Draft":
        return <div className="page-status-badge status-draft">Bản nháp</div>;
      case "In Progress":
        return (
          <div className="page-status-badge status-progress">Đang xử lý</div>
        );
      case "Ready For Review":
        return <div className="page-status-badge status-review">Chờ duyệt</div>;
      case "Approved":
        return (
          <div className="page-status-badge status-approved">Đã duyệt</div>
        );
      default:
        return <div className="page-status-badge status-draft">{status}</div>;
    }
  };

  return (
    <>
      {/* Nếu ở trong thùng rác, thêm class làm mờ (grayscale) */}
      <div
        className={`page-card group ${isTrashView ? "card-is-deleted" : ""}`}
      >
        {/* SỐ TRANG: Dùng displayPageNumber thay vì page.page_number */}
        <div className="page-number-badge">Trang {displayPageNumber}</div>

        {/* Nút Xóa/Khôi phục ở góc trên bên phải */}
        <RequirePermission required="CAN_DELETE_RESTORE_CHAPTER_PAGE">
          <div className="card-corner-actions group-hover:opacity-100">
            {!isTrashView ? (
              <button
                onClick={() => setIsModalOpen(true)}
                className="btn-corner-delete"
                title="Xóa trang này"
              >
                <Trash2 size={16} />
              </button>
            ) : (
              <button
                onClick={() => onRestore(page._id)}
                className="btn-corner-restore"
                title="Khôi phục"
              >
                <RotateCcw size={14} /> KHÔI PHỤC
              </button>
            )}
          </div>
        </RequirePermission>
        {/* Ẩn trạng thái nếu đang ở trong thùng rác */}
        {!isTrashView && renderStatusBadge(page.status)}

        <div className="page-image-container">
          <img
            src={
              page.current_preview_url ||
              `https://placehold.co/400x600/F4F4F0/000000?text=Page+${page.page_number}`
            }
            alt={`Trang ${page.page_number}`}
            loading="lazy"
          />
          {page.current_version && (
            <div className="page-version-badge">V{page.current_version}</div>
          )}
        </div>

        {/* Phần Actions bên dưới */}
        <div className="page-actions">
          {/* Nếu nằm trong thùng rác thì KHÔNG HIỆN các nút duyệt bài hay workspace */}
          {!isTrashView ? (
            <>
              <RequirePermission required="CAN_UPDATE_PAGE_STATUS">
                {(page.status === "Draft" || page.status === "In Progress") && (
                  <div className="actions-wrapper">
                    <button
                      className="btn-action btn-submit-review"
                      onClick={() =>
                        onChangeStatus(page._id, "Ready For Review")
                      }
                    >
                      Gửi Kiểm duyệt
                    </button>
                  </div>
                )}
              </RequirePermission>

              <RequirePermission required="CAN_APPROVE_PAGE">
                {page.status === "Ready For Review" && (
                  <div className="editor-actions">
                    <button
                      className="btn-action btn-approve"
                      onClick={() => onChangeStatus(page._id, "Approved")}
                    >
                      Duyệt
                    </button>
                    <button
                      className="btn-action btn-reject"
                      onClick={() => onChangeStatus(page._id, "In Progress")}
                    >
                      Yêu cầu sửa
                    </button>
                  </div>
                )}
              </RequirePermission>

              <div className="card-nav-actions">
                <button
                  className="btn-nav-workspace"
                  onClick={() => navigate(`/workspace/${page._id}`)}
                >
                  Workspace
                </button>
                <button
                  className="btn-nav-history"
                  onClick={() => navigate(`/page-history/${page._id}`)}
                >
                  History
                </button>
              </div>
            </>
          ) : (
            // UI thay thế khi ở trong thùng rác
            <div className="text-center font-black uppercase text-xs text-gray-500 p-2">
              Trang đang ở thùng rác
            </div>
          )}
        </div>
      </div>

      {/* Modal Xác Nhận Xóa */}
      <ConfirmDeleteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={confirmDelete}
        itemName={`Trang ${displayPageNumber}`}
      />
    </>
  );
}
