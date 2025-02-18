import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const StandardDeviationChart = ({ originalListing, relatedListings }) => {
  const svgRef = useRef();
  
  useEffect(() => {
    if (!originalListing || !relatedListings || relatedListings.length === 0) {
      return;
    }

    // Clean up previous SVG content
    d3.select(svgRef.current).selectAll('*').remove();

    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const width = 600 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Parse prices
    const prices = relatedListings.map(item => 
      parseFloat(item.price.replace('$', '').replace(',', ''))
    );
    const originalPrice = parseFloat(originalListing.price.replace('$', '').replace(',', ''));

    // Calculate statistics
    const mean = d3.mean(prices);
    const stdDev = d3.deviation(prices) || 0;

    // Create the SVG container
    const svg = d3.select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // X scale
    const x = d3.scaleLinear()
      .domain([mean - 3 * stdDev, mean + 3 * stdDev])
      .range([0, width]);

    // Y scale (arbitrary for normal distribution shape)
    const y = d3.scaleLinear()
      .domain([0, 1])
      .range([height, 0]);

    // Generate normal distribution curve data
    const normalDist = d3.range(mean - 3 * stdDev, mean + 3 * stdDev, stdDev / 20).map(xValue => {
      return {
        x: xValue,
        y: (1 / (stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * ((xValue - mean) / stdDev) ** 2)
      };
    });

    // Line generator
    const line = d3.line()
      .x(d => x(d.x))
      .y(d => y(d.y / d3.max(normalDist, d => d.y))) // Normalize the y values
      .curve(d3.curveBasis);

    // Draw normal distribution curve
    svg.append("path")
      .datum(normalDist)
      .attr("fill", "none")
      .attr("stroke", "#69b3a2")
      .attr("stroke-width", 2)
      .attr("d", line);

    // Add X axis
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat(d3.format(".2f")))
      .append("text")
      .attr("x", width / 2)
      .attr("y", margin.bottom - 5)
      .attr("fill", "currentColor")
      .attr("text-anchor", "middle")
      .text("Price ($)");

    // Add original listing price line
    svg.append("line")
      .attr("x1", x(originalPrice))
      .attr("x2", x(originalPrice))
      .attr("y1", 0)
      .attr("y2", height)
      .attr("stroke", "red")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "5,5");

    // Add annotation for original price
    svg.append("text")
      .attr("x", x(originalPrice) + 5)
      .attr("y", 20)
      .attr("fill", "red")
      .attr("font-size", "12px")
      .text("Your Listing");
  }, [originalListing, relatedListings]);

  return (
    <div className="chart-container">
      <h3>Price Distribution (Normal Curve)</h3>
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default StandardDeviationChart;
