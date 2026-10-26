Feature("Đăng nhập hệ thống");

Scenario("Kiểm thử đăng nhập thất bại với tài khoản sai", ({ I }) => {
  // 1. Truy cập vào trang đăng nhập (đường dẫn tự động nối tiếp vào url gốc trong codecept.conf.js)
  I.amOnPage("/login");

  // 2. Điền thông tin vào form (tìm theo nhãn hoặc placeholder)
  I.fillField("Email", "sai_tai_khoan@example.com");
  I.fillField("#password", "wrongpassword");

  // 3. Nhấp vào nút đăng nhập
  I.click("Đăng nhập");

  // 4. Kiểm tra xem thông báo lỗi có xuất hiện trên màn hình hay không
  I.see("EMAIL OR PASSWORD IS INCORRECT");
});
