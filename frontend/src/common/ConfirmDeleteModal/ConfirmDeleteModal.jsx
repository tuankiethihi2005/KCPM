import React from "react";
import { AlertOctagon } from "lucide-react";
import "./ConfirmDeleteModal.css";

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  itemName,
}) {
  if (!isOpen) return null;

  return (
    <div className="confirm-modal-overlay">
      <div className="confirm-modal-content">
        <div className="confirm-modal-header">
          <div className="confirm-modal-icon">
            <AlertOctagon color="white" size={24} />
          </div>
          <h2 className="confirm-modal-title">Xác nhận xóa?</h2>
        </div>

        <p className="confirm-modal-text">
          Bạn có chắc chắn muốn đưa{" "}
          <span className="confirm-modal-highlight">{itemName}</span> vào thùng
          rác không? Bạn vẫn có thể khôi phục lại sau.
        </p>

        <div className="confirm-modal-actions">
          <button onClick={onClose} className="confirm-btn-cancel">
            Hủy bỏ
          </button>
          <button onClick={onConfirm} className="confirm-btn-delete">
            Đưa vào thùng rác
          </button>
        </div>
      </div>
    </div>
  );
}
