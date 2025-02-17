import React, { useState } from 'react';
import axios from 'axios';
import '../css/navbar.css';

const Navbar = () => {
  const [listingUrl, setListingUrl] = useState("");
  const [scrapeResult, setScrapeResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchScrape = async () => {
    if (!listingUrl) {
      alert("Please enter a Grailed listing URL");
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await axios.post("http://localhost:8080/scrape", {
        url: listingUrl,
      });
      setScrapeResult(response.data);
      console.log("Scrape result:", response.data);
    } catch (error) {
      console.error("Error during scraping:", error);
      alert("Error during scraping. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <a href="/"><h1>GRAILED AHEAD</h1></a>
        </div>
        
        <div className="navbar-search">
          <div className="search-wrapper">
            <input 
              type="text" 
              placeholder="Paste in your listing URL" 
              value={listingUrl}
              onChange={(e) => setListingUrl(e.target.value)}
            />
            <button 
              className="search-button"
              onClick={fetchScrape}
              disabled={isLoading}
            >
              {isLoading ? "LOADING..." : "SEARCH"}
            </button>
          </div>
        </div>
        
        <div className="navbar-actions">
          <a href="https://www.grailed.com/" className="action-button">FIND MORE</a>
          <a href="/read">READ</a>
          <a href="https://cedricleung.ca/" className="signup-button">AUTHOR</a>
        </div>
      </div>
      
      <div className="navbar-categories">
        <ul>
          <li><a href="https://cedricleung.ca/#/contact">FEEDBACK</a></li>
          <li className="dropdown">
            <a href="https://cedricleung.ca/">ALL PROJECTS</a>
          </li>
          <li className="dropdown">
            <a href="/">MY PICKS</a>
          </li>
        </ul>
      </div>

      {scrapeResult && (
        <div className="scrape-results">
          <h3>Scrape Result:</h3>
          <pre>{JSON.stringify(scrapeResult, null, 2)}</pre>
        </div>
      )}
    </nav>
  );
};

export default Navbar;