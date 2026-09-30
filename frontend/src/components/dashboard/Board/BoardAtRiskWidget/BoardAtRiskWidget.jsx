import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import getAtRiskSeriesService from "../../../../services/series/getAtRiskSeriesService";
import "./BoardAtRiskWidget.css";

const BoardAtRiskWidget = () => {
  const [atRiskSeries, setAtRiskSeries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const res = await getAtRiskSeriesService();

        // Logic bóc tách mảng an toàn
        let dataList = res?.series || [];

        setAtRiskSeries(dataList.slice(0, 3));
      } catch (error) {
        console.error("Lỗi lấy danh sách at-risk:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="widget-card-danger">
      <div className="danger-header">
        <h2 className="danger-title">Cảnh Báo Báo Động</h2>
      </div>

      <div className="flex-1 flex flex-col">
        {isLoading ? (
          <div className="font-black uppercase text-white mb-4">
            Đang kiểm tra...
          </div>
        ) : atRiskSeries.length > 0 ? (
          atRiskSeries.map((item) => (
            // FIX: Bắt chuẩn ID từ MongoDB
            <div key={item._id || item.id} className="list-item-danger">
              <div className="truncate pr-2">
                <h3 className="font-black text-base uppercase truncate">
                  {item.title || "Chưa có tên"}
                </h3>
                <span className="text-xs font-bold uppercase tracking-widest text-[#FF4545]">
                  Hạng: {item.currentRank || item.rank || "N/A"}
                </span>
              </div>
              <Link
                // FIX: Tránh truyền /undefined vào thanh URL
                to={`/board/series/${item._id || item.id}`}
                className="btn-action-danger"
              >
                Xử Lý
              </Link>
            </div>
          ))
        ) : (
          <div className="bg-white border-4 border-black p-4 font-black uppercase text-center flex-1 flex items-center justify-center">
            Hệ thống ổn định
          </div>
        )}
      </div>

      <Link to="/board/at-risk" className="btn-block-danger">
        Quyết định huỷ / Đổi lịch
      </Link>
    </div>
  );
};

export default BoardAtRiskWidget;
