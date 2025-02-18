import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const BubbleChartD3 = ({ originalListing, relatedListings }) => {
  const chartRef = useRef(null);

  useEffect(() => {
    if (!relatedListings || relatedListings.length === 0) return;

    const priceToNumber = (priceStr) => parseFloat(priceStr.replace('$', ''));
    const likesToNumber = (likesStr) => parseInt(likesStr, 10);

    const prices = relatedListings.map((item) => priceToNumber(item.price));
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    const likes = relatedListings.map((item) => likesToNumber(item.likesCount));
    const maxLikes = Math.max(...likes);

    const width = chartRef.current.clientWidth;
    const height = chartRef.current.clientHeight;

    const xScale = d3.scaleLinear().domain([minPrice, maxPrice]).range([50, width - 50]);
    const sizeScale = d3.scaleSqrt().domain([0, maxLikes]).range([20, 100]);

    const svg = d3.select(chartRef.current).selectAll('*').remove();

    const chartSvg = d3.select(chartRef.current)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    // Draw bubbles
    chartSvg.selectAll('circle')
      .data(relatedListings)
      .enter()
      .append('circle')
      .attr('cx', (d) => xScale(priceToNumber(d.price)))
      .attr('cy', height / 2)
      .attr('r', (d) => sizeScale(likesToNumber(d.likesCount)))
      .attr('fill', '#3B82F6')
      .attr('opacity', 0.7)
      .on('mouseover', function () {
        d3.select(this).transition().duration(200).attr('opacity', 1).attr('r', (d) => sizeScale(likesToNumber(d.likesCount)) * 1.2);
      })
      .on('mouseout', function () {
        d3.select(this).transition().duration(200).attr('opacity', 0.7).attr('r', (d) => sizeScale(likesToNumber(d.likesCount)));
      });

    // Draw original listing
    if (originalListing) {
      chartSvg.append('circle')
        .attr('cx', xScale(priceToNumber(originalListing.price)))
        .attr('cy', height / 2)
        .attr('r', sizeScale(likesToNumber(originalListing.likesCount)))
        .attr('fill', '#10B981')
        .attr('opacity', 0.9)
        .on('mouseover', function () {
          d3.select(this).transition().duration(200).attr('opacity', 1).attr('r', sizeScale(likesToNumber(originalListing.likesCount)) * 1.2);
        })
        .on('mouseout', function () {
          d3.select(this).transition().duration(200).attr('opacity', 0.9).attr('r', sizeScale(likesToNumber(originalListing.likesCount)));
        });
    }
  }, [originalListing, relatedListings]);

  return (
    <div className="w-full h-screen bg-black p-8 text-white relative" ref={chartRef}>
      <h2 className="text-2xl font-bold text-center mb-4">Market Position</h2>
    </div>
  );
};

export default BubbleChartD3;