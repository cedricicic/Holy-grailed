import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, HashRouter, useLocation } from "react-router-dom";
import RecentlyViewed from "./components/jsx/RecentlyViewed.jsx"
import Hero from "./components/jsx/Hero.jsx";
import Navbar from "./components/jsx/navbar.jsx";
import RecentSearches from "./components/jsx/RecentSearches.jsx";

function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <RecentlyViewed />
    </>
  );
}

function Reporter() {
  return (
    <>
      <Report />
    </>
  );
}

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/report" element={<Reporter />} />
      </Routes>
    </>
  );
}

export default function Main() {
  return (
    <HashRouter>
      <App />
    </HashRouter>
  );
}
 