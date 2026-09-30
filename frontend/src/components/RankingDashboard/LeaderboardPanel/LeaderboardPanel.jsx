import { useState, useEffect, useCallback, useRef } from "react";
import { Filter, ChevronDown } from "lucide-react";
import getLeaderboard from "../../../services/ranking/getLeaderboardService";
import { getAllSeries } from "../../../services/series/getSeriesByRoleService";
import Loading from "../../../common/Loading/Loading";

const numberFormatter = new Intl.NumberFormat("vi-VN");

export default function LeaderboardPanel({ refreshTrigger, activeFilters, setActiveFilters }) {
  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState({
    issueId: activeFilters?.issueId || "",
    genre: activeFilters?.genre || "",
  });
  const [loading, setLoading] = useState(true);
  const [dynamicGenres, setDynamicGenres] = useState([]);
  const [availableIssues, setAvailableIssues] = useState([]);
  const [issueDropdownOpen, setIssueDropdownOpen] = useState(false);
  const issueDropdownRef = useRef(null);

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (issueDropdownRef.current && !issueDropdownRef.current.contains(e.target)) {
        setIssueDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    const result = await getLeaderboard(activeFilters || {});
    const dataList = Array.isArray(result) ? result : result?.data || [];

    // Cập nhật danh sách kỳ phát hành từ response (sắp xếp mới nhất lên đầu)
    if (result?.availableIssues?.length > 0) {
      setAvailableIssues(result.availableIssues);
      // Nếu chưa chọn kỳ nào, tự động chọn kỳ mới nhất
      setFilters((prev) => ({
        ...prev,
        issueId: prev.issueId || result.availableIssues[0].id,
      }));
    }

    // CHUẨN HÓA DỮ LIỆU TỪ DB TRƯỚC KHI RENDER
    const mappedRows = dataList.map((row) => {
      // Xác định trạng thái cảnh báo dựa trên Model
      const isAtRisk = row.cancellationWarning === true;

      return {
        ...row,
        seriesName:
          row.seriesName || row.series?.title || row.title || "Chưa có tên",
        authorName: row.authorName || "Ẩn danh",
        cancellationWarning: isAtRisk,
      };
    });

    setRows(mappedRows);
    setLoading(false);
  }, [activeFilters]);

  useEffect(() => {
    const loadDynamicGenres = async () => {
      try {
        const result = await getAllSeries();
        if (result && result.success !== false) {
          const dataList =
            result.series || (Array.isArray(result) ? result : []);

          // Lấy tất cả thể loại từ truyện, bỏ qua giá trị rỗng (null/undefined)
          const extractedGenres = dataList
            .map((s) => s.series?.genre || s.genre)
            .filter((g) => g && g.trim() !== "");

          // Dùng Set để loại bỏ các thể loại trùng lặp (ví dụ: 10 truyện Action thì chỉ lấy 1 chữ Action)
          const uniqueGenres = [...new Set(extractedGenres)];

          setDynamicGenres(uniqueGenres);
        }
      } catch (error) {
        console.error("Lỗi khi tải danh sách thể loại động:", error);
      }
    };

    loadDynamicGenres();
  }, [refreshTrigger]);

  useEffect(() => {
    fetchRows();
  }, [refreshTrigger, fetchRows]);

  const handleFilterClick = () => {
    setActiveFilters(filters);
  };

  return (
    <section className="neo-panel">
      <div className="ranking-toolbar">
        <div className="panel-title border-b-0 mb-0">
          <Filter size={24} />
          <h2>Bảng xếp hạng Manga</h2>
        </div>
        <div className="ranking-filters">
          {/* Dropdown Mã kỳ – custom scrollable, giống biểu đồ */}
          <div
            ref={issueDropdownRef}
            style={{ position: "relative", display: "inline-block" }}
          >
            <button
              type="button"
              className="neo-select !py-2 !w-auto"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "8px",
                minWidth: "160px",
                cursor: loading || availableIssues.length === 0 ? "not-allowed" : "pointer",
                opacity: loading || availableIssues.length === 0 ? 0.6 : 1,
              }}
              onClick={() => !loading && availableIssues.length > 0 && setIssueDropdownOpen((o) => !o)}
              disabled={loading || availableIssues.length === 0}
            >
              <span>{filters.issueId || "Mã kỳ..."}</span>
              <ChevronDown
                size={14}
                style={{
                  flexShrink: 0,
                  transition: "transform 0.2s",
                  transform: issueDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                }}
              />
            </button>

            {issueDropdownOpen && (
              <ul
                style={{
                  position: "absolute",
                  top: "calc(100% + 4px)",
                  left: 0,
                  zIndex: 9999,
                  background: "#fff",
                  border: "2px solid #111",
                  borderRadius: "6px",
                  boxShadow: "4px 4px 0 #111",
                  maxHeight: "260px",
                  overflowY: "auto",
                  overflowX: "hidden",
                  minWidth: "160px",
                  margin: 0,
                  padding: "4px 0",
                  listStyle: "none",
                }}
              >
                {availableIssues.map((issue) => (
                  <li
                    key={issue.id}
                    onClick={() => {
                      setFilters((prev) => ({ ...prev, issueId: issue.id }));
                      setIssueDropdownOpen(false);
                    }}
                    style={{
                      padding: "8px 14px",
                      cursor: "pointer",
                      fontWeight: filters.issueId === issue.id ? "700" : "500",
                      fontSize: "14px",
                      background: filters.issueId === issue.id ? "#111" : "transparent",
                      color: filters.issueId === issue.id ? "#fff" : "#111",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      if (filters.issueId !== issue.id) e.currentTarget.style.background = "#f3f4f6";
                    }}
                    onMouseLeave={(e) => {
                      if (filters.issueId !== issue.id) e.currentTarget.style.background = "transparent";
                    }}
                  >
                    {issue.id}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <select
            className="neo-select !py-2 !w-auto"
            value={filters.genre}
            onChange={(e) => setFilters({ ...filters, genre: e.target.value })}
          >
            <option value="">Tất cả thể loại</option>
            {dynamicGenres.map((genre, index) => (
              <option key={`genre-${index}`} value={genre}>
                {genre}
              </option>
            ))}
          </select>
          <button
            className="btn-primary !py-2 !px-4"
            type="button"
            onClick={handleFilterClick}
            disabled={loading}
          >
            Lọc
          </button>
        </div>
      </div>

      <div className="table-responsive">
        <table className="neo-table">
          <thead>
            <tr>
              <th>Hạng</th>
              <th>Manga</th>
              <th>Kỳ phát hành</th>
              <th>Số phiếu</th>
              <th>Điểm TB</th>
              <th>Tổng điểm</th>
              <th>Xu hướng</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              /* DÙNG COMPONENT LOADING CỦA BẠN KHI ĐANG TẢI */
              <tr>
                <td
                  colSpan="8"
                  className="relative"
                  style={{ height: "200px" }}
                >
                  <Loading text="Đang tải dữ liệu bảng xếp hạng..." />
                </td>
              </tr>
            ) : rows.length === 0 ? (
              /* KHI KHÔNG CÓ DỮ LIỆU */
              <tr>
                <td colSpan="8" className="text-center p-4">
                  Chưa có dữ liệu xếp hạng khớp điều kiện lọc.
                </td>
              </tr>
            ) : (
              /* KHI CÓ DỮ LIỆU THÌ RENDER BẢNG BÌNH THƯỜNG */
              rows.map((row, index) => (
                <tr key={`${row.issueId || index}-${row.seriesId}`}>
                  <td>
                    <span className="rank-number">#{row.currentRank}</span>
                  </td>
                  <td>
                    <strong className="series-name">{row.seriesName}</strong>
                    <span className="series-id">{row.authorName}</span>
                  </td>
                  <td>{row.issueId}</td>
                  <td>{numberFormatter.format(Number(row.votes || 0))}</td>
                  <td>{row.avgScore}</td>
                  <td>{row.totalScore}</td>
                  <td>
                    <span
                      className={`trend-badge trend-${(row.trend || "stable").toLowerCase()}`}
                    >
                      {row.trend || "STABLE"}
                    </span>
                  </td>
                  <td>
                    {row.cancellationWarning ? (
                      <span className="status-warning">Nguy cơ cao</span>
                    ) : (
                      <span className="status-safe">An toàn</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
