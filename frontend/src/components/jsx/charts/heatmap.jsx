import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

const AuthenticityHeatMapSymmetrical = ({
  originalListing,
  relatedListings,
}) => {
  const svgRef = useRef();
  const [hoveredListing, setHoveredListing] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const animationRef = useRef(null);

  useEffect(() => {
    if (!originalListing || !relatedListings) return;

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    d3.select(svgRef.current).selectAll("*").remove();

    const width = 500;
    const height = 500;
    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    const centerX = width / 2;
    const centerY = height / 2;

    const originalRadius = 12;
    svg
      .append("circle")
      .datum(originalListing)
      .attr("cx", centerX)
      .attr("cy", centerY)
      .attr("r", originalRadius)
      .attr("fill", originalListing.isAuthentic ? "#fff" : "#000")
      .attr("stroke", "red")
      .attr("stroke-width", 3)
      .on("mouseover", (event, d) => {
        setHoveredListing({ ...d, isOriginal: true });

        const [x, y] = d3.pointer(event, svgRef.current);
        setTooltipPos({ x, y });
      })
      .on("mouseout", () => setHoveredListing(null));

    const relatedGroup = svg
      .append("g")
      .attr("transform", `translate(${centerX}, ${centerY})`);

    const relatedCount = relatedListings.length;
    const circleRadius = 180;

    relatedListings.forEach((listing, i) => {
      const angle = (i * 2 * Math.PI) / relatedCount;
      const x = circleRadius * Math.cos(angle);
      const y = circleRadius * Math.sin(angle);

      relatedGroup
        .append("circle")
        .datum({ ...listing, initialAngle: angle })
        .attr("cx", x)
        .attr("cy", y)
        .attr("r", 8)
        .attr("fill", listing.isAuthentic ? "#fff" : "#000")
        .attr("stroke", listing.isAuthentic ? "#000" : "#fff")
        .attr("stroke-width", 1)
        .on("mouseover", (event, d) => {
          setHoveredListing({ ...d, isOriginal: false });

          const [mouseX, mouseY] = d3.pointer(event, svgRef.current);
          setTooltipPos({ x: mouseX, y: mouseY });
        })
        .on("mouseout", () => setHoveredListing(null));
    });

    const legend = svg
      .append("g")
      .attr("transform", `translate(20, ${height - 60})`);

    legend
      .append("circle")
      .attr("cx", 0)
      .attr("cy", 15)
      .attr("r", 6)
      .attr("fill", "#fff")
      .attr("stroke", "#000")
      .attr("stroke-width", 1);
    legend
      .append("text")
      .attr("x", 15)
      .attr("y", 20)
      .text("Authentic")
      .attr("font-size", "12px")
      .attr("fill", "#333");

    legend
      .append("circle")
      .attr("cx", 100)
      .attr("cy", 15)
      .attr("r", 6)
      .attr("fill", "#000")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1);
    legend
      .append("text")
      .attr("x", 115)
      .attr("y", 20)
      .text("Inauthentic")
      .attr("font-size", "12px")
      .attr("fill", "#333");

    legend
      .append("circle")
      .attr("cx", 200)
      .attr("cy", 15)
      .attr("r", originalRadius)
      .attr("fill", originalListing.isAuthentic ? "#fff" : "#000")
      .attr("stroke", "red")
      .attr("stroke-width", 3);
    legend
      .append("text")
      .attr("x", 215)
      .attr("y", 20)
      .text("Your Listing")
      .attr("font-size", "12px")
      .attr("fill", "#333");

    let angleOffset = 0;
    const speed = 0.0005;

    const animate = () => {
      angleOffset += speed;

      relatedGroup.attr(
        "transform",
        `translate(${centerX}, ${centerY}) rotate(${
          angleOffset * (180 / Math.PI)
        })`
      );

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [originalListing, relatedListings]);

  const formatCurrency = (price) => {
    const p =
      typeof price === "string"
        ? parseFloat(price.replace("$", "").replace(/,/g, ""))
        : price;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(p);
  };

  return (
    <>
      <h2>Authenticity Comparison</h2>
      <div
        className="chart-container"
        style={{
          position: "relative",
          width: "500px",
          height: "500px",
          margin: "0 auto",
        }}
      >
        <svg ref={svgRef}></svg>
        {hoveredListing && (
          <div
            style={{
              position: "absolute",
              left: `${tooltipPos.x + 10}px`,
              top: `${tooltipPos.y - 10}px`,
              backgroundColor: "#fff",
              border: "1px solid #333",
              padding: "8px",
              borderRadius: "4px",
              pointerEvents: "none",
              fontSize: "12px",
              boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
              color: "#333",
            }}
          >
            <div>
              <strong>
                {hoveredListing.isOriginal ? "Your Listing" : "Similar Listing"}
              </strong>
            </div>
            {hoveredListing.price && (
              <div>Price: {formatCurrency(hoveredListing.price)}</div>
            )}
            {hoveredListing.address && (
              <div>Address: {hoveredListing.address}</div>
            )}
            <div>
              Authenticity:{" "}
              {hoveredListing.isAuthentic ? "Authentic" : "Inauthentic"}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AuthenticityHeatMapSymmetrical;
