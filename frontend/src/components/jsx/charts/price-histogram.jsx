import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const StandardDeviationChart = ({ originalListing, relatedListings }) => {
  const svgRef = useRef();
  const [mousePosition, setMousePosition] = useState(null);

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
    const median = d3.median(prices);

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
      .attr("stroke", "black")
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
      .attr("x", 10)
      .attr("y", 20)
      .attr("fill", "red")
      .attr("font-size", "15px")
      .text("Your Listing");

    // Add median price line
    svg.append("line")
      .attr("x1", x(median))
      .attr("x2", x(median))
      .attr("y1", 0)
      .attr("y2", height)
      .attr("stroke", "black")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "5,5");

    // Add annotation for median price
    svg.append("text")
      .attr("x", 10)
      .attr("y", 40)
      .attr("fill", "black")
      .attr("font-size", "15px")
      .text("Median Price");

    // Add mouse tracking line and tooltip
    const mouseG = svg.append("g")
      .attr("class", "mouse-over-effects");

    mouseG.append("path") // This is the black vertical line to follow mouse
      .attr("class", "mouse-line")
      .style("stroke", "black")
      .style("stroke-width", "1px")
      .style("opacity", "0");

    const mousePerLine = mouseG.append('g')
      .attr('class', 'mouse-per-line');

    mousePerLine.append('text')
      .attr('class', 'mouse-text')
      .attr('transform', 'translate(10,0)');

    mouseG.append('rect') // append a rect to catch mouse movements on canvas
      .attr('width', width) // can't catch mouse events on a g element
      .attr('height', height)
      .attr('fill', 'none')
      .attr('pointer-events', 'all')
      .on('mouseout', function() { // on mouse out hide line, circles and text
        d3.select('.mouse-line')
          .style('opacity', '0');
        setMousePosition(null);
      })
      .on('mouseover', function() { // on mouse in show line, circles and text
        d3.select('.mouse-line')
          .style('opacity', '1');
      })
      .on('mousemove', function(event) { // mouse moving over canvas
        const mouse = d3.pointer(event);
        const mouseX = mouse[0];
        const priceAtMouse = x.invert(mouseX);
        const stdDevAtMouse = (priceAtMouse - mean) / stdDev;

        setMousePosition({ price: priceAtMouse, stdDev: stdDevAtMouse });

        d3.select('.mouse-line')
          .attr('d', function() {
            let d = 'M' + mouseX + ',' + height;
            d += ' ' + mouseX + ',' + 0;
            return d;
          });

        // d3.select('.mouse-text')
        //   .text(`Price: $${priceAtMouse.toFixed(2)}, Std Dev: ${stdDevAtMouse.toFixed(2)}`)
        //   .attr('transform', `translate(${mouseX + 10},${20})`);
      });

  }, [originalListing, relatedListings]);

  return (
    <div className="chart-container">
      <h3>Price Distribution (Normal Curve)</h3>
      <svg ref={svgRef}></svg>
      {mousePosition && (
        <div style={{ marginTop: '10px' }}>
          <strong>Price:</strong> ${mousePosition.price.toFixed(2)}, <strong>Std Dev:</strong> {mousePosition.stdDev.toFixed(2)}
        </div>
      )}
    </div>
  );
};

export default StandardDeviationChart;