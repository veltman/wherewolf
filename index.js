var boundless = require("./boundless.js"),
    fs = require("fs"),
    topojson = require("topojson");

var bl = boundless();

var bl2 = boundless();

var geo = JSON.parse(fs.readFileSync("lower48-with-holes.geojson",{encoding:"utf8"}));

bl.add("state",geo);

console.log(bl.find([-75,40]));