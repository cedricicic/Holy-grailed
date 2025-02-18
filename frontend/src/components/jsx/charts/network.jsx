import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const NetworkChart = ({ data }) => {
  const networkGraphRef = useRef(null);

  useEffect(() => {
    if (!data || !networkGraphRef.current) return;

    networkGraphRef.current.innerHTML = '';

    let nodes = {};
    let links = {};

    data.forEach(item => {
      let lbls = item.labels;
      lbls.forEach(label => {
        nodes[label] = nodes[label] || { id: label, count: 0 };
        nodes[label].count += 1;
      });

      for (let i = 0; i < lbls.length; i++) {
        for (let j = i + 1; j < lbls.length; j++) {
          let key = lbls[i] < lbls[j] ? lbls[i] + '---' + lbls[j] : lbls[j] + '---' + lbls[i];
          links[key] = (links[key] || 0) + 1;
        }
      }
    });

    let nodesArray = Object.values(nodes);
    let linksArray = Object.entries(links).map(([key, value]) => {
      let parts = key.split('---');
      return { source: parts[0], target: parts[1], value: value };
    });

    const totalCount = nodesArray.reduce((acc, node) => acc + node.count, 0);

    const container = d3.select(networkGraphRef.current);
    const containerWidth = parseInt(container.style('width'));
    const containerHeight = parseInt(container.style('height'));
    const width = containerWidth || 800;
    const height = containerHeight || 600;

    const tooltip = d3.select("body")
      .append("div")
      .attr("class", "network-tooltip")
      .style("position", "absolute")
      .style("background", "rgba(0,0,0,0.7)")
      .style("color", "white")
      .style("padding", "8px")
      .style("border-radius", "4px")
      .style("font-size", "12px")
      .style("pointer-events", "none")
      .style("opacity", 0)
      .style("z-index", 1000);

    const svg = d3.select(networkGraphRef.current)
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    const nodeCount = nodesArray.length;
    const baseMaxRadius = Math.min(width, height) / 15;
    const maxRadius = nodeCount > 50 ? baseMaxRadius / Math.log(nodeCount) : baseMaxRadius;
    const maxCount = d3.max(nodesArray, d => d.count);
    const radiusScale = d3.scaleSqrt()
      .domain([0, maxCount])
      .range([3, maxRadius]);

    const linkDistance = nodeCount > 50 ? 100 * (1 - Math.log(nodeCount / 100) / 10) : 100;

    const simulation = d3.forceSimulation(nodesArray)
      .force('link', d3.forceLink(linksArray).id(d => d.id).distance(linkDistance))
      .force('charge', d3.forceManyBody().strength(-200 * (width / 800)))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .alphaDecay(0.01)
      .alpha(1).restart();

      svg.append('text')
    .attr('x', 10)
    .attr('y', 30)
    .attr('font-size', '30px')
    .attr('font-weight', 'bold')
    .text('Network Chart');

  // Add top five tags legend
  const topFiveTags = nodesArray
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const legendPadding = 30;
  const legend = svg.append('g')
    .attr('class', 'legend')
    .attr('transform', `translate(${legendPadding}, ${height - legendPadding})`);

  // Add legend background
  legend.append('rect')
    .attr('width', 180)
    .attr('height', topFiveTags.length * 20 + 25)
    .attr('y', -topFiveTags.length * 20 - 10)
    .attr('rx', 5)
    .attr('ry', 5)
    .attr('fill', 'white')
    .attr('opacity', 1)
    .attr('stroke', 'black');

  // Add legend title
  legend.append('text')
    .attr('x', 5)
    .attr('y', -topFiveTags.length * 20 + 5)
    .text('Top 5 Designers:')
    .attr('font-weight', 'bold')
    .attr('font-size', '14px');

  // Add legend items
  legend.selectAll('.legend-item')
  .data(topFiveTags)
  .enter()
  .append('text')
  .attr('class', 'legend-item')
  .attr('x', 10)
  .attr('y', (d, i) => -topFiveTags.length * 20 + 25 + i * 20)
  .text(d => {
    const percentage = ((d.count / data.length) * 100).toFixed(1); // Calculate percentage
    return `${d.id} (${percentage}%)`; // Display percentage
  })
  .attr('font-size', '12px')
  .attr('fill', '#333');

    const link = svg.append('g')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(linksArray)
      .enter().append('line')
      .attr('stroke-width', d => Math.sqrt(d.value))
      .on('mouseover', showLinkTooltip)
      .on('mouseout', hideTooltip);

    const node = svg.append('g')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .selectAll('circle')
      .data(nodesArray)
      .enter().append('circle')
      .attr('r', d => radiusScale(d.count))
      .attr('fill', 'grey')
      .on('mouseover', showNodeTooltip)
      .on('mouseout', hideTooltip)
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    const text = svg.append('g')
      .selectAll('text')
      .data(nodesArray)
      .enter().append('text')
      .attr('dy', -12)
      .attr('font-size', `${nodeCount > 50 ? 12 / Math.log(nodeCount / 10) : 12}px`)
      .attr('text-anchor', 'middle')
      .attr('fill', '#333')
      .text(d => d.id);

      svg.append('text')
      .attr('x', 10)
      .attr('y', 30)
      .attr('font-size', '30px')
      .attr('font-weight', 'bold')
      .text('Network Chart');

    simulation.on('tick', () => {
      link.attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node.attr('cx', d => d.x)
        .attr('cy', d => d.y);

      text.attr('x', d => d.x)
        .attr('y', d => d.y - radiusScale(d.count) - 2);
    });

    function showNodeTooltip(event, d) {
        // Calculate the percentage based on the number of listings where the label appears
        const percentage = ((d.count / data.length) * 100).toFixed(1); // Use data.length instead of totalCount
        tooltip.transition()
          .duration(200)
          .style('opacity', 0.9);
        tooltip.html(`<strong>${d.id}</strong><br>Count: ${d.count}<br>Percentage: ${percentage}%`)
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 28}px`);
      
        // Highlight connected links
        link.style('stroke-opacity', l =>
          l.source.id === d.id || l.target.id === d.id ? 0.9 : 0.2
        );
      }

    function showLinkTooltip(event, d) {
      tooltip.transition()
        .duration(200)
        .style('opacity', 0.9);
      tooltip.html(`<strong>Connection</strong><br>${d.source.id} — ${d.target.id}<br>Strength: ${d.value}`)
        .style('left', `${event.pageX + 10}px`)
        .style('top', `${event.pageY - 28}px`);

      d3.select(event.currentTarget).style('stroke-opacity', 0.9);
    }

    function hideTooltip() {
      tooltip.transition()
        .duration(500)
        .style('opacity', 0);

      // Reset opacity
      link.style('stroke-opacity', 0.6);
    }

    // Drag functions
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
  }, [data]);

  return <div id="networkGraph" ref={networkGraphRef}></div>;
};

export default NetworkChart;