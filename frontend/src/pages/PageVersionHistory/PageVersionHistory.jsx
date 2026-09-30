import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import getPageVersions from "../../services/page/getPageVersionsService";
import { useToast } from "../../contexts/ToastContext";
import Loading from "../../common/Loading/Loading";
import "./PageVersionHistory.css";

export default function PageVersionHistory() {
  const { pageId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [versions, setVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      const result = await getPageVersions(pageId);

      if (result && result.success !== false) {
        const historyData = result.versions || result;
        const sortedHistory = [...historyData].sort(
          (a, b) => b.version - a.version,
        );
        setVersions(sortedHistory);
        if (sortedHistory.length > 0) {
          setSelectedVersion(sortedHistory[0]);
        }
      } else {
        toast.error(result.message || "Không thể tải lịch sử trang.");
      }
      setIsLoading(false);
    };

    if (pageId) fetchHistory();
  }, [pageId, toast]);

  if (isLoading) return <Loading text="Đang tải mốc thời gian..." />;
  console.log("versions", versions);
  return (
    <div className="history-wrapper">
      <header className="history-header">
        <h1 className="history-title">⏳ Lịch sử phiên bản</h1>
        <button className="btn-back" onClick={() => navigate(-1)}>
          ← Quay lại
        </button>
      </header>

      <div className="history-body">
        <section className="preview-panel">
          {selectedVersion ? (
            <>
              <div className="active-version-badge">
                ĐANG XEM: VERSION {selectedVersion.version}
              </div>
              <img
                src={selectedVersion.preview_url || selectedVersion.file_url}
                alt={`Version ${selectedVersion.version}`}
                className="history-img"
              />
            </>
          ) : (
            <p className="font-black uppercase text-gray-400">
              Không có dữ liệu ảnh.
            </p>
          )}
        </section>

        <section className="timeline-panel">
          <h2 className="timeline-title">Dòng thời gian</h2>
          {versions.length === 0 ? (
            <p className="font-bold text-sm text-gray-500 text-center mt-4">
              Chưa có lịch sử.
            </p>
          ) : (
            versions.map((ver) => (
              <div
                key={ver._id}
                className={`version-card ${selectedVersion?._id === ver._id ? "version-card-active" : ""}`}
                onClick={() => setSelectedVersion(ver)}
              >
                <div className="version-info">
                  <div className="flex gap-2 items-center">
                    <span className="version-badge">V{ver.version_number}</span>
                    {ver.submitted_by && (
                      <span className="version-author">
                        👤 {ver.submitted_by.name}
                      </span>
                    )}
                  </div>
                </div>
                <div className="version-note">
                  {ver.commit_note || "Không có ghi chú nào đính kèm."}
                </div>
                <span className="version-date">
                  {new Date(ver.created_at || Date.now()).toLocaleString(
                    "vi-VN",
                  )}
                </span>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
