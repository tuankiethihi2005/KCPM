import React, { useState, useEffect } from "react";
import SeriesProgressTable from "../../../components/dashboard/SeriesProgressTable/SeriesProgressTable";
import { getDashboardStatsApi } from "../../../services/adminService";
import StatCard from "./components/StatCard";
import UserChart from "./components/UserChart";
import SeriesChart from "./components/SeriesChart";
import AtRiskList from "./components/AtRiskList";
import QuickActions from "./components/QuickActions";
import RecentNotifications from "./components/RecentNotifications";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await getDashboardStatsApi();
        if (result.success !== false && result.data) {
          setStats(result.data);
        } else {
          setError(result.message || "Không thể tải dữ liệu");
        }
      } catch (err) {
        setError("Không thể tải dữ liệu dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const userStats = stats?.users || {};
  const seriesStats = stats?.series || {};
  const taskStats = stats?.tasks || {};
  const atRiskSeries = stats?.atRiskSeries || [];
  const recentNotifs = stats?.recentNotifications || [];

  if (loading) {
    return (
      <div className="dashboard-wrapper">
        <h1 className="dashboard-title">Bảng điều khiển Quản trị viên (Admin)</h1>
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-24 bg-gray-100 border-4 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-100 border-4 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]" />
            <div className="h-64 bg-gray-100 border-4 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-wrapper">
        <h1 className="dashboard-title">Bảng điều khiển Quản trị viên (Admin)</h1>
        <div className="text-center py-12 border-4 border-black bg-white shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-gray-600 font-bold mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-[#FF5C00] text-white font-black border-2 border-black
              hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] transition-all"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper">
      <div className="flex items-center justify-between">
        <h1 className="dashboard-title">📊 Bảng điều khiển</h1>
        <span className="text-sm font-bold text-gray-500 bg-white border-2 border-black px-3 py-1">
          Admin
        </span>
      </div>

      {/* Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          icon="👥"
          label="Tổng người dùng"
          value={userStats.total || 0}
          sublabel="users"
          color="bg-white"
          to="/admin/users"
        />
        <StatCard
          icon="📚"
          label="Tổng series"
          value={seriesStats.total || 0}
          sublabel="series"
          color="bg-[#E8F5E9]"
          to="/board/all-series"
        />
        <StatCard
          icon="📦"
          label="Phát hành"
          value={seriesStats.byStatus?.Active || 0}
          sublabel="kỳ"
          color="bg-[#E3F2FD]"
          to="/admin/releases"
        />
        <StatCard
          icon="⚠️"
          label="Series có nguy cơ"
          value={seriesStats.byRiskStatus?.Critical || 0}
          sublabel="critical"
          color="bg-[#FFEDEE]"
          to="/admin/series"
        />
        <StatCard
          icon="🔔"
          label="Thông báo chờ đọc"
          value={recentNotifs.filter((n) => !n.is_read).length}
          sublabel="chưa đọc"
          color="bg-[#FFF8E1]"
          to="/notifications"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UserChart byRole={userStats.byRole} total={userStats.total} />
        <SeriesChart
          byStatus={seriesStats.byStatus}
          byRiskStatus={seriesStats.byRiskStatus}
          total={seriesStats.total}
        />
      </div>

      {/* Middle section: At-Risk + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AtRiskList series={atRiskSeries} />
        <QuickActions />
      </div>

      {/* Recent Notifications */}
      <RecentNotifications notifications={recentNotifs} />

      {/* Existing: Series Progress Table */}
      <div className="bg-white border-4 border-black p-5 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
        <h3 className="text-lg font-black uppercase mb-4">📈 Tiến độ Series</h3>
        <SeriesProgressTable />
      </div>
    </div>
  );
};

export default AdminDashboard;
