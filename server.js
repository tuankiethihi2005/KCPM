const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// 1. Kho dữ liệu tạm thời
let annotations = []; 
let tasks = [
  { id: 1, title: "Dịch thô Chapter 7", status: "DONE", deadline: "2026-06-10" },
  { id: 2, title: "Edit hội thoại & Khớp bóng thoại", status: "IN_PROGRESS", deadline: "2026-06-25" },
  { id: 3, title: "Check lỗi chính tả & Clean trang", status: "TODO", deadline: "2026-06-15" } // Deadline này quá hạn so với năm 2026 hiện tại -> Sẽ báo đỏ
];

// 2. API lấy danh sách task và tính tỷ lệ % hoàn thành
app.get('/api/tasks', (req, res) => {
  const total = tasks.length;
  const doneCount = tasks.filter(t => t.status === 'DONE').length;
  const percentage = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  res.json({ tasks, percentage });
});

// 3. API cập nhật trạng thái khi kéo thả Kanban
app.patch('/api/tasks/:id/status', (req, res) => {
  const taskId = parseInt(req.params.id);
  const { newStatus } = req.body; 

  tasks = tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t);
  res.json({ success: true });
});

// 4. API lấy danh sách ghim comment
app.get('/api/annotations', (req, res) => {
  res.json(annotations);
});

// 5. API lưu ghim comment mới theo tọa độ
app.post('/api/annotations', (req, res) => {
  const { pctX, pctY, content } = req.body;
  const newAnnotation = { id: Date.now(), pctX, pctY, content };
  annotations.push(newAnnotation);
  res.json(newAnnotation);
});

app.listen(PORT, () => {
  console.log(`Backend của bạn đang chạy tốt tại: http://localhost:${PORT}`);
});
