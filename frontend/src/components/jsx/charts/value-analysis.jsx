import React, { useMemo } from "react";
import "../../css/value-analysis.css";

const ValueAnalysis = ({ originalListing, relatedListings }) => {
  const calculations = useMemo(() => {
    if (!originalListing || !relatedListings || relatedListings.length === 0) {
      return null;
    }

    const originalPrice = parseFloat(
      originalListing.price.replace(/[$,]/g, "")
    );
    const originalLikes = parseInt(originalListing.likesCount || 0, 10);
    const originalPricePerLike =
      originalLikes > 0 ? originalPrice / originalLikes : 0;
    const listingAge = originalListing.daysListed || 0;

    const pricesPerLike = relatedListings
      .map((listing) => {
        const price = parseFloat(listing.price.replace(/[$,]/g, ""));
        const likes = parseInt(listing.likesCount || 0, 10);
        return likes > 0 ? price / likes : 0;
      })
      .filter((ratio) => ratio > 0);

    const avgPricePerLike =
      pricesPerLike.length > 0
        ? pricesPerLike.reduce((sum, val) => sum + val, 0) /
          pricesPerLike.length
        : 0;

    const marketPrices = relatedListings.map((listing) =>
      parseFloat(listing.price.replace(/[$,]/g, ""))
    );
    const avgMarketPrice =
      marketPrices.reduce((sum, price) => sum + price, 0) /
      relatedListings.length;

    const priceVariance =
      marketPrices.reduce(
        (sum, price) => sum + Math.pow(price - avgMarketPrice, 2),
        0
      ) / marketPrices.length;
    const priceStdDev = Math.sqrt(priceVariance);

    const sortedPrices = [...marketPrices].sort((a, b) => a - b);
    const pricePercentile =
      (sortedPrices.findIndex((price) => price >= originalPrice) /
        sortedPrices.length) *
      100;

    const priceDeviation =
      ((originalPrice - avgMarketPrice) / avgMarketPrice) * 100;

    const avgLikes =
      relatedListings.reduce(
        (sum, listing) => sum + parseInt(listing.likesCount || 0, 10),
        0
      ) / relatedListings.length;
    const demandRatio = originalLikes / avgLikes;

    const optimalPrice = avgMarketPrice * (1 + (demandRatio - 1) * 0.2);

    const marketAlignmentFactor =
      priceDeviation > 15
        ? 0.15
        : priceDeviation > 0
        ? priceDeviation / 100
        : 0;
    const ageFactor = listingAge > 30 ? 0.1 : listingAge > 14 ? 0.05 : 0;
    const demandFactor = demandRatio < 0.7 ? 0.1 : demandRatio < 0.9 ? 0.05 : 0;

    const adjustmentPercentage =
      (marketAlignmentFactor + ageFactor + demandFactor) * 100;
    const suggestedReduction =
      originalPrice * (marketAlignmentFactor + ageFactor + demandFactor);

    const marketVolatility = priceStdDev / avgMarketPrice;
    const lowballFactor =
      0.15 + marketVolatility * 0.5 + (listingAge > 21 ? 0.1 : 0);
    const lowballPrice = originalPrice * (1 - lowballFactor);

    return {
      originalPricePerLike: originalPricePerLike.toFixed(2),
      avgPricePerLike: avgPricePerLike.toFixed(2),
      priceDeviation: priceDeviation.toFixed(1),
      adjustmentPercentage: adjustmentPercentage.toFixed(1),
      suggestedReduction: suggestedReduction.toFixed(2),
      pricePercentile: pricePercentile.toFixed(0),
      demandRatio: demandRatio.toFixed(2),
      optimalPrice: optimalPrice.toFixed(2),
      lowballPrice: lowballPrice.toFixed(2),
      listingAge,
      marketVolatility: (marketVolatility * 100).toFixed(1),
      originalPrice,
      avgMarketPrice: avgMarketPrice.toFixed(2),
    };
  }, [originalListing, relatedListings]);

  if (!calculations) {
    return <p>Insufficient data for value analysis.</p>;
  }

  const getSellerRecommendations = () => {
    const recommendations = [];

    if (parseFloat(calculations.priceDeviation) > 20) {
      recommendations.push({
        priority: "high",
        action: `You should strongly consider reducing your price by approximately ${calculations.adjustmentPercentage}% (around $${calculations.suggestedReduction}) to align more closely with market expectations.`,
        reasoning: `Your current price is significantly higher than the market average of $${calculations.avgMarketPrice}, which is likely deterring potential buyers.`,
      });
    } else if (parseFloat(calculations.priceDeviation) > 10) {
      recommendations.push({
        priority: "medium",
        action: `It may be beneficial to reduce your price by approximately ${calculations.adjustmentPercentage}% to enhance the visibility and attractiveness of your listing.`,
        reasoning: `Your price is somewhat above the market average, which may slightly limit buyer interest.`,
      });
    } else if (parseFloat(calculations.priceDeviation) < -15) {
      recommendations.push({
        priority: "high",
        action: `Consider increasing your price to better reflect market value, aiming for approximately $${calculations.optimalPrice}.`,
        reasoning: `Your current listing price is significantly below similar items in the market, indicating you might be underpricing and missing out on potential earnings.`,
      });
    }

    if (calculations.listingAge > 30) {
      recommendations.push({
        priority: "high",
        action:
          "You should refresh your listing by updating the photos or enhancing the description to reinvigorate interest.",
        reasoning:
          "Your listing has been active for over a month with limited buyer engagement, suggesting it may need a visual or informational update to attract attention.",
      });
    } else if (
      calculations.listingAge > 14 &&
      parseFloat(calculations.demandRatio) < 0.8
    ) {
      recommendations.push({
        priority: "medium",
        action:
          "Consider updating your listing details or making a slight price adjustment to improve its performance.",
        reasoning:
          "Engagement is currently lower than average for similar listings after two weeks, indicating that minor adjustments could increase interest.",
      });
    }

    if (parseFloat(calculations.demandRatio) > 1.5) {
      recommendations.push({
        priority: "low",
        action:
          "You might want to experiment with a slightly higher price to gauge buyer response.",
        reasoning:
          "Your listing is attracting significantly more interest compared to similar items, suggesting there could be room for a price increase.",
      });
    } else if (parseFloat(calculations.demandRatio) < 0.6) {
      recommendations.push({
        priority: "high",
        action:
          "Focus on improving your listing’s visibility by enhancing the keywords or uploading higher-quality photos.",
        reasoning:
          "Your listing is receiving considerably less interest compared to similar items, indicating it may not be reaching potential buyers effectively.",
      });
    }

    return recommendations;
  };

  const getBuyerRecommendations = () => {
    const recommendations = [];

    if (parseFloat(calculations.priceDeviation) > 25) {
      recommendations.push({
        priority: "high",
        action: `It is advisable to start your offer at around $${calculations.lowballPrice} to initiate negotiations effectively, given the high listing price.`,
        reasoning: `The item is priced in the top ${calculations.pricePercentile}% of the market, making it significantly more expensive than comparable listings.`,
      });
    } else if (parseFloat(calculations.priceDeviation) > 10) {
      recommendations.push({
        priority: "medium",
        action: `A reasonable counteroffer would be approximately $${(
          parseFloat(calculations.originalPrice) * 0.9
        ).toFixed(2)}, reflecting a fair market value adjustment.`,
        reasoning:
          "Although the price is slightly above market average, it is not excessively so, allowing room for a fair negotiation.",
      });
    } else if (parseFloat(calculations.priceDeviation) < -10) {
      recommendations.push({
        priority: "high",
        action:
          "You should act quickly to secure this deal, as the listing is priced below the market average and represents good value.",
        reasoning: `The item is priced approximately ${Math.abs(
          parseFloat(calculations.priceDeviation)
        )}% below average, making it an attractive purchase opportunity.`,
      });
    }

    if (
      calculations.listingAge > 21 &&
      parseFloat(calculations.priceDeviation) > 0
    ) {
      recommendations.push({
        priority: "high",
        action:
          "When making an offer, mention that the listing has been active for over three weeks, as this may encourage the seller to negotiate more flexibly.",
        reasoning:
          "Listings that have been on the market for an extended period often indicate a seller’s increasing willingness to lower their price.",
      });
    }

    if (parseFloat(calculations.marketVolatility) > 25) {
      recommendations.push({
        priority: "medium",
        action:
          "Be prepared to negotiate assertively, as prices within this category exhibit substantial variation.",
        reasoning: `Market volatility is currently at ${calculations.marketVolatility}%, indicating that sellers may have different pricing expectations, offering room for negotiation.`,
      });
    } else if (parseFloat(calculations.marketVolatility) < 10) {
      recommendations.push({
        priority: "low",
        action:
          "Understand that prices in this category tend to be relatively fixed, limiting the potential for negotiation.",
        reasoning:
          "Low market volatility suggests that sellers are generally consistent with their pricing, reducing the likelihood of large discounts.",
      });
    }

    if (parseFloat(calculations.demandRatio) > 1.3) {
      recommendations.push({
        priority: "high",
        action:
          "If you are genuinely interested in this item, avoid prolonged negotiation, as it is likely to sell quickly.",
        reasoning:
          "This listing is receiving 30% more interest than comparable items, increasing the risk of it being purchased by another buyer.",
      });
    }

    return recommendations;
  };

  const sellerRecommendations = getSellerRecommendations();
  const buyerRecommendations = getBuyerRecommendations();

  return (
    <div className="value-analysis-container">
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
  <h3>Price Volatility</h3>
  <p className="metric-value">
    {parseFloat((calculations.marketVolatility * 100).toFixed(2))}%
  </p>
</div>

        <div className="metric">
          <h3>Market Positioning</h3>
          <p>
            {parseFloat(calculations.priceDeviation) > 0
              ? `Priced ${calculations.priceDeviation}% above market average`
              : `Priced ${Math.abs(
                  parseFloat(calculations.priceDeviation)
                )}% below market average`}
          </p>
        </div>

        <div className="metric">
          <h3>Listing Performance</h3>
          <p>
            {parseFloat(calculations.demandRatio) > 1
              ? `Generating ${(
                  (parseFloat(calculations.demandRatio) - 1) *
                  100
                ).toFixed(0)}% more interest than average`
              : `Generating ${(
                  (1 - parseFloat(calculations.demandRatio)) *
                  100
                ).toFixed(0)}% less interest than average`}
          </p>
        </div>

        <div className="metric">
          <h3>Price vs Optimal Price</h3>
          <p>
            {parseFloat(calculations.originalPrice) >
            parseFloat(calculations.optimalPrice)
              ? `Overpriced by $${parseFloat(
                  (
                    calculations.originalPrice - calculations.optimalPrice
                  ).toFixed(2)
                )}`
              : `Underpriced by $${parseFloat(
                  Math.abs(
                    calculations.originalPrice - calculations.optimalPrice
                  ).toFixed(2)
                )}`}
          </p>
        </div>
      </div>

      <div className="recommendations-section">
        <h2>Recommendations</h2>

        <div className="recommendation-group">
          <h3>If you're the seller:</h3>
          {sellerRecommendations.length > 0 ? (
            <ul className="dynamic-recommendations">
              {sellerRecommendations.map((rec, index) => (
                <li
                  key={`seller-${index}`}
                  className={`priority-${rec.priority}`}
                >
                  <div className="recommendation-action">{rec.action}</div>
                  <div className="recommendation-reasoning">
                    {rec.reasoning}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p>Your listing is well-aligned with current market conditions.</p>
          )}
        </div>

        <div className="recommendation-group">
          <h3>If you're a potential buyer:</h3>
          {buyerRecommendations.length > 0 ? (
            <ul className="dynamic-recommendations">
              {buyerRecommendations.map((rec, index) => (
                <li
                  key={`buyer-${index}`}
                  className={`priority-${rec.priority}`}
                >
                  <div className="recommendation-action">{rec.action}</div>
                  <div className="recommendation-reasoning">
                    {rec.reasoning}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p>
              This listing appears to be fairly priced relative to the market.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ValueAnalysis;
