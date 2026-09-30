const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const connectDB = require("../src/config/config_mongoDB");
const User = require("../src/models/UserModel");
const Series = require("../src/models/SeriesModel");

async function checkUsersAndSeries() {
  try {
    await connectDB();
    
    const users = await User.find();
    console.log(`=== USERS IN SYSTEM (${users.length}) ===`);
    users.forEach((u) => {
      console.log(`- ID: ${u._id}, Name: "${u.name}", Email: "${u.email}", Role: "${u.role}"`);
    });

    const series = await Series.find();
    console.log(`\n=== SERIES IN SYSTEM (${series.length}) ===`);
    series.forEach((s) => {
      console.log(`- ID: ${s._id}, Title: "${s.title}", AuthorID: ${s.author_id}, EditorID: ${s.editor_id || 'None'}`);
    });

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

checkUsersAndSeries();
