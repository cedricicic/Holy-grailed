import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const PriceTugOfWar = ({ originalListing, relatedListings }) => {
  const svgRef = useRef();
  const [hoveredNode, setHoveredNode] = useState(null);

  useEffect(() => {
    if (!originalListing || !relatedListings || relatedListings.length === 0) {
      return;
    }

    d3.select(svgRef.current).selectAll('*').remove();

    const prices = relatedListings.map(item =>
      parseFloat(item.price.replace('$', '').replace(',', ''))
    );
    const originalPrice = parseFloat(originalListing.price.replace('$', '').replace(',', ''));
    
    prices.push(originalPrice);

    const priceExtent = d3.extent(prices);
    const priceRange = priceExtent[1] - priceExtent[0];
    const priceBands = 5; 
    const bandSize = priceRange / priceBands;
    
    const bands = Array(priceBands).fill().map((_, i) => ({
      min: priceExtent[0] + i * bandSize,
      max: priceExtent[0] + (i + 1) * bandSize,
      listings: []
    }));
    
    const originalBandIndex = Math.min(
      Math.floor((originalPrice - priceExtent[0]) / bandSize),
      priceBands - 1
    );
    
    const nodes = relatedListings.map((listing, i) => {
      const price = parseFloat(listing.price.replace('$', '').replace(',', ''));
      const bandIndex = Math.min(
        Math.floor((price - priceExtent[0]) / bandSize),
        priceBands - 1
      );
      bands[bandIndex].listings.push(listing);
      
      return {
        id: `listing-${i}`,
        price,
        bandIndex,
        listing,
        isOriginal: false
      };
    });
    
    nodes.push({
      id: 'original',
      price: originalPrice,
      bandIndex: originalBandIndex,
      listing: originalListing,
      isOriginal: true
    });
    
    const bandsWithCounts = bands.map((band, i) => ({
      ...band,
      count: band.listings.length,
      center: i
    }));

    const width = 500;
    const height = 500;
    const margin = { top: 60, right: 50, bottom: 60, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);
    
    const x = d3.scaleLinear()
      .domain([0, priceBands - 1])
      .range([0, innerWidth]);
    
    const y = d3.scaleLinear()
      .domain([0, 1])
      .range([innerHeight, 0]);
    
    const xAxis = d3.axisBottom(x)
      .tickValues(d3.range(priceBands))
      .tickFormat(i => {
        const band = bands[i];
        return `$${d3.format(',')(Math.round(band.min))}-${d3.format(',')(Math.round(band.max))}`;
      });
    
    svg.append('g')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(xAxis)
      .selectAll('text')
      .attr('transform', 'rotate(-30)')
      .attr('text-anchor', 'end')
      .attr('dx', '-0.8em')
      .attr('dy', '0.15em');

    
    const simulation = d3.forceSimulation(nodes)
      .force('x', d3.forceX(d => x(d.bandIndex)).strength(0.7))
      .force('y', d3.forceY(innerHeight / 2).strength(0.05))
      .force('collide', d3.forceCollide(d => d.isOriginal ? 12 : 8))
      .force('charge', d3.forceManyBody().strength(-15))
      .on('tick', ticked);
    
    const nodeElements = svg.append('g')
      .selectAll('.node')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('class', 'node')
      .attr('r', d => d.isOriginal ? 10 : 6)
      .attr('fill', d => d.isOriginal ? '#000' : '#aaa')
      .attr('stroke', d => d.isOriginal ? 'red' : '#666')
      .attr('stroke-width', d => d.isOriginal ? 2 : 1)
      .attr('opacity', d => d.isOriginal ? 1 : 0.7)
      .on('mouseover', (event, d) => {
        setHoveredNode(d);
      })
      .on('mouseout', () => {
        setHoveredNode(null);
      });
    
    if (nodes.find(d => d.isOriginal)) {
      const originalNode = nodeElements.filter(d => d.isOriginal);
      originalNode.append('animate')
        .attr('attributeName', 'r')
        .attr('values', '10;12;10')
        .attr('dur', '1.5s')
        .attr('repeatCount', 'indefinite');
    }
    
    function addJitter() {
      simulation
        .force('jitter', d3.forceX(d => x(d.bandIndex) + (Math.random() - 0.5) * 40).strength(0.1))
        .alpha(0.3)
        .restart();
      
      setTimeout(addJitter, 2000);
    }
    
    addJitter();
    
    function tugOfWar() {
      simulation
        .force('x', d3.forceX(d => x(d.bandIndex)).strength(0.9))
        .alpha(0.2)
        .restart();
      
      setTimeout(() => {
        simulation
          .force('x', d3.forceX(d => x(d.bandIndex)).strength(0.7))
        
        setTimeout(tugOfWar, 3000);
      }, 1000);
    }
    
    tugOfWar();
    
    function ticked() {
      nodeElements
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);
    }
    
    const legend = svg.append('g')
      .attr('transform', `translate(${innerWidth - 120}, 0)`);
    
    legend.append('circle')
      .attr('r', 6)
      .attr('fill', '#aaa')
      .attr('stroke', '#666')
      .attr('stroke-width', 1);
    
    legend.append('text')
      .attr('x', 15)
      .attr('y', 0)
      .attr('alignment-baseline', 'middle')
      .text('Similar Listings');
    
    legend.append('circle')
      .attr('r', 10)
      .attr('fill', '#000')
      .attr('stroke', 'red')
      .attr('stroke-width', 2)
      .attr('transform', 'translate(0, 25)');
    
    legend.append('text')
      .attr('x', 15)
      .attr('y', 25)
      .attr('alignment-baseline', 'middle')
      .text('Your Listing');
    
    bandsWithCounts.forEach((band, i) => {
      svg.append('text')
        .attr('x', x(i))
        .attr('y', innerHeight + 5)
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px')
        .attr('fill', '#666')
        .attr('transform', `translate(0, -10)`)
        .text(`(${band.count} listings)`);
    });

  }, [originalListing, relatedListings]);

  const formatCurrency = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  return (
    <>
<h2> Price Band</h2>
    <div className="chart-container" style={{ position: 'relative', width: '500px', height: '500px', margin: '0 auto' }}>
      <svg ref={svgRef}></svg>
      {hoveredNode && (
        <div
          style={{
            position: 'absolute',
            left: `${d3.pointer(d3.event, svgRef.current)[0] + 10}px`,
            top: `${d3.pointer(d3.event, svgRef.current)[1] - 10}px`,
            backgroundColor: 'white',
            border: '1px solid black',
            padding: '8px',
            borderRadius: '4px',
            pointerEvents: 'none',
            zIndex: 1000,
            fontSize: '12px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
          }}
        >
          <div><strong>{hoveredNode.isOriginal ? 'Your Listing' : 'Similar Listing'}</strong></div>
          <div>Price: {formatCurrency(hoveredNode.price)}</div>
          {hoveredNode.listing.address && (
            <div>Address: {hoveredNode.listing.address}</div>
          )}
          {hoveredNode.listing.bedrooms && (
            <div>Bedrooms: {hoveredNode.listing.bedrooms}</div>
          )}
          {hoveredNode.listing.bathrooms && (
            <div>Bathrooms: {hoveredNode.listing.bathrooms}</div>
          )}
        </div>
      )}
    </div>
    </>
  );
};

export default PriceTugOfWar;