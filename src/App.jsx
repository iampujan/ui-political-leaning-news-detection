// App.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import GaugeChart from "react-gauge-chart";

import "./App.css";
import "./style.css";
import Header from "./components/Header";

const App = () => {
  const API_URL = process.env.REACT_APP_API_URL;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [outlets, setOutlets] = useState([]);
  const [selectedOutlet, setSelectedOutlet] = useState("");
  const [newsDetails, setNewsDetails] = useState([]);
  const [error, setError] = useState(null);

  const wordHeadingCount = title.trim().split(/\s+/).length;
  const isValidTitle = wordHeadingCount >= 6;
  const wordBodyCount = content.trim().split(/\s+/).length;
  const isValidContent = wordBodyCount >= 200;

  const canPredict = isValidTitle && isValidContent && !loading;

  const handlePredict = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/predict`, {
        title,
        content,
      });
      setPrediction(response.data);
    } catch (error) {
      alert(
        "Error during prediction: " +
          (error.response?.data?.detail || error.message)
      );
      setPrediction(null);
    } finally {
      setLoading(false);
    }
  };

  const handleOutletChange = async (event) => {
    const outlet = event.target.value;
    setSelectedOutlet(outlet);

    try {
      const response = await axios.get(`${API_URL}/outlets/${outlet}`);
      setNewsDetails(response.data);
    } catch (error) {
      console.error("Error fetching news details:", error);
      setNewsDetails([]);
    }
  };

  useEffect(() => {
    const fetchOutlets = async () => {
      try {
        const response = await axios.get(`${API_URL}/outlets`);
        setOutlets(response.data);
      } catch (err) {
        setError(err);
        console.error("Error fetching outlets:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOutlets();
  }, []);

  const handleUseArticle = (newsTitle, newsContent) => {
    setTitle(newsTitle);
    setContent(newsContent);
  };

  const handleReset = () => {
    setTitle("");
    setContent("");
  };

  const calculateNeedleValue = () => {
    if (!prediction) return 0.5;
    const probabilities = prediction.probabilities || [0.33, 0.33, 0.33];
    const maxIndex = probabilities.indexOf(Math.max(...probabilities));
    return maxIndex === 0 ? 0.16 : maxIndex === 1 ? 0.5 : 0.84;
  };

  const renderPercentage = () => {
    if (!prediction) return "0%";
    const highestProbability = prediction.confidence;
    return (highestProbability * 100).toFixed(2) + "%";
  };

  return (
    <div className="app">
      <Header />

      <main className="app-main">
        <aside className="sidebar">
          <div className="outlet-dropdown">
            <h2>News Outlets</h2>
            <select
              className="select"
              onChange={handleOutletChange}
              value={selectedOutlet}
            >
              <option value="">Select an outlet</option>
              {outlets.map((outlet) => (
                <option key={outlet} value={outlet}>
                  {outlet}
                </option>
              ))}
            </select>
          </div>
          <div className="title-list">
            {newsDetails.length > 0 ? (
              newsDetails.map((news, index) => (
                <div className="title-list-item" key={index}>
                  <button
                    className="button-secondary title"
                    onClick={() => {
                      const expanded = document.getElementById(
                        `news-content-${index}`
                      );
                      expanded.style.display =
                        expanded.style.display === "none" ? "block" : "none";
                    }}
                  >
                    {news.title}
                  </button>
                  <div id={`news-content-${index}`} style={{ display: "none" }}>
                    <p>{news.content}</p>
                    <button
                      onClick={() => handleUseArticle(news.title, news.content)}
                    >
                      Use this article
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ textAlign: "center" }}>
                No news available. Select an outlet to view details.
              </p>
            )}
          </div>
        </aside>

        <div className="news-section">
          <div className="input-section">
            <h2>Enter News Article Details</h2>
            {!isValidTitle && (
              <p className="warning">- Title must be at least 6 words long.</p>
            )}
            {!isValidContent && (
              <p className="warning">- Content must have at least 200 words.</p>
            )}

            <input
              type="text"
              placeholder="Enter headline here"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <textarea
              rows={10}
              placeholder="Enter content here"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            ></textarea>

            <div className="button-group">
              <button onClick={handlePredict} disabled={!canPredict}>
                {loading ? "Predicting..." : "Detect"}
              </button>
              <button onClick={handleReset}>Reset</button>
            </div>
          </div>

          {prediction && (
            <div className="result-section">
              <h2>Result</h2>
              <GaugeChart
                id="gauge-chart"
                nrOfLevels={3}
                arcsLength={[0.33, 0.33, 0.33]}
                colors={["#4caf50", "#62aeeb", "#f44336"]}
                arcWidth={0.3}
                percent={calculateNeedleValue()}
                textColor="#000"
                formatTextValue={() => renderPercentage()}
              />
              <div className="label-container">
                <span className="label left-label">Left</span>
                <span className="label center-label">Center</span>
                <span className="label right-label">Right</span>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
