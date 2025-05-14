import requests
import feedparser # type: ignore
import certifi
from bs4 import BeautifulSoup
import os
print("Current working directory:", os.getcwd())
import pandas_ta
print(pandas_ta.__file__)


# List of RSS feed URLs
feed_urls = [
    "https://www.ecb.europa.eu/rss/press.html",  # ECB Press Releases
    "https://www.federalreserve.gov/feeds/press_all.xml",  # FRED Press
    "https://www.bankofengland.co.uk/rss/news",  # BOE News
    "https://www.bankofengland.co.uk/rss/events", # BOE Events
    "https://apps.bea.gov/rss/rss.xml", # BEA 
    "https://www.bls.gov/feed/cpi.rss", # CPI (Atom feeds)
    # "https://www.imf.org/en/News/rss"
]

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/117.0",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
}

existing_links = set()

# Step 1: Load existing links to avoid duplicates
if os.path.exists("rss_feed.txt"):
    with open("rss_feed.txt", "r", encoding="utf-8") as f:
        for line in f:
            if line.startswith("Link: "):
                existing_links.add(line.strip().replace("Link: ", ""))

# Loop through each feed URL
with open("rss_feed.txt", "a", encoding="utf-8") as file:
    
    for feed_url in feed_urls:
        print(f"Fetching feed from: {feed_url}")
        try:
            # Use requests to fetch the RSS feed with valid certs
            response = requests.get(feed_url, headers=headers, verify=certifi.where())

            # Check if the request was successful
            if response.status_code == 200:
                soup = BeautifulSoup(response.content, "xml")
                if soup.find('feed'):
                    entries = soup.find_all('entry')
                    for entry in entries:
                        title = entry.find("title").text
                        link = entry.find("link")["href"]  # Atom uses href attribute
                        pub_date = entry.find("published").text
                        if link in existing_links:
                            continue  # Skip duplicates
                        existing_links.add(link)

                        print(f"Title: {title}")
                        print(f"Published: {pub_date}")
                        print(f"Link: {link}")
                        print("---------")
                        file.write(f"Title: {title}\n")
                        file.write(f"Published: {pub_date}\n")
                        file.write(f"Link: {link}\n")
                        file.write('---------\n')            
                
                elif soup.find('rss'):
                    items = soup.find_all("item")

                    for item in items:
                        title = item.find("title").text
                        link = item.find("link").text
                        pub_date = item.find("pubDate").text
                        if link in existing_links:
                            continue  # Skip duplicates
                        existing_links.add(link)
                        file.write(f"Title: {title}\n")
                        file.write(f"Published: {pub_date}\n")
                        file.write(f"Link: {link}\n")
                        file.write('---------\n')
                        print("Title:", title)
                        print("Published:", pub_date)
                        print("Link:", link)
                        print('---------')
            else:
                print(f"Failed to fetch feed from {feed_url}. Status code: {response.status_code}")
        except Exception as e:
            print(f"Error fetching {feed_url}: {e}")
        
    file.write("\n")
    print("\n")
