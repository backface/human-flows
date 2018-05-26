#!/usr/bin/python

import csv
import json
import math

generateCountryFile = True
generateFlowsFile = True

datafile = open("raw_data.csv", "rb") 
countryfile = open("countries.json", "rb")
countries = json.load(countryfile)

if generateCountryFile:
	# generate countries.csv
	objout = []
	csvout = "code,name,latitude,longitude\n"

	for i in range(len(countries)):
		objout.append ( {
			"name":countries[i]["name"]["common"], 
			"code":countries[i]["cca3"], 
			"lat": countries[i]["latlng"][0], 
			"lon": countries[i]["latlng"][1]
		})
		csvout +=  "{},{},{},{}\n".format(
				countries[i]["cca3"],
				countries[i]["name"]["common"].encode("utf-8"),
				countries[i]["latlng"][0], 
				countries[i]["latlng"][1]
		)
		
	#outfile = open("mycountries.json", "w")	
	#json.dump(objout, outfile, indent=2)
	#outfile.close()

	outfile = open("countries.csv", "w")	
	outfile.write(csvout)
	outfile.close()

	

if generateFlowsFile:
	#generate migrations

	reader = csv.reader(datafile, delimiter = ",")
	links = [ 
		{
			"period": "1990-1995",
			"links": [],
		},
		{
			"period": "1995-2000",
			"links": [],
		},
		{
			"period": "2000-2005",
			"links": [],
		},
		{
			"period": "2005-2010",
			"links": [],
		}

	]
	lines = 0
	csvout = "source,target,count,label\n"

	print reader.next()
	#sortedlist = sorted(reader, key=lambda row: int(row[15]), reverse=True)
	sortedlist = reader

	for row in sortedlist:
		if lines != 0:
			if int(row[15]) > 0:
				links[0]["links"].append({ 
					"source": row[5],
					"target": row[7],
					"count": int(row[12])
				})
				links[1]["links"].append({ 
					"source": row[5],
					"target": row[7],
					"count": int(row[13])
				})
				links[2]["links"].append({ 
					"source": row[5],
					"target": row[7],
					"count": int(row[14])
				})
				links[3]["links"].append({ 
					"source": row[5],
					"target": row[7],
					"count": int(row[15])
				})			
				csvout += row[5] + "," + row[7] + "," + row[15] + "," + "2005-2010" + "\n" 
				csvout += row[5] + "," + row[7] + "," + row[14] + "," + "2000-2005" + "\n" 
				csvout += row[5] + "," + row[7] + "," + row[13] + "," + "1995-2000" + "\n" 
				csvout += row[5] + "," + row[7] + "," + row[12] + "," + "1990-1995" + "\n" 

				
		lines += 1

	#outfile = open("links.json", "w")	
	#json.dump(links, outfile, indent=2)
	#outfile.close()

	outfile = open("links.csv", "w")	
	outfile.write(csvout)
	outfile.close()



