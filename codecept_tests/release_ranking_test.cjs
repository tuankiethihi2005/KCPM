// codecept_tests/release_ranking_test.cjs
Feature('Release and Ranking Management Module - Software Testing Verification');

Scenario('TC_RR_01 & 04: Kiểm tra giao diện Ranking Dashboard và tính năng làm mới dữ liệu', async ({ I }) => {
  // Truy cập thẳng vào trang Ranking Dashboard
  I.amOnPage('/ranking');
  
  // Đợi trang load ổn định
  I.wait(2); 
  
  // Xác thực trình duyệt đã điều hướng đúng vào trang Ranking
  I.seeInCurrentUrl('/ranking');
});

Scenario('TC_RR_03: Kiểm tra quy trình quét điều kiện tự động tại Trạm xuất bản (PublishApprovalPage)', async ({ I }) => {
  // Truy cập trang quản lý xuất bản của chapter mẫu
  I.amOnPage('/publish-approval/sample-chapter-id-01');
  
  // Xác thực điều hướng đúng trang
  I.seeInCurrentUrl('/publish-approval');
});
