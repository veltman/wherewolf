//Parses a CSV of points
//and return a CSV of those points
//With police precinct added
//by a single-layer Wherewolf

//data from NYC Open Data Portal
//coordinates of traffic collisions in New York City on November 7, 2014
//https://data.cityofnewyork.us/NYC-BigApps/NYPD-Motor-Vehicle-Collisions/h9gi-nx95

var Wherewolf = require("../../wherewolf.js"),
    fs = require("fs"),
    d3 = require("d3"),
    queue = require("queue-async")

//Initialize a wherewolf
var ww = Wherewolf();

//Load GeoJSON of police precincts and
//CSV of traffic collisions
queue()
  .defer(fs.readFile, "police-precincts.geojson")
  .defer(fs.readFile, "collisions.csv", "utf8")
  .await(function(err, precincts, collisions){

    rows = d3.csv.parse(collisions);
    precincts = JSON.parse(precincts);

    //Add a "police" layer to the wherewolf
    ww.add("police", precincts);

    //Add a third column to each row with the
    //police precinct number returned by wherewolf
    rows = rows.map(function(d){
      return [
        +d.LONGITUDE,
        +d.LATITUDE,
        ww.find([+d.LONGITUDE, +d.LATITUDE]).police.Precinct
      ].join(",")
    });

    //Add a header row
    rows.unshift(["LATITUDE", "LONGITUDE", "PRECINCT"].join(","));

    //Write the new CSV
    fs.writeFile("collisions-with-precincts.csv",rows.join("\n"));

  });