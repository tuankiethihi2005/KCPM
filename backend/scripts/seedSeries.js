const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const connectDB = require("../src/config/config_mongoDB");
const Series = require("../src/models/SeriesModel");
const User = require("../src/models/UserModel");

const SHORT_ID_MAP = {
  "S1": "One Piece",
  "S2": "Naruto",
  "S3": "Bleach",
  "S4": "Conan",
  "S5": "Dragon Ball",
  "S6": "Death Note"
};

async function seedSeries() {
  try {
    await connectDB();
    
    // Find or create a default user to act as author
    let author = await User.findOne({ role: "Admin" });
    if (!author) {
      author = await User.findOne();
    }
    if (!author) {
      console.log("No user found. Creating a temporary system admin user...");
      author = await User.create({
        name: "System Admin",
        email: "admin@example.com",
        password: "password_hash_placeholder",
        role: "Admin",
        status: "Active"
      });
    }

    for (const [shortId, title] of Object.entries(SHORT_ID_MAP)) {
      const existing = await Series.findOne({ title });
      if (!existing) {
        await Series.create({
          title,
          description: `Truyện được tạo tự động cho hệ thống xếp hạng: ${title}`,
          genre: shortId === "S1" || shortId === "S2" || shortId === "S5" ? "Shonen" : (shortId === "S3" ? "Action" : (shortId === "S6" ? "Thriller" : "Mystery")),
          target_audience: "Teen",
          author_id: author._id,
          status: "Active"
        });
        console.log(`Created series: ${title}`);
      } else {
        console.log(`Series already exists: ${title} (${existing._id})`);
      }
    }
    
    console.log("Seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding series:", error);
    process.exit(1);
  }
}

seedSeries();
