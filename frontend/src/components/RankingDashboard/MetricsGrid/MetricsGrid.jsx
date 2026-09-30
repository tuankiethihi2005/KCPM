import { useState, useEffect } from "react";
import { Trophy, BarChart3, LineChart, AlertTriangle } from "lucide-react";
import getLeaderboard from "../../../services/ranking/getLeaderboardService";

const numberFormatter = new Intl.NumberFormat("vi-VN");

export default function MetricsGrid({ refreshTrigger, activeFilters }) {
  const [metrics, setMetrics] = useState({
    topSeries: "Chưa có",
    totalVotes: 0,
    avgScore: 0,
    riskCount: 0,
  });

  useEffect(() => {
    const loadMetrics = async () => {
      const result = await getLeaderboard(activeFilters || {});
      if (result && result.success !== false) {
        const dataList = Array.isArray(result) ? result : result.data || [];
        if (dataList.length === 0) {
          setMetrics({
            topSeries: "Chưa có",
            totalVotes: 0,
            avgScore: 0,
            riskCount: 0,
          });
          return;
        }

        // MAPPING DỮ LIỆU
        // Ưu tiên đọc từ 'title' nếu 'seriesName' không tồn tại
        const top =
          dataList[0]?.seriesName ||
          dataList[0]?.series?.title ||
          dataList[0]?.title ||
          "Chưa có dữ liệu";

        const total = dataList.reduce(
          (sum, item) => sum + Number(item.votes || 0),
          0,
        );
        const avg =
          dataList.length > 0
            ? dataList.reduce(
                (sum, item) => sum + Number(item.totalScore || 0),
                0,
              ) / dataList.length
            : 0;

        // Đếm số lượng rủi ro dựa trên cancellationWarning (tổng điểm dưới 500)
        const risk = dataList.filter(
          (item) => item.cancellationWarning === true,
        ).length;

        setMetrics({
          topSeries: top,
          totalVotes: total,
          avgScore: avg,
          riskCount: risk,
        });
      }
    };
    loadMetrics();
  }, [refreshTrigger, activeFilters]);

  return (
    <section className="metrics-grid" aria-label="Thống kê xếp hạng">
      <Card
        icon={<Trophy size={28} />}
        label="Manga dẫn đầu"
        value={metrics.topSeries}
        detail="Hạng cao nhất hiện tại"
      />
      <Card
        icon={<BarChart3 size={28} />}
        label="Tổng số phiếu"
        value={numberFormatter.format(metrics.totalVotes)}
        detail="Phiếu thu về từ độc giả"
      />
      <Card
        icon={<LineChart size={28} />}
        label="Điểm trung bình"
        value={metrics.avgScore.toFixed(2)}
        detail="Điểm tổng hợp hệ thống"
      />
      <Card
        icon={<AlertTriangle size={28} />}
        label="Nhóm cảnh báo"
        value={metrics.riskCount}
        detail="Nguy cơ giảm hạng/hủy"
        isDanger={metrics.riskCount > 0}
      />
    </section>
  );
}

function Card({ icon, label, value, detail, isDanger }) {
  return (
    <article className={`metric-card ${isDanger ? "metric-card--danger" : ""}`}>
      <div className="metric-icon">{icon}</div>
      <div className="metric-content">
        <span className="metric-label">{label}</span>
        <strong className="metric-value">{value}</strong>
        <p className="metric-detail">{detail}</p>
      </div>
    </article>
  );
}
