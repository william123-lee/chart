# import requests
# import json

# url = "https://api.worldbank.org/v2/country/MYS/indicator/FM.LBL.BMNY.CN?format=json&date=2000:2025&per_page=1000"
# response = requests.get(url)
# data = response.json()

# # Print results
# for entry in data[1]:  # data[1] contains the actual records
#     print(f"Year: {entry['date']}, M2: {entry['value']}")

import requests

url = "https://sdmx.data.imf.org/ws/public/sdmxapi/rest/data/IFS/MY.FM.LBL.BMNY.CN.A/2000/2023"
headers = {"Accept": "application/vnd.sdmx.data+json;version=1.0.0-wd"}
response = requests.get(url, headers=headers)
print(response.json())

