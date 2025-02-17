import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
// import '../../css/';

const RadarChart = ({ pricePercentile, likesPercentile, photosPercentile }) => {
  const radarChartRef = useRef(null);

  useEffect(() => {
    if (radarChartRef.current) {
      createRadarChart(radarChartRef.current, pricePercentile, likesPercentile, photosPercentile);
    }
  }, [pricePercentile, likesPercentile, photosPercentile]);

  return <div id="radarChart" ref={radarChartRef}></div>;
};

const createRadarChart = (target, pricePercentile, likesPercentile, photosPercentile) => {
  const radarChart = document.getElementById('radarChart');
  if (!radarChart || radarChart.querySelector('svg')) return;

  // Clear any existing content
  radarChart.innerHTML = '';

  const width = 500;
  const height = 500;
  const radius = Math.min(width, height) / 2 - 60;
  const centerX = width / 2;
  const centerY = height / 2;

  const svg = d3.select('#radarChart')
    .append('svg')
    .attr('width', '100%')
    .attr('height', '100%')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet');

  // Add tooltip div
  const tooltip = d3.select('body').append('div')
    .attr('class', 'radar-tooltip')
    .style('position', 'absolute')
    .style('background', 'rgba(0,0,0,0.7)')
    .style('color', 'white')
    .style('padding', '8px')
    .style('border-radius', '4px')
    .style('font-size', '12px')
    .style('pointer-events', 'none')
    .style('opacity', 0)
    .style('z-index', 1000);

  // Add background for better contrast
  svg.append('rect')
    .attr('width', width)
    .attr('height', height)
    .attr('fill', '#f8f9fa');

  const metrics = [
    { name: 'Price Competitiveness', value: 100 - parseFloat(pricePercentile) },
    { name: 'Likeability', value: parseFloat(likesPercentile) },
    { name: 'Label Effectiveness', value: 65 },
    { name: 'Photos Appeal', value: parseFloat(photosPercentile) }
  ];

  const angleSlice = (Math.PI * 2) / metrics.length;

  // Draw concentric circles
  [0.2, 0.4, 0.6, 0.8, 1].forEach(r => {
    svg.append('circle')
      .attr('cx', centerX)
      .attr('cy', centerY)
      .attr('r', radius * r)
      .attr('fill', 'none')
      .attr('stroke', '#e0e0e0')
      .attr('stroke-width', 1);

    if (r > 0) {
      svg.append('text')
        .attr('x', centerX)
        .attr('y', centerY - radius * r)
        .attr('text-anchor', 'middle')
        .attr('alignment-baseline', 'middle')
        .attr('font-size', '10px')
        .attr('fill', '#666')
        .text(`${r * 100}%`);
    }
  });

  // Draw axis lines
  metrics.forEach((d, i) => {
    const angle = i * angleSlice - Math.PI / 2;
    const lineEnd = {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    };

    svg.append('line')
      .attr('x1', centerX)
      .attr('y1', centerY)
      .attr('x2', lineEnd.x)
      .attr('y2', lineEnd.y)
      .attr('stroke', '#d0d0d0')
      .attr('stroke-width', 1);

    // Position labels with improved centering
    const labelDistance = radius + 26;
    const labelX = centerX + labelDistance * Math.cos(angle);
    const labelY = centerY + labelDistance * Math.sin(angle);
    
    let anchor = 'middle';
    if (angle < -Math.PI / 4 && angle > -3 * Math.PI / 4) anchor = 'end';
    else if (angle > Math.PI / 4 && angle < 3 * Math.PI / 4) anchor = 'start';

    const text = svg.append('text')
      .attr('x', labelX)
      .attr('y', labelY)
      .attr('text-anchor', anchor)
      .attr('dy', '0.35em')
      .attr('font-size', '14px')
      .attr('fill', '#333')
      .text(d.name);

      text.attr('text-anchor', 'middle')
      .attr('alignment-baseline', 'middle');

    wrapText(text, 80);
  });
  

  // Draw radar shape
  const radarPoints = metrics.map((d, i) => {
    const angle = i * angleSlice - Math.PI / 2;
    return {
      x: centerX + (d.value / 150) * radius * Math.cos(angle),
      y: centerY + (d.value / 150) * radius * Math.sin(angle),
      value: d.value,
      name: d.name
    };
  });

  const lineGenerator = d3.line()
    .x(d => d.x)
    .y(d => d.y)
    .curve(d3.curveLinearClosed);

  svg.append('path')
    .datum(radarPoints)
    .attr('d', lineGenerator)
    .attr('fill', 'rgba(139, 157, 195, 0.3)')
    .attr('stroke', 'rgba(139, 157, 195, 0.8)')
    .attr('stroke-width', 2);

  // Draw points with hover effect
  radarPoints.forEach((d) => {
    svg.append('circle')
      .attr('cx', d.x)
      .attr('cy', d.y)
      .attr('r', 6)
      .attr('fill', 'rgba(139, 157, 195, 0.9)')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .on('mouseover', function(event) {
        d3.select(this).attr('r', 8);
        tooltip.transition()
          .duration(200)
          .style('opacity', .9);
        tooltip.html(`${d.name}: ${d.value.toFixed(1)}%`)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', function() {
        d3.select(this).attr('r', 6);
        tooltip.transition()
          .duration(500)
          .style('opacity', 0);
      });
  });

  // Add center overlay
  const overlayWidth = 150;
  const overlayHeight = 40;

  svg.append('rect')
    .attr('x', centerX - overlayWidth / 2)
    .attr('y', centerY - overlayHeight / 2)
    .attr('width', overlayWidth)
    .attr('height', overlayHeight)
    .attr('fill', 'rgba(255, 255, 255, 0.85)')
    .attr('rx', 8)
    .attr('ry', 8)
    .attr('stroke', '#e0e0e0')
    .attr('stroke-width', 1);

  svg.append('text')
    .attr('x', centerX)
    .attr('y', centerY)
    .attr('text-anchor', 'middle')
    .attr('dy', '0.35em')
    .attr('font-size', '18px')
    .attr('font-weight', 'bold')
    .text('Radar Chart');
};

// Function to wrap text inside SVG
const wrapText = (text, width) => {
  text.each(function () {
    const text = d3.select(this);
    const originalAnchor = text.attr('text-anchor');
    const originalX = text.attr('x');
    const words = text.text().split(/\s+/).reverse();
    
    let word,
      line = [],
      lineNumber = 0,
      lineHeight = 1.2,
      y = text.attr('y'),
      x = originalX,
      dy = parseFloat(text.attr('dy')) || 0,
      tspan = text.text(null).append('tspan')
                .attr('x', x)
                .attr('y', y)
                .attr('text-anchor', originalAnchor)
                .attr('dy', dy + 'em');

    while ((word = words.pop())) {
      line.push(word);
      tspan.text(line.join(' '));
      if (tspan.node().getComputedTextLength() > width) {
        line.pop();
        tspan.text(line.join(' '));
        line = [word];
        tspan = text.append('tspan')
                  .attr('x', x)
                  .attr('y', y)
                  .attr('text-anchor', originalAnchor)
                  .attr('dy', `${++lineNumber * lineHeight}em`)
                  .text(word);
      }
    }
  });
};

export default RadarChart;