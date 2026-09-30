/* eslint-disable react-hooks/set-state-in-effect */
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { RefreshCcw } from "lucide-react";
import RequirePermission from "../../components/security/RequirePermission";
import { useAuthStore } from "../../stores/authStore";

// Import các component con độc lập
import CreateIssuePanel from "../../components/RankingDashboard/CreateIssuePanel/CreateIssuePanel";
import ImportVotesPanel from "../../components/RankingDashboard/ImportVotesPanel/ImportVotesPanel";
import MetricsGrid from "../../components/RankingDashboard/MetricsGrid/MetricsGrid";
import LeaderboardPanel from "../../components/RankingDashboard/LeaderboardPanel/LeaderboardPanel";
import PerformanceChartPanel from "../../components/RankingDashboard/PerformanceChartPanel/PerformanceChartPanel";

import "./RankingDashboardPage.css";

const MANAGE_ROLES = ["Editorial Board", "Admin"];

export default function RankingDashboardPage() {
  const user = useAuthStore((state) => state.user);

  const location = useLocation();
  const isReleasesView = location.pathname.includes("/releases");
  const canManage = MANAGE_ROLES.includes(user?.role);

  // State dùng chung tối thiểu để các component đồng bộ khi có cập nhật lớn
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeFilters, setActiveFilters] = useState({
    issueId: "",
    genre: "",
  });

  const handleRefreshAll = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <RequirePermission required="CAN_VIEW_RANKING">
      <div className="ranking-wrapper">
        <header className="page-header">
          <div className="header-info">
            <h1 className="page-title">
              {isReleasesView
                ? "Phát hành & Bình chọn"
                : "Bảng xếp hạng Series"}
            </h1>
            <p className="page-desc">
              {isReleasesView
                ? "Tạo kỳ phát hành & nhập (import) vote độc giả"
                : "Theo dõi xếp hạng, điểm số & hiệu suất manga"}
            </p>
          </div>
          {!isReleasesView && (
            <button
              className="btn-secondary"
              type="button"
              onClick={handleRefreshAll}
            >
              <RefreshCcw size={18} />
              Làm mới toàn bộ
            </button>
          )}
        </header>

        {isReleasesView ? (
          <div className="ranking-grid">
            {canManage && <CreateIssuePanel />}
            {canManage && (
              <ImportVotesPanel onImportSuccess={handleRefreshAll} />
            )}
          </div>
        ) : (
          <>
            {/* Component quản lý các thẻ đo lường metrics */}
            <MetricsGrid refreshTrigger={refreshTrigger} activeFilters={activeFilters} />

            {/* Component quản lý bảng xếp hạng và các bộ lọc */}
            <LeaderboardPanel
              refreshTrigger={refreshTrigger}
              activeFilters={activeFilters}
              setActiveFilters={setActiveFilters}
            />

            {/* Component biểu đồ hiệu suất xử lý API riêng */}
            <PerformanceChartPanel
              canManage={canManage}
              refreshTrigger={refreshTrigger}
            />
          </>
        )}
      </div>
    </RequirePermission>
  );
}
