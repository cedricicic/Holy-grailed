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
          <p>Compare your listing with trending ones</p>
        </div>
      </section>
    );
  };
  
  export default Hero;