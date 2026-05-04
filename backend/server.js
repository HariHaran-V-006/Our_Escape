require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cloudinary = require("cloudinary").v2;

const app = express();
app.use(cors());

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// Build nested structure
app.get("/library", async (req, res) => {
  try {
    const result = await cloudinary.search
      .expression('resource_type:video AND asset_folder:"Our_Escape/*"')
      .max_results(100)
      .execute();

    let library = {};

    result.resources.forEach((file, index) => {
      const folderPath = file.asset_folder.split("/");

      // Our_Escape / This Is The Weekend
      const category = folderPath[1] || "Others";

      const title = file.filename;

      if (!library[category]) {
        library[category] = [];
      }

      library[category].push({
        id: index.toString(),
        title: title,
        artist: "Unknown",
        url: file.secure_url,
        artwork: "https://i.imgur.com/8Km9tLL.jpg"
      });
    });

    res.json(library);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => console.log("Server running"));