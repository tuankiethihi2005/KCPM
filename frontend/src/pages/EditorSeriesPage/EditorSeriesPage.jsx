import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Loading from "../../common/Loading/Loading";
import { useToast } from "../../contexts/ToastContext";
import { getEditorSeries } from "../../services/series/getSeriesByRoleService";
import "./EditorSeriesPage.css";

const STATUS_FILTERS = [
  "Tất cả",
  "Draft",
  "Active",
  "At Risk",
  "Hiatus",
  "Completed",
  "Cancelled",
  "Changed Schedule",
];

const RISK_FILTERS = ["Tất cả", "Safe", "Warning", "Critical"];

const SCHEDULE_LABELS = {
  weekly: "Hàng tuần",
  monthly: "Hàng tháng",
  "one-shot": "One-shot",
  "online only": "Chỉ online",
  none: "Chưa có lịch",
};

const normalize = (value) => (value || "").toString().trim().toLowerCase();

export default function EditorSeriesPage() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tất cả");
  const [riskFilter, setRiskFilter] = useState("Tất cả");

  const fetchSeries = useCallback(async () => {
    setIsLoading(true);
    const result = await getEditorSeries();

    if (result.success === false) {
      toast.error(result.message || "Không thể tải series phụ trách.");
      setItems([]);
    } else {
      setItems(result.series || []);
    }

    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchSeries();
  }, [fetchSeries]);

  const summary = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        const status = item.series?.status || "Draft";
        const risk = item.series?.risk_status || "Safe";

        if (status === "Active") acc.active += 1;
        if (status === "At Risk") acc.atRisk += 1;
        if (risk === "Critical") acc.critical += 1;

        return acc;
      },
      { active: 0, atRisk: 0, critical: 0 },
    );
  }, [items]);

  const filtered = useMemo(() => {
    const kw = normalize(keyword);

    return items.filter(({ series, proposal }) => {
      const status = series?.status || "Draft";
      const risk = series?.risk_status || "Safe";
      const authorName = series?.author_id?.name || "";
      const authorEmail = series?.author_id?.email || "";

      const matchStatus = statusFilter === "Tất cả" || status === statusFilter;
      const matchRisk = riskFilter === "Tất cả" || risk === riskFilter;
      const matchKeyword =
        !kw ||
        normalize(series?.title).includes(kw) ||
        normalize(series?.genre).includes(kw) ||
        normalize(authorName).includes(kw) ||
        normalize(authorEmail).includes(kw) ||
        normalize(proposal?.status).includes(kw);

      return matchStatus && matchRisk && matchKeyword;
    });
  }, [items, keyword, riskFilter, statusFilter]);

  const badgeClass = (prefix, value) =>
    `${prefix} ${prefix}-${normalize(value || "unknown").replace(/\s+/g, "-")}`;

  return (
    <div className="editor-series-wrapper">
      <header className="editor-series-header">
        <div>
          <p className="editor-series-eyebrow">Tantou Editor</p>
          <h1 className="editor-series-title">Series phụ trách</h1>
        </div>

        <Link to="/editor/progress" className="editor-series-progress-link">
          Tiến độ Studio
        </Link>
      </header>

      <section className="editor-series-stats" aria-label="Tổng quan series">
        <div className="editor-series-stat">
          <span>Tổng series</span>
          <strong>{items.length}</strong>
        </div>
        <div className="editor-series-stat">
          <span>Đang hoạt động</span>
          <strong>{summary.active}</strong>
        </div>
        <div className="editor-series-stat">
          <span>Có nguy cơ</span>
          <strong>{summary.atRisk}</strong>
        </div>
        <div className="editor-series-stat">
          <span>Nguy cấp</span>
          <strong>{summary.critical}</strong>
        </div>
      </section>

      <section className="editor-series-toolbar" aria-label="Bộ lọc series">
        <input
          className="editor-series-search"
          placeholder="Tìm theo tên series, tác giả, thể loại hoặc proposal..."
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
        />

        <div className="editor-series-filter-group">
          <span>Trạng thái</span>
          <div className="editor-series-chips">
            {STATUS_FILTERS.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`editor-series-chip ${
                  statusFilter === status ? "editor-series-chip-active" : ""
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="editor-series-filter-group">
          <span>Rủi ro</span>
          <div className="editor-series-chips">
            {RISK_FILTERS.map((risk) => (
              <button
                key={risk}
                type="button"
                onClick={() => setRiskFilter(risk)}
                className={`editor-series-chip ${
                  riskFilter === risk ? "editor-series-chip-active" : ""
                }`}
              >
                {risk}
              </button>
            ))}
          </div>
        </div>
      </section>

      {isLoading && <Loading text="Đang tải series phụ trách..." />}

      {!isLoading && filtered.length === 0 && (
        <div className="editor-series-empty">
          Không có series phụ trách nào khớp bộ lọc.
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <section className="editor-series-grid" aria-label="Series phụ trách">
          {filtered.map(({ series, proposal }) => {
            const schedule =
              SCHEDULE_LABELS[series?.approved_schedule] || "Chưa có lịch";
            const author =
              series?.author_id?.name || series?.author_id?.email || "Chưa rõ";

            return (
              <article key={series._id} className="editor-series-card">
                <div className="editor-series-card-top">
                  <h2>{series.title}</h2>
                  <span
                    className={badgeClass(
                      "editor-series-status",
                      series.status,
                    )}
                  >
                    {series.status || "Draft"}
                  </span>
                </div>

                <p className="editor-series-description">
                  {series.description || "Series chưa có mô tả chi tiết."}
                </p>

                <div className="editor-series-meta-grid">
                  <div>
                    <span>Tác giả</span>
                    <strong>{author}</strong>
                  </div>
                  <div>
                    <span>Thể loại</span>
                    <strong>{series.genre || "Chưa cập nhật"}</strong>
                  </div>
                  <div>
                    <span>Lịch phát hành</span>
                    <strong>{schedule}</strong>
                  </div>
                  <div>
                    <span>Độc giả</span>
                    <strong>{series.target_audience || "Chưa cập nhật"}</strong>
                  </div>
                </div>

                <div className="editor-series-card-footer">
                  <div>
                    <span
                      className={badgeClass(
                        "editor-series-risk",
                        series.risk_status,
                      )}
                    >
                      {series.risk_status || "Safe"}
                    </span>
                    <span className="editor-series-proposal">
                      Proposal: {proposal?.status || "Chưa có"}
                    </span>
                  </div>

                  {/* Điều hướng nhanh: xem chương và vào thẳng tiến độ của series */}
                  <div className="editor-series-card-links">
                    <Link to={`/chapter-list/${series._id}`}>Xem Chapters</Link>
                    <Link to={`/editor/progress?seriesId=${series._id}`}>
                      Tiến độ
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
