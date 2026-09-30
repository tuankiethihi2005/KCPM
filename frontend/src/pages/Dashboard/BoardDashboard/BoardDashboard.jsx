import React from "react";
import BoardAtRiskWidget from "../../../components/dashboard/Board/BoardAtRiskWidget/BoardAtRiskWidget";
import BoardLeaderboardWidget from "../../../components/dashboard/Board/BoardLeaderboardWidget/BoardLeaderboardWidget";
import BoardPendingWidget from "../../../components/dashboard/Board/BoardPendingWidget/BoardPendingWidget";
import SeriesProgressTable from "../../../components/dashboard/SeriesProgressTable/SeriesProgressTable";
import "./BoardDashboard.css";

const BoardDashboard = () => {
  return (
    <div className="dashboard-wrapper">
      <h1 className="dashboard-title">Bảng Quyết Định Biên Tập</h1>

      <div className="board-dashboard-stack">
        <section className="board-dashboard-row">
          <BoardPendingWidget />
        </section>

        <section className="board-dashboard-row">
          <BoardAtRiskWidget />
        </section>

        <section className="board-dashboard-row">
          <SeriesProgressTable />
        </section>

        <section className="board-dashboard-row">
          <BoardLeaderboardWidget />
        </section>
      </div>
    </div>
  );
};

export default BoardDashboard;
