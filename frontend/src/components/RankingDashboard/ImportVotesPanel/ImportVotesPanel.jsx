import { useState } from "react";
import { FileSpreadsheet, Upload } from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";
import importVoteData from "../../../services/issue/importVoteDataService";
import "./ImportVotesPanel.css";

export default function ImportVotesPanel({ onImportSuccess }) {
  const toast = useToast();
  const [issueId, setIssueId] = useState("");
  const [file, setFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleImport = async (e) => {
    e.preventDefault();
    if (!issueId || !file) return;

    setIsImporting(true);
    const result = await importVoteData({ issueId, file });
    if (result.success === false) {
      toast.error("Không thể import vote: " + result.message);
    } else {
      toast.success("Đã import dữ liệu bình chọn thành công.");
      setIssueId("");
      setFile(null);
      if (onImportSuccess) onImportSuccess(); // Kích hoạt làm mới các bảng thống kê ngoài dashboard
    }
    setIsImporting(false);
  };

  return (
    <section className="ivp-panel">
      <div className="ivp-title">
        <FileSpreadsheet size={24} />
        <h2>Nhập bình chọn độc giả</h2>
      </div>
      <form className="ivp-form" onSubmit={handleImport}>
        <div className="ivp-form-group">
          <label className="ivp-label">Mã kỳ phát hành cần nhập</label>
          <input
            className="ivp-input"
            value={issueId}
            onChange={(e) => setIssueId(e.target.value)}
            placeholder="VD: ISSUE-2026-01"
            required
          />
        </div>
        <div className="ivp-form-group">
          <label className="ivp-label">Tập tin Excel/CSV</label>
          <input
            className="ivp-input--file"
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            required
          />
          <p className="ivp-tooltip">
            💡 Cột yêu cầu: seriesId, votes, avgScore, comments, views
          </p>
        </div>
        <button
          className="ivp-btn-submit"
          type="submit"
          disabled={isImporting}
        >
          <Upload size={18} />{" "}
          {isImporting ? "Đang xử lý..." : "Tải lên & Xử lý"}
        </button>
      </form>
    </section>
  );
}
