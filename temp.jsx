import React from 'react';
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

  return (
    <div className="results-page">
      {scrapeResult ? (
        <>
          {originalListing && relatedListings ? (
            <>
              {/* -- Header / Main Listing Info -- */}
              <div className="listing-card">
                <div className="listing-images">
                  {originalListing.images && originalListing.images.length > 0 ? (
                    originalListing.images.map((img, index) => (
                      <img key={index} src={img} alt={`Listing ${index}`} />
                    ))
                  ) : (
                    <div className="no-image">No Image</div>
                  )}
                </div>
                <div className="listing-info">
                  <h2>{originalListing.title}</h2>
                  <p>{originalListing.price}</p>
                  <p>Condition: {originalListing.condition || 'N/A'}</p>
                  <p>Size: {originalListing.size || 'N/A'}</p>
                  <p>Color: {originalListing.color || 'N/A'}</p>
                  <div className="actions">
                    <button>Purchase</button>
                    <button>Offer</button>
                    <button>Message</button>
                  </div>
                </div>
              </div>

              {/* -- Charts Section -- */}
              <div className="charts-section">
                <div className="chart-container">
                <RadarChart
                  pricePercentile={pricePercentile}
                  likesPercentile={likesPercentile}
                  photosPercentile={photosPercentile}
                />
                </div>
                <div className="chart-container">
                  <NetworkChart data={networkData} />
                </div>
                <div className="chart-container">
                <PriceHistogram
                  originalListing={originalListing}
                  relatedListings={relatedListings}
                />
                </div>
                <div className="chart-container">
                                <BubbleChartD3
                                  originalListing={originalListing}
                                  relatedListings={relatedListings}
                                />
                </div>
              </div>

              {/* -- Value Analysis -- */}
              <div className="value-analysis">
                <ValueAnalysis
                  pricePercentile={pricePercentile}
                  likesPercentile={likesPercentile}
                  photosPercentile={photosPercentile}
                />
              </div>

              {/* -- Raw Data Section -- */}
              <div className="raw-data">
                <h3>Raw Data:</h3>
                <pre>{JSON.stringify(scrapeResult, null, 2)}</pre>
              </div>
            </>
          ) : (
            <div className="insufficient-data">Insufficient data to render the analysis.</div>
          )}
        </>
      ) : (
        <div className="no-results">No results found.</div>
      )}
    </div>
  );
};

export default ResultsPage;