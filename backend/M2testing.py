import wbdata # type: ignore
import pandas as pd
from datetime import datetime

# # Set the indicators you want to fetch
# indicators = {'FM.LBL.BMNY.M3.ZG': 'M2_growth'}

# # Define countries and the date range
# countries = ['USA', 'DEU', 'CHN', 'IND']  # Example countries (ISO-3166-1 alpha-2 country codes)
# start_date = datetime(2010, 1, 1)
# end_date = datetime(2020, 1, 1)

# # Fetch the data with the correct parameters
# data = wbdata.get_dataframe(indicators, country=countries, date=(start_date, end_date))

# # Print the fetched data
# print(data)


# Fetch available indicators from the World Bank API
indicators = wbdata.get_countries()
print(indicators)
