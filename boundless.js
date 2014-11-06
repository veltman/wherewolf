/*
  TO DO:
    -CHOOSE A NEW NAME
    -findAddress needs to be more intuitive
    -Write good tests of performance
    -Write good, real-world examples
    -Document things
    -Create a shapefile smasher for topojson

*/

function Boundless(collection,key) {

  this.layers = {};

  return this;

}

Boundless.prototype.add = function(name,collection,key) {

  var features;

  if (collection.type) {

    if (collection.type === "FeatureCollection") {

      features = collection.features;

    } else if (collection.type === "Topology") {

      features = this._convertTopo(collection,key);

    }

  } else if (Array.isArray(collection) && collection[0].type === "Feature") {

    features = collection;

  } else {

    throw new Error("No valid GeoJSON or TopoJSON supplied.");

  }

  var that = this;

  features = features.map(function(f){
    f.bbox = f.bbox || that._getBBox(f);
    return f;
  });

  this.layers[name] = features;

  return this;

};

Boundless.prototype._convertTopo = function(collection,key) {

  var features;

  if (typeof topojson === "undefined" || !topojson.feature) {
    throw new Error("You must include the TopoJSON client library (https://github.com/mbostock/topojson) if you're using a TopoJSON file.");
  }

  if (!collection.objects) {

    throw new Error("Invalid TopoJSON.");

  }

  if (typeof key !== "string") {

    var keys = [];

    for (var k in collection.objects) {

      keys.push(k);

    }

    if (keys.length == 1) {

      key = keys[0];

    } else if (keys.length > 1) {

      throw new Error("You supplied a topology with multiple objects: "+JSON.stringify(keys)+".  You need to specify which object to add.");

    }

  } else if (!(key in collection.objects)) {

      throw new Error("The key '"+key+"' was not found in your TopoJSON object.");

  }

  var converted = topojson.feature(collection,collection.objects[key]);

  //In case it's one feature
  if (converted.type === "Feature") {

    features = [converted];

  } else {

    features = converted.features;

  }

  return features;

};

Boundless.prototype.addAll = function(topology) {

  if (topology.type && topology.type === "Topology" && topology.objects) {

    for (var key in topology.objects) {
      this.add(key,topology,key);
    }

  } else {

    throw new Error(".addAll() requires a valid TopoJSON object.");

  }

  return this;

};

Boundless.prototype.bounds = function(bounds) {

  if (!arguments.length) {
    return this._bounds || null;
  }

  function validBounds(b) {

    if (!Array.isArray(b) || b.length !== 2) {
      return false;
    }

    if (!Array.isArray(b[0]) || b[0].length !== 2) {
      return false;
    }

    if (!Array.isArray(b[1]) || b[1].length !== 2) {
      return false;
    }

    if (b[0][0] > b[1][0] || b[0][1] > b[1][1]) {
      return false;
    }

    return true;

  }

  //valid bounds
  if (validBounds(bounds)) {
    this._bounds = bounds;
    delete this._googleBounds;
  } else {
    throw new Error("Invalid bounds received.  Must be: [[min lng,min lat],[max lng,max lat]]");
  }

  return this;

};

Boundless.prototype.findAddress = function(address,cb) {

  //throw an error if google not available
  if (!this.geocoder) {
    try {
      this.geocoder = new google.maps.Geocoder();
    } catch (e) {
      throw new Error("Couldn't initialize Google geocoder. Make sure you've included the Google Maps API too (https://developers.google.com/maps/documentation/javascript/).");
    }
  }

  var search = {
    "address": address
  };

  if (this._googleBounds) {
    search.bounds = this._googleBounds;

  } else if (this._bounds) {

    console.log(this._bounds);

    search.bounds = this._googleBounds = new google.maps.LatLngBounds(
      new google.maps.LatLng(this._bounds[0][1],this._bounds[0][0]),
      new google.maps.LatLng(this._bounds[1][1],this._bounds[1][0])
    );

  }

  var that = this;

  this.geocoder.geocode(search,function(results, status) {

    if (status != google.maps.GeocoderStatus.OK) {
      return cb(status,null);
    }

    if (search.bounds) {

      results = results.filter(function(result){

        var lnglat = [result.geometry.location.lng(),result.geometry.location.lat()];

        return that._inBox(lnglat,that._bounds);

      });

    }

    if (!results.length) {
      return cb("No location found.",null);
    }

    var lnglat = [results[0].geometry.location.lng(),results[0].geometry.location.lat()];

    var found = that.find(lnglat);

    found._lng = lnglat[0];
    found._lat = lnglat[1];

    cb(null,found);

  });

};

Boundless.prototype.remove = function(layerName) {

  if (layerName in this.layers) {
    delete this.layers[layerName];
  }

  return this;
};

Boundless.prototype.layerNames = function() {

  var names = [];

  for (var key in this.layers) {
    names.push(key);
  }

  return names;

};

Boundless.prototype.find = function(point,layerName) {

  var results;

  if (layerName) {

    if (layerName in this.layers) {
      return this.findLayer(point,this.layers[layerName]);
    }

    throw new Error("Layer '"+layerName+"' not found.");

  } else {

    results = {};

    for (var key in this.layers) {
      results[key] = this.findLayer(point,this.layers[key]);
    }


  }

  return results;

};

Boundless.prototype.findLayer = function(point,layer) {

  for (var i = 0, l = layer.length; i < l; i++) {

    if (this.inside(point,layer[i])) {
      return layer[i].properties;
    }

  }

  return null;

};

Boundless.prototype.inside = function(point,feature) {

    if (feature.bbox && !this._inBox(point,feature.bbox)) {
      return false;
    }

    var that = this;

    var inRing = function(ring){
        return that._pip(point,ring);
    };

    if (feature.geometry.type === "Polygon") {
      return inRing(feature.geometry.coordinates[0]) && !feature.geometry.coordinates.slice(1).some(inRing);
    }

    for (var i = 0, l = feature.geometry.coordinates.length; i < l; i++) {
      if (inRing(feature.geometry.coordinates[i][0]) && !feature.geometry.coordinates[i].slice(1).some(inRing)) {
        return true;
      }
    }

    return false;

};

Boundless.prototype._pip = function(point, vs) {

  // ray-casting algorithm based on
  // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
  // implementation from substack's point-in-polygon module
  // https://www.npmjs.org/package/point-in-polygon

  var x = point[0], y = point[1];
  
  var inside = false;
  for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
      var xi = vs[i][0], yi = vs[i][1];
      var xj = vs[j][0], yj = vs[j][1];
      
      var intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
  }
  
  return inside;

};

Boundless.prototype._inBox = function(point,box) {
  //This doesn't work for features that cross 180 degrees longitude (e.g. Alaska)
  //TODO: Make this work for spherical math
  return point[0] >= box[0][0] && point[0] <= box[1][0] && point[1] >= box[0][1] && point[1] <= box[1][1];
};

Boundless.prototype._getBBox = function(feature) {

  //Don't check inner rings
  var outer = feature.geometry.type === "Polygon" ? [feature.geometry.coordinates[0]] : feature.geometry.coordinates.map(function(f){
    return f[0];
  });

  //For each point, extend bounds as needed
  var bounds = [[Infinity,Infinity],[-Infinity,-Infinity]];

  outer.forEach(function(polygon){

    polygon.forEach(function(point){

      bounds = [
        [
          Math.min(point[0],bounds[0][0]),
          Math.min(point[1],bounds[0][1])
        ],
        [
          Math.max(point[0],bounds[1][0]),
          Math.max(point[1],bounds[1][1])
        ]
      ];

    });

  });

  return bounds;

};