if (process.env.NODE_ENV !== "production") {
  const dns = require("dns");
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
}

const dotenv = require("dotenv");
const mongoose = require("mongoose");
const connectDB = require("../src/config/config_mongoDB");
const User = require("../src/models/UserModel");
const Series = require("../src/models/SeriesModel");
const Chapter = require("../src/models/ChapterModel");
const Page = require("../src/models/PageModel");
const { hashPassword } = require("../src/modules/auth/utils/password");

dotenv.config();

const seedAuthUser = async () => {
  await connectDB();

  const email = process.env.SEED_AUTH_EMAIL || "admin@example.com";
  const password = process.env.SEED_AUTH_PASSWORD || "password123";
  const name = process.env.SEED_AUTH_NAME || "System Admin";
  const role = process.env.SEED_AUTH_ROLE || "Admin";

  const passwordHash = await hashPassword(password);

  await User.findOneAndUpdate(
    { email: email.toLowerCase() },
    {
      name,
      email: email.toLowerCase(),
      password: passwordHash,
      role,
      status: "Active",
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  const user = await User.findOne({ email: email.toLowerCase() });

  const seededSeries = await Series.findOneAndUpdate(
    { title: "Seed Demo Series", author_id: user._id },
    {
      title: "Seed Demo Series",
      description: "Series duoc seed de kiem thu luong auth va authz.",
      genre: "Action",
      target_audience: "Teen",
      author_id: user._id,
      status: "Active",
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  const seededChapter = await Chapter.findOneAndUpdate(
    { series_id: seededSeries._id, chapter_number: 1 },
    {
      series_id: seededSeries._id,
      chapter_number: 1,
      title: "Chapter 1: Seeded Workflow",
      deadline: new Date("2026-12-31"),
      status: "Approved",
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  const seededPages = [
    {
      chapter_id: seededChapter._id,
      page_number: 1,
      file_url: "https://placehold.co/400x600?text=Page+1",
      status: "Approved",
    },
    {
      chapter_id: seededChapter._id,
      page_number: 2,
      file_url: "https://placehold.co/400x600?text=Page+2",
      status: "Approved",
    },
  ];

  for (const page of seededPages) {
    await Page.findOneAndUpdate(
      { chapter_id: page.chapter_id, page_number: page.page_number },
      page,
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  console.log(`Seeded auth user: ${email} (${role})`);
  console.log(`Seeded demo series: ${seededSeries._id}`);
  console.log(`Seeded demo chapter: ${seededChapter._id}`);
  await mongoose.disconnect();
};

seedAuthUser().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
