import os
from datetime import datetime
import csv
import json
#loop through all files. have a years table with each year and the total number of animals spotted that year
#next table will be each year, and how many of each species was spotted for that year.
#get years by looping thorugh each table, and for each row, finding the year that instance was found.
#if year is in table, increment. if not, year[year] = 1
#while doing this, for layers:
#if year in layers:
#   if layers[year][speciesname] in layers:
#       layers[year][speciesname] += 1
#    else:
#       layers[year][speciesname] = 1
#else:
#   layers[year] = {speciesname: 1}

years = {}
#structure: {Year: xxxx, Total-Spotted: 11111}
layers = {}
#structure:
'''
{xxxx:{
species1: xxxx,
species2: xxxx,
species3: xxxx}
...
and so on
}
'''

fulldata = {"years": [], "layers": []}

full_path = "/Users/MonotoneCat/Desktop/CS4460/final/4460Smoky/data/biodiversityWormDataYears.json"
if os.path.isfile(full_path):
    with open(full_path, 'r') as fileObject:
        data = json.load(fileObject)
        for year in data:
              fulldata["years"].append({"Year": int(year), "Total Animals Spotted": data[year]})

full_path = "/Users/MonotoneCat/Desktop/CS4460/final/4460Smoky/data/biodiversityWormData.json"
if os.path.isfile(full_path):
    with open(full_path, 'r') as fileObject:
        data = json.load(fileObject)
        for year in data:
            temp = {}
            temp["Year"] = int(year)
            for species in data[year]:
                temp[species] = data[year][species]
            fulldata["layers"].append(temp)
            






with open("/Users/MonotoneCat/Desktop/CS4460/final/4460Smoky/data/biodiversityWormDataFinal.json", "w") as f:
        json.dump(fulldata, f, **{"indent": 4})






