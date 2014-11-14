//This parses a csv of points
//and return a csv of those points classified
//by a single-layer Wherewolf

//data from NYC Open Data Portal
//coordinates of collisions in New York City on November 7, 2014
//https://data.cityofnewyork.us/NYC-BigApps/NYPD-Motor-Vehicle-Collisions/h9gi-nx95

var Wherewolf = require("../../wherewolf.js"),
    fs = require("fs"),
    d3 = require("d3"),
    queue = require("queue-async")


var ww = Wherewolf();

queue()
	.defer(fs.readFile, "police-precincts.geojson")
	.defer(fs.readFile, "collisions.csv", "utf8")
	.await(function(err, precincts, collisions){
		
		collisions = d3.csv.parse(collisions);
		precincts = JSON.parse(precincts);
		ww.add("police", precincts);
		
		classified = [["LATITUDE", "LONGITUDE", "PRECINCT"]];
		collisions.forEach(function(d){
			classified.push([+d.LONGITUDE, +d.LATITUDE, ww.find([+d.LONGITUDE, +d.LATITUDE]).police.Precinct]);
		})

		fs.writeFile("collisions_classified.csv",classified.join("\n"),"utf8");

	});