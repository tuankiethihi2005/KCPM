import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getAllSeries } from "../../services/series/getSeriesByRoleService";
import Loading from "../../common/Loading/Loading";
import { useToast } from "../../contexts/ToastContext";
import "./AllSeriesPage.css";

const APPROVED_SERIES_STATUSES = [
  "Active",
  "At Risk",
  "Hiatus",
  "Completed",
  "Changed Schedule",
  "Cancelled",
];

const STATUS_FILTERS = ["Tất cả", ...APPROVED_SERIES_STATUSES];

const isApprovedCatalogItem = ({ series, proposal }) => {
  if (proposal?.status === "Approved") return true;
  return APPROVED_SERIES_STATUSES.includes(series?.status);
};

export default function AllSeriesPage() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tất cả");

  const fetchList = useCallback(async () => {
    setIsLoading(true);
    const result = await getAllSeries();
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

  const approvedItems = useMemo(
    () => items.filter(isApprovedCatalogItem),
    [items],
  );

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return approvedItems.filter(({ series }) => {
      const matchStatus =
        statusFilter === "Tất cả" || series?.status === statusFilter;
      const matchKeyword =
        !kw ||
        series?.title?.toLowerCase().includes(kw) ||
        series?.author_id?.name?.toLowerCase().includes(kw) ||
        series?.author_id?.email?.toLowerCase().includes(kw);
      return matchStatus && matchKeyword;
    });
  }, [approvedItems, keyword, statusFilter]);

  const getStatusClass = (status) => {
    const s = (status || "Draft").toLowerCase().replace(/\s+/g, "-");
    return `all-series-badge status-${s}`;
  };

  return (
    <div className="all-series-wrapper">
      <header className="page-header">
        <h1 className="page-title">Danh sách Series đã duyệt</h1>
        <p className="page-desc">
          Toàn bộ series đã qua xét duyệt trong hệ thống ({approvedItems.length})
        </p>
      </header>

      <div className="all-series-toolbar">
        <input
          className="all-series-search"
          placeholder="Tìm theo tên series hoặc tác giả..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <div className="all-series-filters">
          {STATUS_FILTERS.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`filter-chip ${
                statusFilter === status ? "filter-chip-active" : ""
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <Loading text="Đang tải series đã duyệt..." />}

      {!isLoading && filtered.length === 0 && (
        <div className="empty-box">
          Chưa có series đã duyệt nào khớp bộ lọc.
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <div className="all-series-grid">
          {filtered.map(({ series, proposal }) => (
            // Đổi từ Link sang div
            <div key={series._id} className="neo-card">
              <div className="card-top">
                <h2 className="card-title">{series.title}</h2>
                <span className={getStatusClass(series.status)}>
                  {series.status}
                </span>
              </div>
              <div className="card-info-group">
                <p className="card-author">
                  Tác giả:{" "}
                  {series?.author_id?.name || series?.author_id?.email || "—"}
                </p>
                <p className="card-genre">
                  {series.genre || "Chưa có thể loại"}
                </p>
                {proposal && (
                  <p className="card-meta">Proposal: {proposal.status}</p>
                )}
              </div>

              {/* Bổ sung thanh điều hướng ở cuối card */}
              <div className="card-actions">
                <Link
                  to={`/board/series/${series._id}`}
                  className="btn-action-review"
                >
                  Xem hồ sơ
                </Link>
                <Link
                  to={`/chapter-list/${series._id}`}
                  className="btn-action-chapters"
                >
                  Chapter
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
