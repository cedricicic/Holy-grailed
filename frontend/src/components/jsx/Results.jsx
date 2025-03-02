import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import RadarChart from "./charts/radar.jsx";
import NetworkChart from "./charts/network.jsx";
import PriceHistogram from "./charts/price-histogram.jsx";
import ValueAnalysis from "./charts/value-analysis.jsx";
import BubbleChart from "./charts/bubble.jsx";
import PriceTugOfWar from './charts/PriceTugOfWar.jsx'
import Heatmap from './charts/heatmap.jsx'
import "../css/resultspage.css";

const ResultsPage = () => {
  const location = useLocation();
  const scrapeResult = location.state?.scrapeResult;
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [buttonText, setButtonText] = useState("COPY LISTING");
  const [downloadButtonText, setDownloadButtonText] =
    useState("DOWNLOAD LISTINGS");

  const calculatePercentile = (value, array) => {
    const sorted = [...array].sort((a, b) => a - b);
    return (
      (sorted.filter((v) => v < value).length / sorted.length) *
      100
    ).toFixed(1);
  };

  const originalListing = scrapeResult?.originalListingDetails;
  const relatedListings = scrapeResult?.relatedListings;

  let pricePercentile, likesPercentile, photosPercentile;

  if (originalListing && relatedListings) {
    const targetPrice = parseFloat(originalListing.price.replace("$", ""));
    const marketPrices = relatedListings.map((item) =>
      parseFloat(item.price.replace("$", ""))
    );

    const targetLikes = parseInt(originalListing.likesCount || 0, 10);
    const marketLikes = relatedListings.map((item) =>
      parseInt(item.likesCount || 0, 10)
    );

    const targetPhotos = originalListing.imageCount;
    const marketPhotos = relatedListings.map((item) => item.imageCount);

    pricePercentile = calculatePercentile(targetPrice, marketPrices);
    likesPercentile = calculatePercentile(targetLikes, marketLikes);
    photosPercentile = calculatePercentile(targetPhotos, marketPhotos);
  }

  const networkData = relatedListings?.map((item) => ({
    labels: item.labels,
  }));

  // Card wrapper component with Framer Motion
  const ChartCard = ({ children, title }) => (
    <motion.div 
      className="chart-card-wrapper"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      whileHover={{ 
        scale: 1.02,
        boxShadow: "0 10px 20px rgba(0,0,0,0.15)" 
      }}
    >
      <motion.div 
        className="chart-card-header"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h3>{title}</h3>
      </motion.div>
      <motion.div className="chart-card-content">
        {children}
      </motion.div>
    </motion.div>
  );

  const chartComponents = [
    <ChartCard title="Radar Analysis">
      <RadarChart
        pricePercentile={pricePercentile}
        likesPercentile={likesPercentile}
        photosPercentile={photosPercentile}
      />
    </ChartCard>,
    <ChartCard title="Network Analysis">
      <NetworkChart data={networkData} />
    </ChartCard>,
    <ChartCard title="Price Distribution">
      <PriceHistogram
        originalListing={originalListing}
        relatedListings={relatedListings}
      />
    </ChartCard>,
    <ChartCard title="Market Position">
      <BubbleChart
        originalListing={originalListing}
        relatedListings={relatedListings}
      />
    </ChartCard>,
    <ChartCard title="Price Comparison">
      <PriceTugOfWar 
        originalListing={originalListing} 
        relatedListings={relatedListings} 
      />
    </ChartCard>,
    <ChartCard title="Market Heatmap">
      <Heatmap 
        originalListing={originalListing} 
        relatedListings={relatedListings} 
      />
    </ChartCard>,
  ];

  const navigateCard = (direction) => {
    if (direction === "next") {
      setActiveCardIndex((prevIndex) =>
        prevIndex === chartComponents.length - 1 ? 0 : prevIndex + 1
      );
    } else {
      setActiveCardIndex((prevIndex) =>
        prevIndex === 0 ? chartComponents.length - 1 : prevIndex - 1
      );
    }
  };

  const handleCopy = () => {
    navigator.clipboard
      .writeText(originalListing.link)
      .then(() => {
        setButtonText("Copied!");
        setTimeout(() => setButtonText("COPY LISTING"), 2000);
      })
      .catch((err) => console.error("Failed to copy: ", err));
  };

  const convertToCSV = (objectArray) => {
    if (!objectArray || objectArray.length === 0) return "";

    const headers = Object.keys(objectArray[0]);

    const csvRows = [
      headers.join(","),
      ...objectArray.map((row) =>
        headers
          .map((fieldName) => {
            const value = row[fieldName] ? String(row[fieldName]) : "";
            return `"${value.replace(/"/g, '""')}"`;
          })
          .join(",")
      ),
    ];

    return csvRows.join("\n");
  };

  const handleDownload = () => {
    if (!relatedListings || relatedListings.length === 0) {
      console.error("No listings to download");
      return;
    }

    const allListings = [originalListing, ...relatedListings];

    const csvContent = convertToCSV(allListings);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", "listings.csv");

    setDownloadButtonText("Downloading...");

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => setDownloadButtonText("DOWNLOAD LISTINGS"), 2000);
  };

  if (!scrapeResult) {
    return <div className="no-results">No results found.</div>;
  }

  if (!originalListing || !relatedListings) {
    return (
      <div className="insufficient-data">
        Insufficient data to render the analysis.
      </div>
    );
  }

  return (
    <div className="results-page">
      <div className="results-container">
        <div className="listing-info-panel">
          <div className="listing-card">
            <div className="listing-details">
            <p className="price">{originalListing.labels.join(' x ')}</p>
              <p>{originalListing.description || "N/A"}</p>
              <p>
                <span>Colour:</span> {originalListing.colour || "N/A"}
              </p>
              <p>
                <span>Condition:</span> {originalListing.cond || "N/A"}
              </p>
              <p>
                <span>Last update:</span>{" "}
                {originalListing.originalPostingDate || "N/A"}
              </p>
              <br></br>
              <p className="price">{originalListing.price}</p>
            </div>
            <div className="actions">
              <button
                className="primary-btn"
                onClick={() => (window.location.href = originalListing.link)}
              >
                VIEW LISTING
              </button>
              <button className="secondary-btn" onClick={handleCopy}>
                {buttonText}
              </button>
              <button className="secondary-btn" onClick={handleDownload}>
                {downloadButtonText}
              </button>
            </div>
            <br></br>

            <div className="seller-section">
              <p>
                <strong>Made by Cedric Leung </strong>
              </p>
              <p>
                Submit your feedback · <a href="#/feedback">Here</a>
              </p>

              <button
                className="follow-btn"
                onClick={() =>
                  window.open(
                    "https://www.linkedin.com/in/cedric-leung-38637029a/",
                    "_blank"
                  )
                }
              >
                FOLLOW
              </button>
            </div>
          </div>
          <p className="note">
            {" "}
            Note that we are comparing your listing with the top 30 TRENDING
            related listings.
          </p>
          <p className="note2">
            Please click on "DOWNLOAD LISTINGS" to see them in details.
          </p>
        </div>

        <div className="charts-container">
          <div className="chart-card-carousel">
            <motion.button
              className="carousel-arrow left-arrow"
              onClick={() => navigateCard("prev")}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
            >
              &#8249;
            </motion.button>

            <div className="chart-card">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeCardIndex}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.3 }}
                >
                  {chartComponents[activeCardIndex]}
                </motion.div>
              </AnimatePresence>
              
              <div className="carousel-indicators">
                {chartComponents.map((_, index) => (
                  <motion.span
                    key={index}
                    className={`indicator ${
                      index === activeCardIndex ? "active" : ""
                    }`}
                    onClick={() => setActiveCardIndex(index)}
                    whileHover={{ scale: 1.5 }}
                    whileTap={{ scale: 0.9 }}
                    animate={index === activeCardIndex ? 
                      { scale: 1.2, backgroundColor: 'black' } : 
                      { scale: 1, backgroundColor: '#ccc' }
                    }
                    transition={{ duration: 0.2 }}
                  />
                ))}
              </div>
            </div>

            <motion.button
              className="carousel-arrow right-arrow"
              onClick={() => navigateCard("next")}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
            >
              &#8250;
            </motion.button>
          </div>

          <motion.div 
            className="value-analysis-container"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.6, 
              delay: 0.3,
              ease: "easeOut"
            }}
            whileHover={{ boxShadow: "0 8px 16px rgba(0,0,0,0.1)" }}
          >
            <motion.h2
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
            >
              Value Analysis
            </motion.h2>
            <ValueAnalysis
              originalListing={originalListing}
              relatedListings={relatedListings}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;
