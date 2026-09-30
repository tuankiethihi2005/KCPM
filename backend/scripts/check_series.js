const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const connectDB = require("../src/config/config_mongoDB");
const Series = require("../src/models/SeriesModel");

async function checkSeries() {
  try {
    await connectDB();
    const series = await Series.find();
    console.log(`Found ${series.length} series in database:`);
    series.forEach((s) => {
      console.log(`- ID: ${s._id}, Title: "${s.title}", Status: "${s.status}"`);
    });
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

checkSeries();
