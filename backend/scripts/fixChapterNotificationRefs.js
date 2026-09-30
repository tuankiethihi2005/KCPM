/**
 * Script: fixChapterNotificationRefs.js
 * 
 * Cập nhật các thông báo cũ có target_type="Chapter" nhưng
 * target_id là chapter._id → đổi thành series._id
 * 
 * Chạy: node scripts/fixChapterNotificationRefs.js
 */
const connectDB = require("../src/config/config_mongoDB");
const Notification = require("../src/models/NotificationModel");
const Chapter = require("../src/models/ChapterModel");

async function migrate() {
  try {
    await connectDB();

    // Tìm tất cả notifications có target_type là "Chapter"
    const notifs = await Notification.find({ target_type: "Chapter" });
    console.log(`Tìm thấy ${notifs.length} notification(s) với target_type=Chapter`);

    let updated = 0;
    let skipped = 0;

    for (const notif of notifs) {
      // Kiểm tra xem target_id có phải là chapter_id không
      const chapter = await Chapter.findById(notif.target_id);
      if (chapter) {
        const seriesId = chapter.series_id;
        if (seriesId) {
          console.log(`  ✓ Chapter ${notif.target_id} → series ${seriesId}`);
          notif.target_id = seriesId;
          await notif.save();
          updated++;
        } else {
          console.log(`  ✗ Chapter ${notif.target_id} không có series_id`);
          skipped++;
        }
      } else {
        // target_id không phải chapter → có thể đã là series_id rồi
        console.log(`  - ${notif.target_id} không phải chapter ID, bỏ qua`);
        skipped++;
      }
    }

    console.log(`\nHoàn thành: ${updated} updated, ${skipped} skipped`);
    process.exit(0);
  } catch (err) {
    console.error("Lỗi:", err);
    process.exit(1);
  }
}

migrate();
