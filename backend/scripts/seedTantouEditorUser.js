const dotenv = require("dotenv");
const mongoose = require("mongoose");
const path = require("path");
dotenv.config({ path: path.join(__dirname, "../.env") });

const connectDB = require("../src/config/config_mongoDB");
const User = require("../src/models/UserModel");
const Series = require("../src/models/SeriesModel");
const { hashPassword } = require("../src/modules/auth/utils/password");

const seedTantouEditorUser = async () => {
  await connectDB();

  const email = process.env.SEED_TANTOU_EDITOR_EMAIL || "editor@example.com";
  const password = process.env.SEED_TANTOU_EDITOR_PASSWORD || "password123";
  const name = process.env.SEED_TANTOU_EDITOR_NAME || "Nguyễn Biên Tập";

  const passwordHash = await hashPassword(password);

  const editor = await User.findOneAndUpdate(
    { email: email.toLowerCase() },
    {
      name,
      email: email.toLowerCase(),
      password: passwordHash,
      role: "Tantou Editor",
      status: "Active",
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  console.log(`Seeded Tantou Editor user: ${editor.email} (${editor._id})`);

  // Gán editor_id cho các series chưa có editor
  // Ưu tiên gán cho series của Mangaka (để có dữ liệu demo đầy đủ)
  const mangaka = await User.findOne({ role: "Mangaka" });

  if (mangaka) {
    // Tìm series của Mangaka và gán editor
    const result = await Series.updateMany(
      { author_id: mangaka._id, editor_id: { $exists: false } },
      { editor_id: editor._id }
    );
    console.log(`Assigned editor to ${result.modifiedCount} series of Mangaka`);

    // Nếu không có series nào được gán, thử tạo mới
    if (result.modifiedCount === 0) {
      const existingSeries = await Series.findOne({ author_id: mangaka._id });
      if (existingSeries) {
        existingSeries.editor_id = editor._id;
        await existingSeries.save();
        console.log(`Assigned editor to series: ${existingSeries.title}`);
      } else {
        // Tạo series mới cho Mangaka có editor
        const newSeries = await Series.create({
          title: "Mangaka & Editor Collaboration",
          description: "Series hợp tác giữa Mangaka và Tantou Editor để test luồng biên tập.",
          genre: "Fantasy",
          target_audience: "Teen",
          author_id: mangaka._id,
          editor_id: editor._id,
          status: "Active",
        });
        console.log(`Created new series with editor: ${newSeries.title} (${newSeries._id})`);
      }
    }
  } else {
    console.log("No Mangaka user found, skipping series assignment.");
  }

  // Nếu có series ranking (seedSeries.js) mà chưa có editor, gán luôn
  const rankingSeries = await Series.find({ editor_id: { $exists: false } });
  if (rankingSeries.length > 0) {
    const updateResult = await Series.updateMany(
      { editor_id: { $exists: false } },
      { editor_id: editor._id }
    );
    console.log(`Assigned editor to ${updateResult.modifiedCount} additional series`);
  }

  await mongoose.disconnect();
  console.log("Done!");
};

seedTantouEditorUser().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
