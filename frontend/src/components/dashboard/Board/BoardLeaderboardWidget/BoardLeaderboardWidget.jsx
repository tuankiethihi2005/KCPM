import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import getLeaderboardService from "../../../../services/ranking/getLeaderboardService";
import "./BoardLeaderboardWidget.css";

const BoardLeaderboardWidget = () => {
  const [leaders, setLeaders] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // Bổ sung loading cho đồng bộ UX

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const res = await getLeaderboardService();

        // FIX 1: Chống Crash do .slice() khi res không phải object {data}
        const dataList = Array.isArray(res) ? res : res?.data || [];

        if (dataList.length > 0) {
          setLeaders(dataList.slice(0, 3));
        }
      } catch (error) {
        console.error("Lỗi lấy leaderboard:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="widget-card-leaderboard">
      <div className="leaderboard-header">
        <h2 className="leaderboard-title">Top Xếp Hạng Hiện Tại</h2>
        <Link
          to="/board/ranking"
          className="font-black uppercase text-sm border-b-2 border-black hover:text-white"
        >
          Xem Bảng Đầy Đủ &rarr;
        </Link>
      </div>

      <div className="leaderboard-grid">
        {isLoading ? (
          <div className="md:col-span-3 font-black uppercase text-center p-4">
            Đang tải xếp hạng...
          </div>
        ) : leaders.length > 0 ? (
          leaders.map((item, index) => (
            // FIX 2: Bắt _id hoặc id của MongoDB
            <div
              key={item.seriesId || item._id || item.id || index}
              className="leaderboard-item"
            >
              <div className="rank-badge">#{item.currentRank || index + 1}</div>

              {/* FIX 3: Bắt chuẩn tên biến của hệ thống Ranking (seriesName) */}
              <h3 className="font-black uppercase mb-1">
                {item.seriesName ||
                  item.series_title ||
                  item.title ||
                  `Tác phẩm ${index + 1}`}
              </h3>

              {/* FIX 4: Bắt chuẩn điểm của hệ thống Ranking (totalScore) */}
              <span className="text-[#23A094] font-black uppercase text-sm">
                {item.totalScore || item.score || 0} Điểm
              </span>
            </div>
          ))
        ) : (
          <div className="md:col-span-3 bg-white border-4 border-dashed border-black p-6 font-black uppercase text-center">
            Chưa có dữ liệu xếp hạng
          </div>
        )}
      </div>
    </div>
  );
};

export default BoardLeaderboardWidget;
