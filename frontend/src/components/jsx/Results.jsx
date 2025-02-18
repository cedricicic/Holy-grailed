import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import RadarChart from './charts/radar.jsx';
import NetworkChart from './charts/network.jsx';
import PriceHistogram from './charts/price-histogram.jsx';
import ValueAnalysis from './charts/value-analysis.jsx';
import BubbleChartD3 from './charts/bubble-d3.jsx';
import '../css/resultspage.css';

const ResultsPage = () => {
  const location = useLocation();
  const scrapeResult = location.state?.scrapeResult;
  const [activeCardIndex, setActiveCardIndex] = useState(0);

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
    />,
    <BubbleChartD3
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

  if (!scrapeResult) {
    return <div className="no-results">No results found.</div>;
  }

  if (!originalListing || !relatedListings) {
    return <div className="insufficient-data">Insufficient data to render the analysis.</div>;
  }

  const [buttonText, setButtonText] = useState('COPY LISTING');

  const handleCopy = () => {
    navigator.clipboard.writeText(originalListing.link)
      .then(() => {
        setButtonText('Copied!');
        setTimeout(() => setButtonText('COPY LISTING'), 2000);
      })
      .catch(err => console.error('Failed to copy: ', err));
  };

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
            <div class="actions">
              <button class="primary-btn">VIEW LISTING</button>
              <button className="secondary-btn" onClick={handleCopy}>
      {buttonText}
    </button>
              <button class="secondary-btn">DOWNLOAD LISTINGS</button>
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