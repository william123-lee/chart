const express = require("express");
const axios = require("axios");
const path = require('path');
const cors = require("cors");
// const cron = require('node-cron');
const fs = require('fs');
require('dotenv').config({path: 'C:/Users/User/Desktop/chart/.gitignore/.env'});
const app = express();
const PORT = 3000; //can change this port if needed
const fetch = require("node-fetch");

// Enable CORS for frontend requests
// const allowedOrigins = ["http://localhost:5500", "http://localhost:8080"]; // Update with your frontend URLs
app.use(cors());

const fredApi = process.env.FRED_API_KEY;
const newsApi = process.env.NEWS_API_KEY;
const santApi = process.env.SANTIMENT_API_KEY;
// const API_KEY = "545181ae8a26a8888112b1510ad9f501"; // Replace with your FRED API key

// app.get('/', (req, res) => {
//     res.send('Backend is running 🚀');
//   });
  
app.use(express.static(path.join(__dirname, '..')));  // Go up one level to the root folder

// Handle the root route and serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));  // Go up one level to the root folder
});

app.get("/twitter-post", async (req, res) => {
    const BEARER_TOKEN = 'AAAAAAAAAAAAAAAAAAAAAPACzwEAAAAAtatoNdMsHYKqdPnVpaRfXb4S6iU%3D2n2qvtgHNTcIwVh1PpRoyQy6hreVBPR0NDvhGwq93KsPEo6YtJ';  
    const tweetId = '1904000755381760058';

    const url = `https://api.twitter.com/2/tweets/${tweetId}?expansions=author_id&tweet.fields=created_at&user.fields=username,profile_image_url`;

    try {
        const response = await axios.get(url, {
            headers: {
                "Authorization": `Bearer ${BEARER_TOKEN}`
            }
        });

        const tweet = response.data.data;
        const user = response.data.includes.users[0];

        res.json({
            profile: user.profile_image_url,
            username: user.username,
            text: tweet.text,
            timestamp: tweet.created_at
        });
    } catch (error) {
        console.error("Error fetching tweet:", error);
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Response data:", error.response.data);
        }
        res.status(500).json({ error: "Failed to fetch tweet" });
    }
});


app.get("/m2-data", async (req, res) => {
    try {
        const API_URL = `https://api.stlouisfed.org/fred/series/observations?series_id=M2SL&api_key=${fredApi}&file_type=json&observation_start=2022-07-01&observation_end=2025-04-01`;
        const response = await axios.get(API_URL);
        res.json(response.data); // Send the API response to the frontend
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch M2 data" });
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Response data:", error.response.data);
        }
    }
});

// app.get("/mvrv", async(req, res)=>{
//     const response = await axios.get("https://api.cryptoquant.com/v1/btc/market-indicator/mvrv?window=day&from=20191001&limit=2")
//     const mvrv = response.data
// })

app.get("/mvrv-data", async(req, res)=>{
    const query = 
        `{
            getMetric(metric: "mvrv_usd") {
            timeseriesData(
                slug: "bitcoin"
                from: "2024-01-01T00:00:00Z"
                to: "2025-04-01T00:00:00Z"
                interval: "1d"
            ) {
                datetime
                value
            }
            }
        }`

        try {
            const response = await axios.post(
                "https://api.santiment.net/graphql",
                {query},
                { headers: { "Authorization": `Apikey ${santApi}`,  "Content-Type": "application/json" } }
            );
    
            console.log("Santiment API Response:", response.data);
    
            // Extract response data safely
            const responseData = response.data.data || {};

           
    
            res.json({
                responseData
            });
        } catch (error) {
            console.error("Error fetching data from Santiment:", error);
            res.status(500).json({ error: `Failed to fetch data: ${error.message}` });
        }
      
})

//fetch historical news and its called in frontend
app.get('/news-data-old', (req, res) => {
    const filePath  = path.join(__dirname, 'news', 'news_data.json');
    console.log("📂 Looking for file at:", filePath);

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Failed to read file:', err);
            return res.status(500).send('Error reading file');
        }

        try {
            const json = JSON.parse(data);
            console.log(json);
            const articles = json.data1?.articles || [];
            console.log(articles)
            res.json(articles); // return just the articles array
        } catch (parseErr) {
            console.error('JSON parsing error:', parseErr);
            res.status(500).send('JSON parse error');
        }
    });
});

const FILE_PATH = path.join(__dirname, 'news', 'news_data.json');
//need call manually for now to fetch recent news
app.get("/update-news", async (req, res) => {
    try {
        // 📰 Fetch latest news
        const API_URL = `https://newsapi.org/v2/everything?q=bitcoin&sortBy=publishedAt&apiKey=${newsApi}`;
        const apiResponse = await axios.get(API_URL);
        const newArticles = apiResponse.data.articles || [];
        console.log(newArticles.length);
        // 📄 Load existing data
        let existingData = {};
        if (fs.existsSync(FILE_PATH)) {
            const fileContent = fs.readFileSync(FILE_PATH, 'utf8');
            existingData = JSON.parse(fileContent);
        } else {
            existingData = {
                data1: { status: "ok", totalResults: 0, articles: [] },
                data2: { status: "ok", totalResults: 0, articles: [] },
                data3: { status: "ok", totalResults: 0, articles: [] }
            };
        }
        // const totalArticles = existingData.data1.articles.length + existingData.data2.articles.length + existingData.data3.articles.length;
        // console.log(existingData.data1.articles.length);
        // console.log(existingData.data2.articles.length);


        // Merge and deduplicate by `url`
        const allArticles = [
            ...existingData.data1.articles,
            ...existingData.data2.articles,
            ...existingData.data3.articles,
            ...newArticles
        ];
        const uniqueArticles = Array.from(
            new Map(allArticles.map(article => [article.url, article])).values()
        );

        // 💾 Update file
        existingData.data1.articles = uniqueArticles;
        existingData.data1.totalResults = uniqueArticles.length;
        fs.writeFileSync(FILE_PATH, JSON.stringify(existingData, null, 2));

        res.json({ message: "News updated successfully", count: uniqueArticles.length });
    } catch (error) {
        console.error("🔥 Error updating news:", error.message);
        res.status(500).json({ error: "Failed to fetch or write news" });
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
//no use for now
app.get("/fetch-news", async (req, res) => {
    try {
        const API_URL = `https://newsapi.org/v2/everything?q=bitcoin&from=2025-03-20&to=2025-03-31&sortBy=publishedAt&apiKey=${newsApi}`;
        const response = await axios.get(API_URL); // ✅ Use API_URL here
        res.json(response.data);
    } catch (error) {
        console.error("Error fetching news:", error.message); // ✅ Log the actual error
        res.status(500).json({ error: "Error fetching data" });
    }
});

// trying for frontend; delete later;
app.get('/fetch-news1', async (req, res) => {
    console.log("Received fetch-news1 request");
    const today = new Date().toISOString().split('T')[0];
    const historyPath = path.join(__dirname, 'public', 'data', 'news_data.json');
    // console.log(fredApi);
    try {
        const API_URL = `https://newsapi.org/v2/everything?q=bitcoin&sortBy=publishedAt&apiKey=${newsApi}`;
        const response = await axios.get(API_URL);
        const newArticles = response.data.articles || [];

        console.log("Number of articles:", response.data.articles?.length || 0);   
        // Load existing articles
        let existingArticles = [];
        if (fs.existsSync(historyPath)) {
            const raw = fs.readFileSync(historyPath);
            existingArticles = JSON.parse(raw).articles || [];
        }

        // Merge and deduplicate
        const combined = [...newArticles, ...existingArticles];
        const unique = Array.from(new Map(combined.map(item => [item.url, item])).values());

        const finalData = {
            status: "ok",
            totalResults: unique.length,
            articles: unique
        };

        fs.writeFileSync(historyPath, JSON.stringify(finalData, null, 2));

        console.log(`✅ News appended to news_data.json (${unique.length} total articles)`);
        res.json(finalData);
    } catch (error) {
        console.error("❌ Fetch error:", error.message);
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Response data:", error.response.data);
        }
        res.status(500).json({ error: "Failed to fetch news" });
    }
});
//


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
 


app.listen(PORT, '0.0.0.0', () => console.log(`✅ Proxy server running on http://localhost:${PORT}`));
