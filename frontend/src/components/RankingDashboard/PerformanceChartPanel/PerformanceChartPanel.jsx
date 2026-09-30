import { useState, useEffect, useRef } from "react";
import { BarChart3, ChevronDown } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";
import getLeaderboard from "../../../services/ranking/getLeaderboardService";

export default function PerformanceChartPanel({ refreshTrigger }) {
  const [issues, setIssues] = useState([]);
  const [selectedIssue, setSelectedIssue] = useState("");
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Óng ngắm click bên ngoài để đóng dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 1. Tải danh sách các kỳ phát hành dụy nhất
  useEffect(() => {
    const loadIssuesList = async () => {
      setLoading(true);
      const result = await getLeaderboard({});
      if (result && result.success !== false) {
        // Sử dụng availableIssues trực tiếp từ backend (object {id, label, createdAt})
        // Đã được sắp xếp theo createdAt giảm dần phía backend
        let issueList = result?.availableIssues || [];

        // Fallback nếu backend cũ vẫn trả về mảng string
        if (issueList.length > 0 && typeof issueList[0] === "string") {
          issueList = issueList.map(id => ({ id, label: id }));
          issueList.sort((a, b) => b.id.localeCompare(a.id));
        }

        setIssues(issueList);
        if (issueList.length > 0) {
          setSelectedIssue((prev) => {
            const isStillValid = issueList.some(iss => iss.id === prev);
            if (prev && isStillValid) return prev;
            return issueList[0].id;
          });
        }
      }
      setLoading(false);
    };
    loadIssuesList();
  }, [refreshTrigger]);

  // 2. Tải dữ liệu các bộ truyện thuộc kỳ phát hành được chọn
  useEffect(() => {
    if (!selectedIssue) return;
    const loadChartData = async () => {
      const result = await getLeaderboard({ issueId: selectedIssue });
      if (result && result.success !== false) {
        const dataList = Array.isArray(result) ? result : result?.data || [];

        // Format dữ liệu vẽ biểu đồ, xếp từ tổng điểm cao nhất -> thấp
        const formatted = dataList.map((item) => ({
          name: item.seriesName,
          totalScore: item.totalScore,
          currentRank: item.currentRank,
          votes: item.votes,
          avgScore: item.avgScore,
          cancellationWarning: item.cancellationWarning
        })).sort((a, b) => b.totalScore - a.totalScore);

        setChartData(formatted);
      }
    };
    loadChartData();
  }, [selectedIssue, refreshTrigger]);

  // Render nhãn hiển thị thứ hạng trên đầu cột
  const renderCustomizedLabel = (props) => {
    const { x, y, width, value } = props;
    return (
      <text
        x={x + width / 2}
        y={y - 8}
        fill="#374151"
        textAnchor="middle"
        fontSize={12}
        fontWeight="bold"
      >
        {value}đ
      </text>
    );
  };

  // Custom Tooltip hiển thị kính mờ (Glassmorphism) cực kỳ đẹp và trực quan
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div
          className="custom-tooltip"
          style={{
            background: "rgba(255, 255, 255, 0.9)",
            border: "1px solid #e2e8f0",
            padding: "12px",
            borderRadius: "8px",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
          }}
        >
          <p style={{ margin: 0, fontWeight: "bold", color: "#1e293b" }}>{data.name}</p>
          <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#4f46e5" }}>
            <strong>Hạng:</strong> #{data.currentRank}
          </p>
          <p style={{ margin: "2px 0 0", fontSize: "13px", color: "#0f172a" }}>
            <strong>Tổng điểm:</strong> {data.totalScore}
          </p>
          <p style={{ margin: "2px 0 0", fontSize: "13px", color: "#475569" }}>
            <strong>Số phiếu:</strong> {data.votes}
          </p>
          <p style={{ margin: "2px 0 0", fontSize: "13px", color: "#475569" }}>
            <strong>Điểm TB:</strong> {data.avgScore}
          </p>
          {data.cancellationWarning && (
            <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#ef4444", fontWeight: "bold" }}>
              ⚠️ Nguy cơ cao (Tổng điểm &lt; 500)
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <section className="neo-panel mt-8">
      <div className="ranking-toolbar">
        <div className="panel-title border-b-0 mb-0">
          <BarChart3 size={24} />
          <h2>So sánh điểm số manga trong kỳ</h2>
        </div>

        {/* Scrollable custom dropdown cho kỳ phát hành */}
        <div
          ref={dropdownRef}
          style={{ position: "relative", display: "inline-block", minWidth: "220px" }}
        >
          {/* Nút trigger */}
          <button
            type="button"
            className="neo-select !w-auto"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "8px",
              minWidth: "220px",
              cursor: loading || issues.length === 0 ? "not-allowed" : "pointer",
              opacity: loading || issues.length === 0 ? 0.6 : 1,
            }}
            onClick={() => !loading && issues.length > 0 && setDropdownOpen((o) => !o)}
            disabled={loading || issues.length === 0}
          >
            <span>
              {selectedIssue
                ? (issues.find(i => i.id === selectedIssue)?.label || `Kỳ phát hành: ${selectedIssue}`)
                : "Chọn kỳ phát hành"}
            </span>
            <ChevronDown
              size={16}
              style={{
                flexShrink: 0,
                transition: "transform 0.2s",
                transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
              }}
            />
          </button>

          {/* Danh sách kỳ – scroll bên trong, không ảnh hưởng layout trang */}
          {dropdownOpen && (
            <ul
              style={{
                position: "absolute",
                top: "calc(100% + 4px)",
                right: 0,
                zIndex: 9999,
                background: "#fff",
                border: "2px solid #111",
                borderRadius: "6px",
                boxShadow: "4px 4px 0 #111",
                maxHeight: "260px",
                overflowY: "auto",
                overflowX: "hidden",
                minWidth: "220px",
                margin: 0,
                padding: "4px 0",
                listStyle: "none",
              }}
            >
              {issues.map((issue) => (
                <li
                  key={issue.id}
                  onClick={() => {
                    setSelectedIssue(issue.id);
                    setDropdownOpen(false);
                  }}
                  style={{
                    padding: "8px 14px",
                    cursor: "pointer",
                    fontWeight: selectedIssue === issue.id ? "700" : "500",
                    fontSize: "14px",
                    background: selectedIssue === issue.id ? "#111" : "transparent",
                    color: selectedIssue === issue.id ? "#fff" : "#111",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    if (selectedIssue !== issue.id) e.currentTarget.style.background = "#f3f4f6";
                  }}
                  onMouseLeave={(e) => {
                    if (selectedIssue !== issue.id) e.currentTarget.style.background = "transparent";
                  }}
                >
                  {issue.label || issue.id}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div style={{ width: "100%", height: 400, marginTop: "32px" }}>
        {loading ? (
          <div className="ranking-empty">Đang tải danh sách kỳ phát hành...</div>
        ) : !chartData.length ? (
          <div className="ranking-empty">
            Chưa có dữ liệu so sánh cho kỳ phát hành này.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 24, right: 20, bottom: 20, left: 20 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e2e8f0"
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#475569", fontSize: 13, fontWeight: 500 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748b" }}
                label={{
                  value: "Tổng điểm",
                  angle: -90,
                  position: "insideLeft",
                  fill: "#64748b",
                  dx: -10
                }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(226, 232, 240, 0.4)" }} />
              <Bar
                dataKey="totalScore"
                name="Tổng điểm"
                barSize={45}
                radius={[6, 6, 0, 0]}
                label={{ content: renderCustomizedLabel, position: "top" }}
              >
                {chartData.map((entry, index) => {
                  const isWarning = entry.cancellationWarning;
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={isWarning ? "#f59e0b" : "#4f46e5"}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
