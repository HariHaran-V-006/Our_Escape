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

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
    res.json({ status: "Our Escape server is running 🎵" });
});

// ─── LIBRARY ──────────────────────────────────────────────────────────────────
app.get("/library", async (req, res) => {
    try {
        const result = await cloudinary.search
            .expression('resource_type:video AND asset_folder="Our_Escape/Fav" OR asset_folder="Our_Escape/Kuthu" OR asset_folder="Our_Escape/My Escape" OR asset_folder="Our_Escape/This Is The Weekend"')
            .sort_by("filename", "asc")
            .max_results(200)
            .execute();

        let library = {};

        result.resources.forEach((file) => {
            // Extract subfolder name: "Our_Escape/Fav" → "Fav"
            const parts = file.asset_folder.split("/");
            const category = parts.slice(1).join("/") || "Others";

            // Clean up title — remove file extension if present
            const title = file.filename
                .replace(/\.[^/.]+$/, "")       // strip extension
                .replace(/_/g, " ")              // underscores → spaces
                .trim();

            // Generate thumbnail from audio using Cloudinary transformation
            const artwork = file.secure_url
                .replace("/video/upload/", "/video/upload/so_5,w_400,h_400,c_fill,q_auto,f_jpg/")
                .replace(/\.[^/.]+$/, ".jpg");

            if (!library[category]) {
                library[category] = [];
            }

            library[category].push({
                id: file.public_id,
                title: title,
                artist: category,
                url: file.secure_url,
                artwork: artwork,
                duration: file.duration || 0,
            });
        });

        // Sort folders in preferred order
        const folderOrder = ["Fav", "Kuthu", "My Escape", "This Is The Weekend"];
        const sorted = {};
        folderOrder.forEach((folder) => {
            if (library[folder]) sorted[folder] = library[folder];
        });
        // Add any extra folders not in the order list
        Object.keys(library).forEach((key) => {
            if (!sorted[key]) sorted[key] = library[key];
        });

        res.json(sorted);
    } catch (err) {
        console.error("Library error:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// ─── START ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
