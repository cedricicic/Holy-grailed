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

    const container = chartRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const sizeScale = d3.scaleSqrt().domain([0, maxLikes]).range([10, 50]);

    d3.select(container).select('svg').remove();

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    const nodes = relatedListings.map((d) => ({
      ...d,
      radius: sizeScale(likesToNumber(d.likesCount)),
    }));

    if (originalListing) {
      nodes.push({
        ...originalListing,
        isOriginal: true,
        radius: sizeScale(likesToNumber(originalListing.likesCount)),
      });
    }

    const simulation = d3.forceSimulation(nodes)
      .force('x', d3.forceX(width / 2).strength(0.05))
      .force('y', d3.forceY(height / 2).strength(0.05))
      .force('collide', d3.forceCollide((d) => d.radius + 2))
      .on('tick', ticked);

    function ticked() {
      const bubbles = svg.selectAll('circle')
        .data(nodes, (d) => d.id || d.title);

      bubbles.enter()
        .append('circle')
        .attr('r', (d) => d.radius)
        .attr('fill', (d) => (d.isOriginal ? '#10B981' : '#3B82F6'))
        .attr('opacity', 0.8)
        .merge(bubbles)
        .attr('cx', (d) => d.x)
        .attr('cy', (d) => d.y);

      bubbles.exit().remove();
    }
  }, [originalListing, relatedListings]);

  return (
    <div className="w-full h-screen bg-black text-white relative overflow-hidden" ref={chartRef}>
      <h2 className="text-2xl font-bold text-center mb-4 absolute top-0 left-0 w-full">Market Position</h2>
    </div>
  );
};

export default BubbleChartD3;