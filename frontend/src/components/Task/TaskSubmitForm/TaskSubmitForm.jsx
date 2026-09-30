// components/TaskSubmitForm.jsx
import React, { useState } from "react";
import { submitTaskApi } from "../../../services/task/taskService";
import { useToast } from "../../../contexts/ToastContext";

export default function TaskSubmitForm({ taskId, onSubmissionSuccess }) {
  const toast = useToast();
  const [submitFile, setSubmitFile] = useState(null);
  const [submitNote, setSubmitNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSubmitFile(e.target.files[0]);
    }
  };

  const handleSubmitWork = async (e) => {
    e.preventDefault();
    if (!submitFile) {
      toast.error("Vui lòng chọn file thành phẩm để nộp!");
      return;
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.append("file", submitFile);
    formData.append("note", submitNote);

    const result = await submitTaskApi(taskId, formData);
    if (result.success === false) {
      toast.error(result.message);
    } else {
      toast.success(result.message || "Nộp bài thành công!");
      // Xóa form sau khi gửi thành công
      setSubmitFile(null);
      setSubmitNote("");
      // Gọi callback để load lại data
      if (onSubmissionSuccess) onSubmissionSuccess();
    }
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmitWork} className="atp-submit-form">
      <h3>Nộp sản phẩm hoàn thành</h3>

      <div className="form-group">
        <label className="file-upload-label">
          <span>Tải bản nộp (.PSD)</span>
          <input
            type="file"
            onChange={handleFileChange}
            required
            className="file-upload-input"
          />
        </label>
        {submitFile && (
          <p className="file-name-indicator">
            📂 Đã chọn: <strong>{submitFile.name}</strong> (
            {(submitFile.size / 1024 / 1024).toFixed(2)} MB)
          </p>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="submitNote">Ghi chú gửi Mangaka:</label>
        <textarea
          id="submitNote"
          rows={3}
          value={submitNote}
          onChange={(e) => setSubmitNote(e.target.value)}
          placeholder="Ghi chú chỉnh sửa, các layer lưu ý..."
          className="form-textarea"
        />
      </div>

      <button type="submit" disabled={submitting} className="atp-submit-btn">
        {submitting ? "Đang tải lên và nộp bài..." : "Nộp bài thành phẩm 🚀"}
      </button>
    </form>
  );
}
