import { Link } from "react-router-dom";
import SeriesProgressTable from "../../../components/dashboard/SeriesProgressTable/SeriesProgressTable";
import "./EditorDashboard.css";

const EditorDashboard = () => {
  return (
    <div className="dashboard-wrapper">
      <h1 className="dashboard-title">Không gian làm việc Biên tập viên</h1>
      <div className="editor-dashboard-stack">
        <section className="editor-dashboard-row">
          <div className="card">
            <h2 className="card-title">Theo dõi tiến độ Studio</h2>
            <p className="card-desc">
              Tổng quan các chapter đang trong quá trình sản xuất và review.
            </p>
            <div className="placeholder-box">
              [Bảng Kanban tiến độ sản xuất]
            </div>
          </div>
        </section>

        <section className="editor-dashboard-row">
          <div className="widget-editor">
            <h2 className="widget-title-blue">Hiệu suất Series phụ trách</h2>
            <p className="widget-desc-blue">
              Cảnh báo và theo dõi xu hướng tăng giảm của studio.
            </p>
            <div className="ranking-item-blue">
              <span>Series B</span>
              <span className="text-risk">At Risk (Hạng 18)</span>
            </div>
            <Link to="/editor/ranking" className="btn-blue">
              Phân tích bảng xếp hạng
            </Link>
          </div>
        </section>

        <section className="editor-dashboard-row">
          <SeriesProgressTable />
        </section>
      </div>
    </div>
  );
};

export default EditorDashboard;
