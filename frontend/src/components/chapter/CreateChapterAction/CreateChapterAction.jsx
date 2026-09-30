import React, { useState } from "react";
import createChapter from "../../../services/chapter/createChapterService";
import { useToast } from "../../../contexts/ToastContext";
import Loading from "../../../common/Loading/Loading";
import "./CreateChapterAction.css";

export default function CreateChapterAction({
  seriesId,
  currentCount,
  onCreatedSuccess,
}) {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");

  const handleOpenModal = () => {
    setTitle(``);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTitle("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Vui lòng nhập tiêu đề Chapter!");
      return;
    }
    setIsLoading(true);
    const newChapterData = {
      series_id: seriesId,
      chapter_number: currentCount + 1,
      title: title,
      deadline: new Date(
        new Date().getTime() + 7 * 24 * 60 * 60 * 1000,
      ).toISOString(),
    };
    const result = await createChapter(newChapterData);
    setIsLoading(false);
    if (result.success) {
      toast.success("Tạo Chapter mới thành công!");
      handleCloseModal();
      onCreatedSuccess();
    } else {
      toast.error("Lỗi tạo Chapter: " + result.message);
    }
  };
  return (
    <>
      {isLoading && <Loading text="Đang khởi tạo Chapter mới..." />}

      <button
        className="btn-create-chapter"
        onClick={handleOpenModal}
        disabled={isLoading}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={3}
          stroke="currentColor"
          className="icon-svg"
        >
          <path
            strokeLinecap="square"
            strokeLinejoin="miter"
            d="M12 4.5v15m7.5-7.5h-15"
          />
        </svg>
        <span>Tạo Chapter Mới</span>
      </button>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3 className="modal-title">Tạo Chapter Mới</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Tiêu đề Chapter:</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Chương 1: Sự khởi đầu..."
                  autoFocus
                />
              </div>
              <div className="modal-buttons">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={handleCloseModal}
                >
                  Hủy
                </button>
                <button type="submit" className="btn-confirm">
                  Tạo ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
