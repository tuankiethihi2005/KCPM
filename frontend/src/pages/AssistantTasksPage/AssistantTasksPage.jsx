// AssistantTasksPage.jsx
import React, { useEffect, useState, useCallback } from "react";
import { getTasksApi, getTaskByIdApi } from "../../services/task/taskService";
import { useToast } from "../../contexts/ToastContext";
import Loading from "../../common/Loading/Loading";
import { isOverdue, isNearDeadline } from "../../utils/taskHelpers";

// Import các Component con
import TaskFilterBar from "../../components/Task/TaskFilterBar/TaskFilterBar";
import TaskCard from "../../components/Task/TaskCard/TaskCard";
import TaskDetail from "../../components/Task/TaskDetail/TaskDetail";

import { useSearchParams } from "react-router-dom";

import "./AssistantTasksPage.css";

export default function AssistantTasksPage() {
  const [searchParams] = useSearchParams();

  const taskId = searchParams.get("taskId");
  const toast = useToast();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");

  const [selectedTask, setSelectedTask] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    const filter = statusFilter ? { status: statusFilter } : {};
    const result = await getTasksApi(filter);

    if (result.success === false) {
      toast.error(result.message);
    } else {
      // Sort tasks
      const sortedTasks = [...(result.tasks || [])].sort((a, b) => {
        const aOver = isOverdue(a) ? 1 : 0;
        const bOver = isOverdue(b) ? 1 : 0;
        if (bOver !== aOver) return bOver - aOver;

        const aNear = isNearDeadline(a) ? 1 : 0;
        const bNear = isNearDeadline(b) ? 1 : 0;
        return bNear - aNear;
      });
      setTasks(sortedTasks);
    }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleSelectTask = async (taskId) => {
    setDetailLoading(true);
    const result = await getTaskByIdApi(taskId);
    if (result.success === false) {
      toast.error(result.message);
    } else {
      setSelectedTask(result);
    }
    setDetailLoading(false);
  };

  useEffect(() => {
    if (taskId) {
      handleSelectTask(taskId);
    }
  }, [taskId]);

  // Hàm này dùng để gọi lại data sau khi nộp bài thành công
  const handleRefreshData = async () => {
    if (selectedTask?.task?._id) {
      await handleSelectTask(selectedTask.task._id);
      fetchTasks();
    }
  };

  return (
    <div className="atp-container">
      {loading && <Loading text="Đang tải danh sách công việc..." />}

      <header className="atp-header">
        <h1 className="atp-title">Công việc của tôi</h1>
        <p className="atp-subtitle">
          Nhận task vẽ, nộp bản thảo và nhận thu nhập tương tác
        </p>
      </header>

      <TaskFilterBar
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      <div className="atp-layout">
        {/* CỘT TRÁI: DANH SÁCH TASK */}
        <section className="atp-list-section">
          {tasks.length === 0 ? (
            <div className="atp-empty-state">
              <h3>Không có công việc nào</h3>
              <p>Hiện tại bạn không có công việc nào ở trạng thái này.</p>
            </div>
          ) : (
            <div className="atp-list">
              {tasks.map((task) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  isSelected={selectedTask?.task?._id === task._id}
                  onClick={() => handleSelectTask(task._id)}
                />
              ))}
            </div>
          )}
        </section>

        {/* CỘT PHẢI: CHI TIẾT TASK */}
        <section className="atp-detail-section">
          <TaskDetail
            selectedTask={selectedTask}
            detailLoading={detailLoading}
            onRefreshData={handleRefreshData}
          />
        </section>
      </div>
    </div>
  );
}
