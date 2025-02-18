import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const BubbleChart = ({ originalListing, relatedListings }) => {
  const svgRef = useRef();
  const [tooltip, setTooltip] = useState({ show: false, data: null, position: { x: 0, y: 0 } });

  useEffect(() => {
    if (!originalListing || !relatedListings || relatedListings.length === 0) {
      return;
    }

    // Clean up previous SVG content
    d3.select(svgRef.current).selectAll('*').remove();

    // Parse prices and prepare data
    const data = relatedListings.map(item => ({
      id: item.id || Math.random().toString(36).substr(2, 9),
      price: parseFloat(item.price.replace('$', '').replace(',', '')),
      radius: 10, // Default radius, will scale later
      listing: item
    }));

    // Add original listing
    const originalPrice = parseFloat(originalListing.price.replace('$', '').replace(',', ''));
    data.push({
      id: 'original',
      price: originalPrice,
      radius: 15, // Slightly larger to highlight
      listing: originalListing,
      isOriginal: true
    });

    // Calculate min, max prices for scaling
    const minPrice = d3.min(data, d => d.price);
    const maxPrice = d3.max(data, d => d.price);

    // Set up dimensions
    const width = 500;
    const height = 500;
    const margin = { top: 50, right: 50, bottom: 50, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Scale for x-axis (price distribution)
    const x = d3.scaleLinear()
      .domain([minPrice * 0.9, maxPrice * 1.1]) // Add 10% padding
      .range([0, innerWidth]);

    // Scale for y-axis (random distribution for bubble chart)
    const y = d3.scaleLinear()
      .domain([0, 1])
      .range([innerHeight, 0]);

    // Scale for bubble size
    const radius = d3.scaleSqrt()
      .domain([minPrice, maxPrice])
      .range([5, 25]);

    // Update radii based on price
    data.forEach(d => {
      d.radius = radius(d.price);
      d.x = x(d.price);
      d.y = innerHeight / 2 + (Math.random() - 0.5) * innerHeight * 0.6; // Random y position around center
    });

    // Collision force to prevent overlap
    const simulation = d3.forceSimulation(data)
      .force('x', d3.forceX(d => x(d.price)).strength(1))
      .force('y', d3.forceY(innerHeight / 2).strength(0.1))
      .force('collide', d3.forceCollide(d => d.radius + 2).iterations(4))
      .stop();

    // Run the simulation
    for (let i = 0; i < 120; ++i) simulation.tick();

    // Draw x-axis
    svg.append('g')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(d3.axisBottom(x).tickFormat(d => `$${d3.format(',')(d)}`));

    // X-axis label
    svg.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + 40)
      .attr('text-anchor', 'middle')
      .text('Price');

    // Draw bubbles
    const bubbles = svg.selectAll('.bubble')
      .data(data)
      .enter()
      .append('circle')
      .attr('class', 'bubble')
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('r', d => d.radius)
      .attr('fill', d => d.isOriginal ? '#000' : '#888')
      .attr('opacity', d => d.isOriginal ? 1 : 0.6)
      .attr('stroke', d => d.isOriginal ? 'red' : 'none')
      .attr('stroke-width', d => d.isOriginal ? 2 : 0);

    // Add mouse events for tooltip
    bubbles
      .on('mouseover', (event, d) => {
        setTooltip({
          show: true,
          data: d,
          position: {
            x: event.pageX,
            y: event.pageY
          }
        });
      })
      .on('mousemove', (event) => {
        setTooltip(prev => ({
          ...prev,
          position: {
            x: event.pageX,
            y: event.pageY
          }
        }));
      })
      .on('mouseout', () => {
        setTooltip({ show: false, data: null, position: { x: 0, y: 0 } });
      });

    // Add legend
    const legend = svg.append('g')
      .attr('transform', `translate(${innerWidth - 100}, 20)`);
    
    // Original listing legend item
    legend.append('circle')
      .attr('r', 6)
      .attr('fill', '#000')
      .attr('stroke', 'red')
      .attr('stroke-width', 2);
    
    legend.append('text')
      .attr('x', 15)
      .attr('y', 4)
      .text('Your Listing')
      .attr('alignment-baseline', 'middle');
    
    // Similar listings legend item
    legend.append('circle')
      .attr('r', 6)
      .attr('fill', '#888')
      .attr('opacity', 0.6)
      .attr('transform', 'translate(0, 25)');
    
    legend.append('text')
      .attr('x', 15)
      .attr('y', 25)
      .text('Similar Listings')
      .attr('alignment-baseline', 'middle');

  }, [originalListing, relatedListings]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  return (
    <>
      <h2>Price Distribution (Bubble Chart)</h2>
    <div className="chart-container" style={{ position: 'relative', width: '500px', height: '500px', margin: '0 auto' }}>
      <svg ref={svgRef}></svg>
      {tooltip.show && tooltip.data && (
        <div
          style={{
            position: 'fixed',
            left: `${tooltip.position.x + 15}px`,
            top: `${tooltip.position.y - 15}px`,
            backgroundColor: 'white',
            border: '1px solid black',
            padding: '5px 10px',
            borderRadius: '4px',
            pointerEvents: 'none',
            zIndex: 1000,
            fontSize: '12px'
          }}
        >
          <div><strong>{tooltip.data.isOriginal ? 'Your Listing' : 'Similar Listing'}</strong></div>
          <div>Price: {formatCurrency(tooltip.data.price)}</div>
          {tooltip.data.listing.address && (
            <div>Address: {tooltip.data.listing.address}</div>
          )}
          {tooltip.data.listing.bedrooms && (
            <div>Bedrooms: {tooltip.data.listing.bedrooms}</div>
          )}
          {tooltip.data.listing.bathrooms && (
            <div>Bathrooms: {tooltip.data.listing.bathrooms}</div>
          )}
        </div>
      )}
    </div>
    </>
  );
};

export default BubbleChart;