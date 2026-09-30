const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const connectDB = require("../src/config/config_mongoDB");
const User = require("../src/models/UserModel");
const Notification = require("../src/models/NotificationModel");

const seedNotifications = async () => {
  try {
    console.log("Connecting to database...");
    await connectDB();

    console.log("Cleaning old notification seed data...");
    await Notification.deleteMany({});

    const users = await User.find();
    if (users.length === 0) {
      console.log("No users found in database. Please seed users first.");
      process.exit(0);
    }

    let totalCreated = 0;

    for (const user of users) {
      const notifications = [];
      const role = user.role;

      // Admin notifications
      if (role === "Admin") {
        notifications.push(
          { type: "System", title: "Chào mừng bạn đến với Hệ thống", message: "Hệ thống quản lý Manga đã sẵn sàng để sử dụng." },
          { type: "System", title: "Cập nhật tính năng mới", message: "Tính năng thông báo đã được triển khai trên toàn hệ thống." },
          { type: "Warning", title: "Series 'One Piece' có nguy cơ", message: "Series One Piece đang có ranking thấp trong tháng này. Cần xem xét." },
          { type: "Warning", title: "Bảo trì hệ thống sắp diễn ra", message: "Hệ thống sẽ bảo trì vào lúc 20h ngày 10/07/2026." },
          { type: "Task_Update", title: "Task #123 đang chờ phê duyệt", message: "Task tô bóng chapter 5 đang chờ admin phê duyệt." },
        );
      }

      // Mangaka notifications
      if (role === "Mangaka") {
        notifications.push(
          { type: "System", title: "Series 'Kiếm Sĩ Huyền Thoại' đã được duyệt", message: "Series của bạn đã được Editorial Board phê duyệt." },
          { type: "System", title: "Series mới được tạo thành công", message: "Series 'Cuộc Chiến Vũ Trụ' đã được tạo." },
          { type: "Task_Update", title: "Task vẽ background hoàn thành", message: "Trợ lý đã hoàn thành task vẽ background cho Chapter 3." },
          { type: "Task_Update", title: "Task cần chỉnh sửa", message: "Task tô bóng của Trợ lý cần revision. Vui lòng kiểm tra." },
          { type: "Warning", title: "Chapter 5 sắp đến hạn", message: "Chapter 5 cần hoàn thành trước 20/07/2026." },
          { type: "Task_Update", title: "Chapter 2 đã được publish", message: "Chapter 2 của series 'Kiếm Sĩ Huyền Thoại' đã được xuất bản." },
        );
      }

      // Assistant notifications
      if (role === "Assistant") {
        notifications.push(
          { type: "Task_Update", title: "Task mới được giao", message: "Mangaka vừa giao task vẽ background cho Chapter 4." },
          { type: "Task_Update", title: "Task đã được duyệt", message: "Task tô bóng page #45 đã được Mangaka chấp thuận." },
          { type: "Task_Update", title: "Task cần chỉnh sửa", message: "Task đi nét page #12 bị từ chối. Cần sửa lại theo góp ý." },
          { type: "Warning", title: "Deadline sắp đến hạn", message: "Task vẽ background cần hoàn thành trước 18/07/2026." },
        );
      }

      // Tantou Editor notifications
      if (role === "Tantou Editor") {
        notifications.push(
          { type: "System", title: "Series mới được phân công", message: "Bạn được phân công phụ trách series 'Kiếm Sĩ Huyền Thoại'." },
          { type: "Task_Update", title: "Chapter 3 sẵn sàng review", message: "Chapter 3 của series 'Kiếm Sĩ Huyền Thoại' đã hoàn thành và chờ bạn review." },
          { type: "Task_Update", title: "Chapter 1 đã được publish", message: "Chapter 1 của series 'Cuộc Chiến Vũ Trụ' đã được xuất bản." },
          { type: "Warning", title: "Series cần chú ý", message: "Series 'Kiếm Sĩ Huyền Thoại' đang có dấu hiệu chậm tiến độ." },
          { type: "Warning", title: "Deadline sắp đến", message: "Chapter 4 cần review trước 22/07/2026." },
        );
      }

      // Editorial Board notifications
      if (role === "Editorial Board") {
        notifications.push(
          { type: "System", title: "Series mới chờ duyệt", message: "Series 'Cuộc Chiến Vũ Trụ' cần được phê duyệt." },
          { type: "Task_Update", title: "Chapter chờ phát hành", message: "Chapter 2 của series 'One Piece' đã sẵn sàng để lên lịch phát hành." },
          { type: "Task_Update", title: "Lịch phát hành cập nhật", message: "Lịch phát hành tháng 8 đã có thay đổi. Vui lòng kiểm tra." },
          { type: "Warning", title: "Series có nguy cơ", message: "Series 'Naruto' đang có ranking thấp, cần đánh giá lại." },
        );
      }

      // Create notifications with random times (spread over last 7 days)
      for (const notif of notifications) {
        const randomHoursAgo = Math.floor(Math.random() * 7 * 24);
        const createdAt = new Date(Date.now() - randomHoursAgo * 60 * 60 * 1000);

        await Notification.create({
          user_id: user._id,
          type: notif.type,
          title: notif.title,
          message: notif.message,
          is_read: false,
          createdAt,
        });
        totalCreated++;
      }

      console.log(`  - ${notifications.length} notifications for ${user.name} (${role})`);
    }

    console.log(`\n✅ Created ${totalCreated} total notifications successfully!`);
    await mongoose.disconnect();
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seedNotifications();
