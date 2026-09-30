import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import getSeriesProgress from "../../../services/series/getSeriesProgressService";
import "./SeriesProgressTable.css";

const PAGE_SIZE = 10;

const FILTER_OPTIONS = [
  { label: "Cần chú ý", value: "attention" },
  { label: "Chậm tiến độ", value: "at_risk" },
  { label: "Tiến độ thấp", value: "low_progress" },
  { label: "Tất cả", value: "all" },
];

const SeriesProgressTable = () => {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("attention");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadProgress = async () => {
      setIsLoading(true);

      const result = await getSeriesProgress({
        page,
        limit: PAGE_SIZE,
        search,
        filter,
        sort: filter === "all" ? "updated_desc" : "attention",
      });

      if (!isMounted) return;

      if (result.success === false) {
        setItems([]);
        setTotal(0);
        setTotalPages(1);
      } else {
        setItems(result.items || []);
        setTotal(result.total || 0);
        setTotalPages(result.totalPages || 1);
      }

      setIsLoading(false);
    };

    loadProgress();

    return () => {
      isMounted = false;
    };
  }, [filter, page, search]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleFilterChange = (event) => {
    setPage(1);
    setFilter(event.target.value);
  };

  return (
    <div className="series-progress-card">
      <div className="series-progress-header">
        <div>
          <h2 className="series-progress-title">Tiến độ Series</h2>
        </div>
        <Link to="/editor/progress" className="series-progress-link">
          Xem quản lý tiến độ
        </Link>
      </div>

      <form className="series-progress-controls" onSubmit={handleSearchSubmit}>
        <input
          aria-label="Tìm series"
          placeholder="Tìm series..."
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
        />
        <select
          aria-label="Lọc tiến độ"
          value={filter}
          onChange={handleFilterChange}
        >
          {FILTER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button type="submit">Tìm</button>
      </form>

      <div className="series-progress-table-wrap">
        <table className="series-progress-table">
          <thead>
            <tr>
              <th>Series</th>
              <th>Tiến độ</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="2">Đang tải tiến độ...</td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan="2">Không có series phù hợp.</td>
              </tr>
            ) : (
              items.map((series) => (
                <tr key={series.id}>
                  <td>
                    <div className="series-name-cell">
                      <strong>{series.title}</strong>
                      {series.overdueTasks > 0 && (
                        <span>{series.overdueTasks} task quá hạn</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="series-progress-cell">
                      <div className="series-progress-bar">
                        <span style={{ width: `${series.progress}%` }} />
                      </div>
                      <strong>{series.progress}%</strong>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="series-progress-pagination">
          <button
            type="button"
            disabled={page <= 1 || isLoading}
            onClick={() => setPage((current) => Math.max(current - 1, 1))}
          >
            Trước
          </button>
          <span>
            Trang {page}/{totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages || isLoading}
            onClick={() =>
              setPage((current) => Math.min(current + 1, totalPages))
            }
          >
            Sau
          </button>
        </div>
      )}
    </div>
  );
};

export default SeriesProgressTable;
