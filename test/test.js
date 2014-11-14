var Wherewolf = require("../wherewolf.js"),
	fs = require("fs"),
    assert = require("assert");

var ww;
var point = [-74.005363,40.726760]; //wnyc office
//options, point style, type of file

//check topojson add
fs.readFile("../examples/nyc/districts.json", "utf8", function(err, data){
	//console.log(data);
	data = JSON.parse(data);
    ww = Wherewolf();
    ww.addAll(data);

	assert.deepEqual(ww.layerNames().length, 9, ["wrong number of layers"]);
	assert.deepEqual(ww.remove("Police Precinct (NYC)").layerNames().length, 8, ["remove error"]);
	assert.deepEqual(ww.find({lat:point[1], lng:point[0]})["Borough (NYC)"].name,"Manhattan", ["find dict point error"]);
	assert.deepEqual(ww.find(point)["Borough (NYC)"].name,"Manhattan", ["find array point error"]);

	//find options
	assert.deepEqual(ww.find(point,{layer: "Borough (NYC)"}).name,"Manhattan", ["layer option search error"]);
	assert.deepEqual(ww.find(point,{wholeFeature: true})["Neighborhood (NYC)"].type, "Feature", ["whole feature search error"]);
	assert.deepEqual(ww.find(point,{wholeFeature: true, layer: "Borough (NYC)"}).type, "Feature", ["whole feature + layer search error"]);
});

//check geojson add
fs.readFile("../examples/carlsjr/carlsjr_hardees.geojson", "utf8", function(err, data){

	data = JSON.parse(data);
    ww = Wherewolf();
    ww.add("carlsjr_hardees", data, "carlsjr_hardees");


	assert.deepEqual(ww.layerNames().length, 1, ["wrong number of layers"]);
	assert.deepEqual(ww.remove("carlsjr_hardees").layerNames().length, 0, ["remove error"]);
	ww.add("carlsjr_hardees", data, "carlsjr_hardees");
	assert.deepEqual(ww.find({lat:point[1], lng:point[0]}).carlsjr_hardees.name,"neither", ["find dict point error"]);
	assert.deepEqual(ww.find(point).carlsjr_hardees.name,"neither", ["find array point error"]);

	//find options
	assert.deepEqual(ww.find(point,{layer: "carlsjr_hardees"}).name,"neither", ["layer option search error"]);
	assert.deepEqual(ww.find(point,{wholeFeature: true}).carlsjr_hardees.type, "Feature", ["whole feature search error"]);
	assert.deepEqual(ww.find(point,{wholeFeature: true, layer: "carlsjr_hardees"}).type, "Feature", ["whole feature + layer search error"]);
	
});

//check point add
fs.readFile("point.geojson", "utf8", function(err, data){

	data = JSON.parse(data);
    ww = Wherewolf();
    
    var lName = "wnycoffice";
    ww.add(lName, data, lName);

	assert.deepEqual(ww.layerNames().length, 1, ["wrong number of layers"]);
	assert.deepEqual(ww.remove(lName).layerNames().length, 0, ["remove error"]);
	ww.add(lName, data, lName);
	//console.log(ww.find({lat:point[1], lng:point[0]}));
	assert.deepEqual(ww.find({lat:point[1], lng:point[0]})[lName].name,"office", ["find dict point error"]);
	assert.deepEqual(ww.find(point)[lName].name,"office", ["find array point error"]);

	//find options
	//console.log(ww.find(point,{wholeFeature: true}));
	assert.deepEqual(ww.find(point,{layer: "wnycoffice"}).name,"office", ["layer option search error"]);
	assert.deepEqual(ww.find(point,{wholeFeature: true})[lName].type, "Feature", ["whole feature search error"]);
	assert.deepEqual(ww.find(point,{wholeFeature: true, layer: lName}).type, "Feature", ["whole feature + layer search error"]);
	
});
/*
//check linestring add DOESN'T WORK RIGHT NOW
fs.readFile("linestring.geojson", "utf8", function(err, data){

	data = JSON.parse(data);
    ww = Wherewolf();
    var point = [-73.9, 40.75]; //this point is on the line

    var lName = "nyc";
    ww.add(lName, data, lName);

	assert.deepEqual(ww.layerNames().length, 1, ["wrong number of layers"]);
	assert.deepEqual(ww.remove(lName).layerNames().length, 0, ["remove error"]);
	ww.add(lName, data, lName);
	console.log(ww.find({lat:point[1], lng:point[0]}));
	//console.log(ww.layers.nyc[0].bbox);
	/*assert.deepEqual(ww.find({lat:point[1], lng:point[0]})[lName].name,"line", ["find dict point error"]);
	assert.deepEqual(ww.find(point)[lName].name,"office", ["find array point error"]);

	//find options
	//console.log(ww.find(point,{wholeFeature: true}));
	assert.deepEqual(ww.find(point,{layer: "wnycoffice"}).name,"office", ["layer option search error"]);
	assert.deepEqual(ww.find(point,{wholeFeature: true})[lName].type, "Feature", ["whole feature search error"]);
	assert.deepEqual(ww.find(point,{wholeFeature: true, layer: lName}).type, "Feature", ["whole feature + layer search error"]);
	
});
*/
/*
assert.deepEqual(actual, expected, [message])
assert.strictEqual(actual, expected, [message])
*/
assert.throws(
  function() {
    throw new Error("Wrong value");
  },
  Error
);