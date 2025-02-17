import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../css/navbar.css';

const Navbar = () => {
  const [listingUrl, setListingUrl] = useState("");
  const [scrapeResult, setScrapeResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => {
        setAlert(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  const fetchScrape = async () => {
    if (!listingUrl) {
      setAlert({
        type: 'error',
        message: 'Please enter a Grailed listing URL'
      });
      return;
    }
    
    try {
      setIsLoading(true);
      setAlert(null);
      const response = await axios.post("http://localhost:8080/scrape", {
        url: listingUrl,
      });
      setScrapeResult(response.data);
      console.log("Scrape result:", response.data);
      
      // Redirect to results page with the data
      navigate('/resultspage', { state: { scrapeResult: response.data } });
    } catch (error) {
      console.error("Error during scraping:", error);
      setAlert({
        type: 'error',
        message: 'Error during scraping. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isLoading) {
      fetchScrape();
    }
  };

  return (
    <nav className="navbar">
      <style jsx>{`
        .custom-alert {
          margin: 16px;
          padding: 16px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          animation: fadeIn 0.3s ease-out;
          position: relative;
        }
        
        .alert-error {
          background-color: #FEECEC;
          border-left: 4px solid #F44336;
          color: #D32F2F;
        }
        
        .alert-icon {
          margin-right: 12px;
          font-size: 20px;
        }
        
        .alert-content {
          flex: 1;
        }
        
        .alert-close {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 18px;
          color: inherit;
          opacity: 0.7;
        }
        
        .alert-close:hover {
          opacity: 1;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="navbar-container">
        <div className="navbar-logo">
          <a href="/"><h1>GRAILED AHEAD</h1></a>
        </div>
        
        <div className="navbar-search">
          <form className="search-wrapper" onSubmit={handleSubmit}>
            <input 
              type="text" 
              placeholder="Paste in your listing URL" 
              value={listingUrl}
              onChange={(e) => setListingUrl(e.target.value)}
            />
            <button 
              type="submit"
              className="search-button"
              disabled={isLoading}
            >
              {isLoading ? "LOADING..." : "SEARCH"}
            </button>
          </form>
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

      {alert && (
        <div className={`custom-alert alert-${alert.type}`}>
          <div className="alert-icon">
            {alert.type === 'error' ? '⚠️' : '✓'}
          </div>
          <div className="alert-content">
            {alert.message}
          </div>
          <button className="alert-close" onClick={() => setAlert(null)}>
            ×
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;