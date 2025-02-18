import React from 'react'
import videoFile from "../../assets/carpe.mp4";
import '../css/hero.css'

const Hero = () => {
    return (
      <section className="hero">
        <video autoPlay loop muted className="background-video">
          <source src={videoFile} type="video/mp4" />
        </video>
        <div className="hero-text">
          <h2>The Platform for a better grailing experience</h2>
          <h3>Compare your listing with trending ones</h3>
        </div>
      </section>
    );
  };
  
  export default Hero;