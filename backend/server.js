const express = require("express");
const axios = require("axios");
const cors = require("cors");
require('dotenv').config();
const app = express();
const PORT = 3000; // You can change this port if needed

// Enable CORS for frontend requests
// const allowedOrigins = ["http://localhost:5500", "http://localhost:8080"]; // Update with your frontend URLs
app.use(cors());

const fredApi = process.env.FRED_API_KEY;
const newsApi = process.env.NEWS_API_KEY;
const santApi = process.env.SANTIMENT_API_KEY;
// const API_KEY = "545181ae8a26a8888112b1510ad9f501"; // Replace with your FRED API key


app.get("/m2-data", async (req, res) => {
    try {
        const API_URL = `https://api.stlouisfed.org/fred/series/observations?series_id=M2SL&api_key=${fredApi}&file_type=json&observation_start=2022-07-01&observation_end=2025-03-31`;
        const response = await axios.get(API_URL);
        res.json(response.data); // Send the API response to the frontend
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch M2 data" });
    }
});

app.get("/event-data", async (req, res) => {
    try {
        const API_URL = `https://api.stlouisfed.org/fred/series/observations?series_id=FEDFUNDS&api_key=${fredApi}&file_type=json&observation_start=2022-01-01&observation_end=2025-03-31`;
        const response = await axios.get(API_URL);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch event data" });
    }
});

app.get("/fetch-news", async (req, res) => {
    try {
        const API_URL = `https://newsapi.org/v2/everything?q=bitcoin&from=2025-04-01&to=2025-04-08&sortBy=publishedAt&apiKey=${newsApi}`;
        const response = await axios.get(API_URL); // ✅ Use API_URL here
        res.json(response.data);
    } catch (error) {
        console.error("Error fetching news:", error.message); // ✅ Log the actual error
        res.status(500).json({ error: "Error fetching data" });
    }
});

app.get("/sentiment-data", async (req, res) => {
    // const SANTIMENT_API_KEY = "6fdlc6f4hwya2nwd_26gzzhxicqf3yt6j";
    const query = {
        "query": `
            {
                getMetric(metric: "sentiment_positive_total") {
                    timeseriesData(
                    slug: "bitcoin", 
                    from: "2024-04-02T00:00:00Z", 
                    to: "2025-03-03T00:00:00Z", 
                    aggregation: MAX
                ) {
                    datetime
                    value
                    }
                }

                
            }

        `
    };

    try {
        const response = await axios.post(
            "https://api.santiment.net/graphql",
            query,
            { headers: { "Authorization": `Apikey ${santApi}` } }
        );

        console.log("Santiment API Response:", response.data);

        // Extract response data safely
        const responseData = response.data.data || {};
        
        // const socialVolume = responseData.getMetric?.timeseriesData || [];
        // const sentimentPositive = responseData.getMetric?.timeseriesData || [];
        const sentimentNegative = responseData.getMetric?.timeseriesData || [];

        res.json({
            // social_volume: socialVolume,
            // sentiment_positive: sentimentPositive,
            sentiment_negative: sentimentNegative
        });
    } catch (error) {
        console.error("Error fetching data from Santiment:", error);
        res.status(500).json({ error: `Failed to fetch data: ${error.message}` });
    }
});

app.get("/truf-news", async (req, res) => {
    try {
        // Truflation API request
        const truflationResponse = await axios.get('https://api.truflation.com/data', {
            headers: {
                'Authorization': 'Bearer stf37ad83c0b92c7419925b7633c0e62',  // Your Bearer token
            },
        });


        // Send both Truflation and News API data in the response
        res.json(truflationResponse.data);

    } catch (error) {
        console.error("Error fetching data:", error.message); // Log the error message
        res.status(500).json({ error: "Error fetching data" }); // Return error response
    }
});


app.listen(PORT, () => console.log(`✅ Proxy server running on http://localhost:${PORT}`));
