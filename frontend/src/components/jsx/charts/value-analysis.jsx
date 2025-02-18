import React, { useMemo } from 'react';
import '../../css/value-analysis.css';

const ValueAnalysis = ({ originalListing, relatedListings }) => {
  const calculations = useMemo(() => {
    if (!originalListing || !relatedListings || relatedListings.length === 0) {
      return null;
    }

    // Parse original listing data
    const originalPrice = parseFloat(originalListing.price.replace(/[$,]/g, ''));
    const originalLikes = parseInt(originalListing.likesCount || 0, 10);
    const originalPricePerLike = originalLikes > 0 ? originalPrice / originalLikes : 0;

    // Calculate average price per like across all related listings
    const pricesPerLike = relatedListings
      .map(listing => {
        const price = parseFloat(listing.price.replace(/[$,]/g, ''));
        const likes = parseInt(listing.likesCount || 0, 10);
        return likes > 0 ? price / likes : 0;
      })
      .filter(ratio => ratio > 0);

    const avgPricePerLike = pricesPerLike.length > 0 
      ? pricesPerLike.reduce((sum, val) => sum + val, 0) / pricesPerLike.length
      : 0;

    // Determine if current ratio is in line with market
    const ratioAlignment = Math.abs(originalPricePerLike - avgPricePerLike) < 1 
      ? "almost exactly in line with" 
      : originalPricePerLike > avgPricePerLike 
        ? "higher than" 
        : "lower than";

    // Calculate average price for related listings
    const avgMarketPrice = relatedListings
      .map(listing => parseFloat(listing.price.replace(/[$,]/g, '')))
      .reduce((sum, price) => sum + price, 0) / relatedListings.length;

    // Suggested price reduction (10-15% of the difference if higher than average)
    const suggestedReduction = originalPrice > avgMarketPrice 
      ? (originalPrice - avgMarketPrice) * 0.125 
      : 0;

    // Suggested lowball price using the adjustable factor formula
    const k = 0.5; // Adjust this value for more or less aggressive lowballing
    const lowballPrice = originalPrice < avgMarketPrice
      ? originalPrice - Math.abs(k * (avgMarketPrice - originalPrice))
      : avgMarketPrice * 0.75;

    return {
      originalPricePerLike: originalPricePerLike.toFixed(2),
      avgPricePerLike: avgPricePerLike.toFixed(2),
      ratioAlignment,
      suggestedReduction: suggestedReduction.toFixed(2),
      reductionPercentage: suggestedReduction > 0 
        ? ((suggestedReduction / originalPrice) * 100).toFixed(1) 
        : 0,
      lowballPrice: lowballPrice.toFixed(2)
    };
  }, [originalListing, relatedListings]);

  if (!calculations) {
    return <p>Insufficient data for value analysis.</p>;
  }

  return (
    <div className="value-analysis-container">
      <h2>Value Analysis</h2>
      
      <div className="metrics-section">
        <div className="metric">
          <h3>Listing's Price per Like</h3>
          <p className="metric-value">${calculations.originalPricePerLike}</p>
        </div>
        
        <div className="metric">
          <h3>Average Price per Like</h3>
          <p className="metric-value">${calculations.avgPricePerLike}</p>
        </div>
        
        <div className="metric">
          <h3>Market Alignment</h3>
          <p>The price-to-popularity ratio is {calculations.ratioAlignment} other listings</p>
        </div>
      </div>
      
      <div className="recommendations-section">
        <h2>Recommendations</h2>
        
        <div className="recommendation-group">
          <h3>If you're the seller:</h3>
          <ul>
            {calculations.suggestedReduction > 0 && (
              <li>
                Consider reducing your price by approximately {calculations.reductionPercentage}% 
                to better align with the market and increase buyer interest.
              </li>
            )}
            <li>
              A higher price-per-like ratio suggests exclusivity, but be mindful of market trends 
              to ensure competitiveness.
            </li>
            <li>
              If your listing has been active for a long time with limited engagement, 
              a price adjustment might make it more attractive.
            </li>
          </ul>
        </div>
        
        <div className="recommendation-group">
          <h3>If you're a potential buyer:</h3>
          <ul>
            <li>
              The price is relatively high compared to similar listings, so consider negotiating 
              or waiting for a price drop if budget-conscious.
            </li>
            <li>
              A lower price-per-like ratio suggests a better deal based on popularity, 
              but also ensure the quality and condition match your expectations.
            </li>
            <li>
              If this item is rare or highly desirable, the premium pricing may be justified, 
              and waiting might risk losing the opportunity.
            </li>
            <li>
              A reasonable starting point for negotiation could be around ${calculations.lowballPrice}, 
              factoring in how far the listing deviates from the average market price.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ValueAnalysis;
