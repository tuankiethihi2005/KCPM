import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import getPendingSeriesService from "../../../../services/board/getPendingSeriesService";
import "./BoardPendingWidget.css";

const BoardPendingWidget = () => {
  const [pendingSeries, setPendingSeries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const res = await getPendingSeriesService();

        // Logic bóc tách mảng an toàn
        let dataList = res?.pending || [];

        setPendingSeries(dataList.slice(0, 3));
      } catch (error) {
        console.error("Lỗi lấy danh sách chờ duyệt:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="widget-card-pending">
      <div className="widget-header">
        <h2 className="widget-title">Series Chờ Xét Duyệt</h2>
        <span className="badge-info">Cần Xử Lý</span>
      </div>

      <div className="flex-1 flex flex-col">
        {isLoading ? (
          <div className="empty-box">Đang tải dữ liệu...</div>
        ) : pendingSeries.length > 0 ? (
          pendingSeries.map((item) => (
            <div key={item.series._id} className="list-item-pending">
              {/* Thêm flex-1 min-w-0 để cắt chữ an toàn */}
              <div className="truncate pr-4 flex-1 min-w-0">
                <h3 className="font-black text-lg uppercase truncate">
                  {item.series.title || "Chưa có tên"}
                </h3>
                <span className="text-xs font-bold uppercase tracking-widest text-gray-600">
                  Thể loại: {item.series.genre || "Chưa cập nhật"}
                </span>
              </div>
              <Link
                to={`/board/series/${item.series._id}`}
                className="btn-action-primary"
              >
                Review
              </Link>
            </div>
          ))
        ) : (
          <div className="empty-box">Không có series nào đang chờ</div>
        )}
      </div>

      <Link to="/board/reviews" className="btn-block-primary">
        Xem toàn bộ danh sách duyệt
      </Link>
    </div>
  );
};

export default BoardPendingWidget;
