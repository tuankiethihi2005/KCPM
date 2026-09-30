const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const connectDB = require("../src/config/config_mongoDB");
const User = require("../src/models/UserModel");
const Series = require("../src/models/SeriesModel");

async function assignSeries() {
  try {
    await connectDB();

    // Find the Mangaka and Editor users
    const mangaka = await User.findOne({ role: "Mangaka" });
    const editor = await User.findOne({ role: "Tantou Editor" });

    if (!mangaka || !editor) {
      console.error("Could not find Mangaka or Tantou Editor user in database!");
      process.exit(1);
    }

    console.log(`Found Mangaka: ${mangaka.name} (${mangaka._id})`);
    console.log(`Found Editor: ${editor.name} (${editor._id})`);

    // Assign "One Piece", "Naruto", and "Bleach" to this Mangaka and Editor
    const titlesToAssign = ["One Piece", "Naruto", "Bleach"];
    
    for (const title of titlesToAssign) {
      const result = await Series.findOneAndUpdate(
        { title },
        { 
          author_id: mangaka._id,
          editor_id: editor._id
        },
        { new: true }
      );
      if (result) {
        console.log(`Updated series "${title}": Author -> Mangaka, Editor -> Tantou Editor`);
      } else {
        console.log(`Series "${title}" not found!`);
      }
    }

    console.log("Assignment complete!");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

assignSeries();
