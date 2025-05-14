from flask import Flask, jsonify
from flask_cors import CORS # type: ignore
import pandas as pd
import pandas_ta as ta
import os

app = Flask(__name__)
CORS(app)
@app.route('/supertrend')
def get_supertrend_daily():
    # Sample OHLCV DataFrame
    df = pd.read_csv(r'C:\Users\User\Desktop\chart\backend\ohlcv.csv')  

    # Calculate Supertrend with period=10 and multiplier=3
    supertrend = ta.supertrend(high=df['high'], low=df['low'], close=df['close'], length=10, multiplier=3)

    # Append to original DataFrame
    df = pd.concat([df, supertrend], axis=1)
    result = df[['timestamp', 'SUPERT_10_3.0', 'SUPERTd_10_3.0']].dropna()
    
     # Rename and clean for frontend
    # df['time'] = pd.to_datetime(df['date']).astype(int) // 10**9  # Unix timestamp
    # result = df[['time', 'SUPERT_10_3.0']]  # Adjust column name if different

    return jsonify(result.to_dict(orient='records'))

@app.route('/supertrend4h')
def get_supertrend_4h():
    # Sample OHLCV DataFrame
    df = pd.read_csv(r'C:\Users\User\Desktop\chart\backend\4hr.csv')  

    # Calculate Supertrend with period=10 and multiplier=3
    supertrend = ta.supertrend(high=df['high'], low=df['low'], close=df['close'], length=10, multiplier=3)

    # Append to original DataFrame
    df = pd.concat([df, supertrend], axis=1)
    result = df[['timestamp', 'SUPERT_10_3.0', 'SUPERTd_10_3.0']].dropna()
    
     # Rename and clean for frontend
    # df['time'] = pd.to_datetime(df['date']).astype(int) // 10**9  # Unix timestamp
    # result = df[['time', 'SUPERT_10_3.0']]  # Adjust column name if different

    return jsonify(result.to_dict(orient='records'))

@app.route('/supertrend1w')
def get_supertrend_weekly():
    # Sample OHLCV DataFrame
    df = pd.read_csv(r'C:\Users\User\Desktop\chart\backend\weekly.csv')  

    # Calculate Supertrend with period=10 and multiplier=3
    supertrend = ta.supertrend(high=df['high'], low=df['low'], close=df['close'], length=10, multiplier=3)

    # Append to original DataFrame
    df = pd.concat([df, supertrend], axis=1)
    result = df[['timestamp', 'SUPERT_10_3.0', 'SUPERTd_10_3.0']].dropna()
    
     # Rename and clean for frontend
    # df['time'] = pd.to_datetime(df['date']).astype(int) // 10**9  # Unix timestamp
    # result = df[['time', 'SUPERT_10_3.0']]  # Adjust column name if different

    return jsonify(result.to_dict(orient='records'))

@app.route('/off-news')
def get_news():
    news_items = []
    try:
        with open("rss_feed.txt", "r", encoding="utf-8") as file:
            item = {}
            for line in file:
                line = line.strip()
                if line.startswith("Title:"):
                    item["title"] = line.replace("Title: ", "")
                elif line.startswith("Published:"):
                    item["published"] = line.replace("Published: ", "")
                elif line.startswith("Link:"):
                    item["link"] = line.replace("Link: ", "")
                elif line == "---------":
                    if item:
                        news_items.append(item)
                        item = {}
    except FileNotFoundError:
        return jsonify({"error": "rss_feed.txt not found"}), 404

    return jsonify(news_items)

# Result includes columns like:
# - SUPERT_10_3.0 (Supertrend value)
# - SUPERTd_10_3.0 (Direction: 1 for uptrend, -1 for downtrend)
# print(df.tail(12))

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=True)