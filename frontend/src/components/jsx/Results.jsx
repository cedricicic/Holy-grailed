import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import RadarChart from './charts/radar.jsx';
import NetworkChart from './charts/network.jsx';
import PriceHistogram from './charts/price-histogram.jsx';
import ValueAnalysis from './charts/value-analysis.jsx';
import '../css/resultspage.css';

const ResultsPage = () => {
  const location = useLocation();
  const scrapeResult = location.state?.scrapeResult;
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [buttonText, setButtonText] = useState('COPY LISTING');
  const [downloadButtonText, setDownloadButtonText] = useState('DOWNLOAD LISTINGS');

  const calculatePercentile = (value, array) => {
    const sorted = [...array].sort((a, b) => a - b);
    return ((sorted.filter(v => v < value).length / sorted.length) * 100).toFixed(1);
  };

  const originalListing = scrapeResult?.originalListingDetails;
  const relatedListings = scrapeResult?.relatedListings;

  let pricePercentile, likesPercentile, photosPercentile;

  if (originalListing && relatedListings) {
    const targetPrice = parseFloat(originalListing.price.replace('$', ''));
    const marketPrices = relatedListings.map(item => parseFloat(item.price.replace('$', '')));
    
    const targetLikes = parseInt(originalListing.likesCount || 0, 10);
    const marketLikes = relatedListings.map(item => parseInt(item.likesCount || 0, 10));

    const targetPhotos = originalListing.imageCount;
    const marketPhotos = relatedListings.map(item => item.imageCount);

    pricePercentile = calculatePercentile(targetPrice, marketPrices);
    likesPercentile = calculatePercentile(targetLikes, marketLikes);
    photosPercentile = calculatePercentile(targetPhotos, marketPhotos);
  }

  const networkData = relatedListings?.map(item => ({
    labels: item.labels,
  }));

  const chartComponents = [
    <RadarChart
      pricePercentile={pricePercentile}
      likesPercentile={likesPercentile}
      photosPercentile={photosPercentile}
    />,
    <NetworkChart data={networkData} />,
    <PriceHistogram
      originalListing={originalListing}
      relatedListings={relatedListings}
    />
  ];

  const navigateCard = (direction) => {
    if (direction === 'next') {
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
    navigator.clipboard.writeText(originalListing.link)
      .then(() => {
        setButtonText('Copied!');
        setTimeout(() => setButtonText('COPY LISTING'), 2000);
      })
      .catch(err => console.error('Failed to copy: ', err));
  };

  // Convert JSON to CSV
  const convertToCSV = (objectArray) => {
    if (!objectArray || objectArray.length === 0) return '';
    
    // Get headers from first object
    const headers = Object.keys(objectArray[0]);
    
    // Create CSV rows with headers
    const csvRows = [
      headers.join(','), // Header row
      ...objectArray.map(row => 
        headers.map(fieldName => {
          // Handle fields that might contain commas by wrapping in quotes
          const value = row[fieldName] ? String(row[fieldName]) : '';
          return `"${value.replace(/"/g, '""')}"`;
        }).join(',')
      )
    ];
    
    return csvRows.join('\n');
  };

  // Handle download of listings as CSV
  const handleDownload = () => {
    if (!relatedListings || relatedListings.length === 0) {
      console.error('No listings to download');
      return;
    }

    // Prepare data - combine original listing with related listings
    const allListings = [originalListing, ...relatedListings];
    
    const csvContent = convertToCSV(allListings);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'listings.csv');
    
    // Temporarily show feedback to user
    setDownloadButtonText('Downloading...');
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Reset button text after download
    setTimeout(() => setDownloadButtonText('DOWNLOAD LISTINGS'), 2000);
  };

  if (!scrapeResult) {
    return <div className="no-results">No results found.</div>;
  }

  if (!originalListing || !relatedListings) {
    return <div className="insufficient-data">Insufficient data to render the analysis.</div>;
  }

  return (
    <div className="results-page">
      <div className="results-container">
        <div className="listing-info-panel">
          <div className="listing-card">
            <div className="listing-details">
              <p className="price">{originalListing.labels}</p>
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
              <p><strong>Cedric Leung</strong></p>
              <p>Submit your feedback · <a href="#/feedback">Here</a></p>
              <p>Also, I'm curretly looking for summer 2025 internships :)</p>
              <button
  className="follow-btn"
  onClick={() => window.open('https://www.linkedin.com/in/cedric-leung-38637029a/', '_blank')}
>
  FOLLOW
</button>
            </div>
          </div>
        </div>

        <div className="charts-container">
          <div className="chart-card-carousel">
            <button
              className="carousel-arrow left-arrow"
              onClick={() => navigateCard("prev")}
            >
              &#8249;
            </button>

            <div className="chart-card">
              {chartComponents[activeCardIndex]}
              <div className="carousel-indicators">
                {chartComponents.map((_, index) => (
                  <span
                    key={index}
                    className={`indicator ${
                      index === activeCardIndex ? "active" : ""
                    }`}
                    onClick={() => setActiveCardIndex(index)}
                  />
                ))}
              </div>
            </div>

            <button
              className="carousel-arrow right-arrow"
              onClick={() => navigateCard("next")}
            >
              &#8250;
            </button>
          </div>

          <div className="value-analysis-container">
            <h2>Value Analysis</h2>
            <ValueAnalysis
              originalListing={originalListing}
              relatedListings={relatedListings}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;