import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, HashRouter, useLocation } from "react-router-dom";
import RecentlyViewed from "./components/jsx/RecentlyViewed.jsx"
import Hero from "./components/jsx/Hero.jsx";
import Navbar from "./components/jsx/navbar.jsx";
import Results from "./components/jsx/Results.jsx";
import Feedback from './components/jsx/Feedback.jsx';
import Read from './components/jsx/Read.jsx'

function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <RecentlyViewed />
    </>
  );
}


function ReadPage() {
  return (
    <>
      <Navbar />
      <Read />
    </>
  );
}

function ResultsPage() {
  return (
    <>
      <Navbar />
      <Results />
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

function FeedbackPage() {
  return (
    <>
      <Navbar />
      <Feedback />
    </>
  );
}

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/resultspage" element={<ResultsPage />} />
        <Route path="/feedback" element={<FeedbackPage />} />
        <Route path="/read" element={<ReadPage />} />
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
 