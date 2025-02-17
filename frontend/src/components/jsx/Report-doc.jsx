import { useState, useEffect } from "react";
import axios from "axios";

function Report() {
  const [scrapeResult, setScrapeResult] = useState(null);
  const [listingUrl, setListingUrl] = useState("");

  const fetchScrape = async () => {
    if (!listingUrl) {
      alert("Please enter a Grailed listing URL");
      return;
    }
    try {
      const response = await axios.post("http://localhost:8080/scrape", {
        url: listingUrl,
      });
      setScrapeResult(response.data);
      console.log("Scrape result:", response.data);
    } catch (error) {
      console.error("Error during scraping:", error);
    }
  };

  return (
    <div style={{ padding: "1rem" }}>
      <h2>Grailed Listing Scraper</h2>
      <input
        type="text"
        placeholder="Enter Grailed listing URL"
        value={listingUrl}
        onChange={(e) => setListingUrl(e.target.value)}
        style={{ width: "300px" }}
      />
      <button onClick={fetchScrape} style={{ marginLeft: "1rem" }}>
        Scrape Listing
      </button>

      {scrapeResult && (
        <div style={{ marginTop: "1rem" }}>
          <h3>Scrape Result:</h3>
          <pre>{JSON.stringify(scrapeResult, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default Report;