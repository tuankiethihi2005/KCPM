import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import getMySeries from "../../services/series/getMySeriesService";
import Loading from "../../common/Loading/Loading";
import { useToast } from "../../contexts/ToastContext";
import "./MangakaSeriesListPage.css";

export default function MangakaSeriesListPage() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchList = useCallback(async () => {
    setIsLoading(true);
    const result = await getMySeries();
    if (result.success === false) {
      toast.error(result.message);
      setItems([]);
    } else {
      setItems(result.series || []);
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // Hàm lấy màu sắc chuẩn cho badge trạng thái
  const getStatusClass = (status) => {
    const s = (status || "Draft").toLowerCase().replace(/\s+/g, "-");
    return `badge-status status-${s}`;
  };

  return (
    <div className="mangaka-list-wrapper">
      <header className="mangaka-list-header">
        <div>
          <h1 className="mangaka-list-title">Series của tôi</h1>
          <p className="mangaka-list-desc">
            Quản lý hồ sơ series và đề xuất xét duyệt
          </p>
        </div>
        <Link to="/mangaka/series/new" className="btn-create-series">
          + Tạo series mới
        </Link>
      </header>

      {isLoading && <Loading text="Đang tải danh sách series..." />}

      {!isLoading && items.length === 0 && (
        <div className="empty-series-box">
          Chưa có series nào. Bấm &quot;Tạo series mới&quot; để bắt đầu.
        </div>
      )}

      {!isLoading && items.length > 0 && (
        <div className="mangaka-series-grid">
          {items.map(({ series, proposal }) => (
            // Thẻ div bao bọc có style neo-card
            <div key={series._id} className="neo-card">
              <div>
                {/* Phần Top chứa Title và Badge Trạng thái Series */}
                <div className="card-top">
                  <h2 className="card-title">{series.title}</h2>
                  <span className={getStatusClass(series.status)}>
                    {series.status}
                  </span>
                </div>

                {/* Nhóm Thông tin (Thể loại và Proposal) */}
                <div className="card-info-group">
                  <p className="card-genre">
                    Thể loại: {series.genre || "Chưa có thể loại"}
                  </p>
                  {proposal && (
                    <p className="card-meta">Proposal: {proposal.status}</p>
                  )}
                </div>
              </div>

              {/* Nhóm Action/Nút bấm nằm ở cuối Card */}
              <div className="card-actions">
                <Link
                  to={`/mangaka/series/${series._id}`}
                  className="btn-action-secondary"
                >
                  Thông tin chi tiết
                </Link>
                <Link
                  to={`/chapter-list/${series._id}`}
                  className="btn-action-primary"
                >
                  Quản lý Chapter
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
