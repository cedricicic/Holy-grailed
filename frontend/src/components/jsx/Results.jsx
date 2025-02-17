import React from 'react';
import { useLocation } from 'react-router-dom';
import RadarChart from './charts/radar.jsx'; 
import NetworkChart from './charts/network.jsx'
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
      <div>
        <h1>Results Page</h1>
        {scrapeResult ? (
          <div className="scrape-results">
            <h3>Scrape Result:</h3>
            <pre>{JSON.stringify(scrapeResult, null, 2)}</pre>
            {originalListing && relatedListings ? (
              <>
                <RadarChart
                  pricePercentile={pricePercentile}
                  likesPercentile={likesPercentile}
                  photosPercentile={photosPercentile}
                />
                <NetworkChart data={networkData} />
              </>
            ) : (
              <p>Insufficient data to render the charts.</p>
            )}
          </div>
        ) : (
          <p>No results found.</p>
        )}
      </div>
    );
  };
  
  export default ResultsPage;