#!/usr/bin/python

import csv
import json


# prepare country and code lookup 
countryfile = open("countries.json", "rb")
countries = json.load(countryfile)
cc = {}

for c in countries:
	cc[c["name"]["common"]] = { "code": c["cca3"], "name": c["name"]["common"], "lat": c["latlng"][0], "lon": c["latlng"][1]}
	if c["name"]["official"]  != c["name"]["common"]: 
		cc[c["name"]["official"]] =  { "code": c["cca3"], "name": c["name"]["common"], "lat": c["latlng"][0], "lon": c["latlng"][1]}
	#print c["name"]["common"], c["cca3"]


# load matrix file
inf = open("refugee-data100.json", "rb") 
d = json.load(inf)

labels = {
	"2015": 'Migrants (2015)', #  originally (in 100s)
	"2016": 'Refugees (2015)',
	"2017": 'Asylum applicants (2015)',
}


notfound = 0

# setup csv headers
country_csv = "code,name,latitude,longitude\n"
link_csv = "source,target,count,label\n"

for i in range(0,len(d["names"])):
	
	# only get countries, ignore regions
	if  cc.has_key(d["names"][i]):
		
		#add to country list
		country_csv +=  "{},{},{},{}\n".format(
				cc[d["names"][i]]["code"],
				cc[d["names"][i]]["name"].encode("utf-8"),
				cc[d["names"][i]]["lat"], 
				cc[d["names"][i]]["lon"]
		)
		
		print cc[d["names"][i]]["name"]
		
		for l in d["matrix"]:
	
			for j in range(0,len(d["names"])):
				
				# only get countries, ignore regions
				if  cc.has_key(d["names"][j]):
				
					value = d["matrix"][l][i][j]
					source = cc[d["names"][i]]["code"]
					target = cc[d["names"][j]]["code"]
					
					# originally in hundrets
					if l == "2015":
						value *= 100
					
					# ignore uselesss information
					if value > 0 and source != target:
						link_csv +=  "{},{},{},{}\n".format(
							source,
							target,
							value,
							labels[l])
						print "{},{},{},{}\n".format(
							source,
							target,
							value,
							labels[l])


print len(d["names"]), "entities"
print len(d["regions"]), "regions"
print notfound, "entities not found in country list"

outfile = open("refugee_countries.csv", "w")	
outfile.write(country_csv)
outfile.close()

outfile = open("refugee_links.csv", "w")	
outfile.write(link_csv)
outfile.close()
