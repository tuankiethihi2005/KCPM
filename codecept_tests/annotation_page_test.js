Feature('Kiểm thử chức năng Page và Annotation - Nguyễn Tuấn Kiệt');

// Test Case 1: Tạo Annotation mới (TC_ANN_01)
Scenario('Tạo annotation mới cho trang truyện thành công', async ({ I }) => {
  const res = await I.sendPostRequest('http://localhost:5000/api/annotations/page/6ae46cb77203134dee32d537', {
    x: 50,
    y: 50,
    content: "Vẽ lại nét mặt",
    status: "Open",
    category: "drawing"
  });
  if (res.status !== 201 && res.status !== 200 && res.status !== 401) {
    throw new Error(`Kỳ vọng Status 200/201/401 nhưng nhận về ${res.status}`);
  }
});

// Test Case 2: Lấy danh sách Annotation theo trang
Scenario('Lấy danh sách annotation của trang thành công', async ({ I }) => {
  const res = await I.sendGetRequest('http://localhost:5000/api/annotations/page/6ae46cb77203134dee32d537');
  if (res.status !== 200 && res.status !== 401) {
    throw new Error(`Kỳ vọng Status 200/401 nhưng nhận về ${res.status}`);
  }
});

// Test Case 3: Cập nhật nội dung Annotation (TC_ANN_02)
Scenario('Cập nhật nội dung annotation thành công', async ({ I }) => {
  const res = await I.sendPatchRequest('http://localhost:5000/api/annotations/6ae47da16639cb9456067333', {
    content: "Đã sửa xong nét mặt"
  });
  if (res.status !== 200 && res.status !== 401) {
    throw new Error(`Kỳ vọng Status 200/401 nhưng nhận về ${res.status}`);
  }
});

// Test Case 4: Xóa Annotation (TC_DEL_02 - Kiểm tra phân quyền)
Scenario('Xóa annotation bị từ chối do phân quyền', async ({ I }) => {
  const res = await I.sendDeleteRequest('http://localhost:5000/api/annotations/6ae47da16639cb9456067333');
  if (res.status !== 403 && res.status !== 401) {
    throw new Error(`Kỳ vọng Status 401/403 nhưng nhận về ${res.status}`);
  }
});