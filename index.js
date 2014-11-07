var boundless = require("./boundless.js"),
    fs = require("fs"),
    topojson = require("topojson");

var bl = boundless();

var bl2 = boundless();

var geo = JSON.parse(fs.readFileSync("lower48-with-holes.geojson",{encoding:"utf8"}));
var zips = JSON.parse(fs.readFileSync("zip-codes.topojson",{encoding:"utf8"}))

bl.add("zips",zips);

console.log(bl.find([-75,40]));