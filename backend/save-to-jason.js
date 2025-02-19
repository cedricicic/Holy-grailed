const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();
const cors = require("cors");

const corsOptions = {
  origin: ["http://localhost:5173"],
};

app.use(cors(corsOptions));
app.use(express.json());

const scrapeGrailedListing = require("./scraper");

app.post("/scrape", async (req, res) => {
  const { url } = req.body;
  if (!url || !url.includes("grailed.com/listings/")) {
    return res.status(400).json({ error: "Please provide a valid Grailed listing URL" });
  }
  try {
    const data = await scrapeGrailedListing(url);

    // Save data to results.json
    const filePath = path.join(__dirname, "results.json");
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(8080, () => {
  console.log("Server started on port 8080");
});
