var Wherewolf = require("../../wherewolf.js"),
    fs = require("fs"),
    topojson = require("topojson");

var ww = Wherewolf();

var geo = JSON.parse(fs.readFileSync("lower48-with-holes.geojson",{encoding:"utf8"}));

ww.add("state",geo);

console.log(ww.find([-75,40]));
console.log(ww.find({
	"lng":-75,
	"lat":40
}));