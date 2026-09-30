import React from "react";
import { Link } from "react-router-dom";
import SeriesProgressTable from "../../../components/dashboard/SeriesProgressTable/SeriesProgressTable";
import "./MangakaDashboard.css";

const MangakaDashboard = () => {
  return (
    <div className="dashboard-wrapper">
      <h1 className="dashboard-title">Màn hình làm việc Mangaka</h1>
      <div className="mangaka-dashboard-stack">
        <section className="mangaka-dashboard-row">
          <div className="card">
            <h2 className="card-title">Series của tôi</h2>
            <p className="card-desc">
              Danh sách các tác phẩm bạn đang sáng tác.
            </p>
            <div className="flex flex-col gap-3">
              <Link to="/mangaka/series" className="btn-indigo">
                Xem series của tôi
              </Link>
              <Link to="/mangaka/series/new" className="btn-indigo">
                + Tạo series mới
              </Link>
            </div>
          </div>
        </section>

        <section className="mangaka-dashboard-row">
          <div className="widget-mangaka">
            <h2 className="widget-title">Thứ hạng tác phẩm</h2>
            <p className="widget-desc">
              Cập nhật dựa trên bình chọn kỳ phát hành mới nhất.
            </p>
            <div className="ranking-item">
              <span>Series A</span>
              <span className="text-status">Hạng 3 (+2)</span>
            </div>
            <Link to="/mangaka/ranking" className="btn-indigo">
              Xem bảng chi tiết
            </Link>
          </div>
        </section>

        <section className="mangaka-dashboard-row">
          <SeriesProgressTable />
        </section>
      </div>
    </div>
  );
};

export default MangakaDashboard;
