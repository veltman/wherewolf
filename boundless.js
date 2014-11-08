!(function(){

  var bl = function() {

    return new Boundless();

  };

  var Boundless = function() {

    this.layers = {};

    return this;

  };

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

      cb(null,that.find(lnglat),lnglat);

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

      if (!feature.geometry || (feature.bbox && !this._inBox(point,feature.bbox))) {
        return false;
      }

      var that = this;

      var inRing = function(ring){
        return that._pip(point,ring) && that._winding(point,ring);
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

    var x = point[0],
        y = point[1],
        inside = false;

    for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {

        var xi = vs[i][0], yi = vs[i][1];
        var xj = vs[j][0], yj = vs[j][1];
        
        var intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) {
          inside = !inside;
        }

    }
    
    return inside;

  };

  Boundless.prototype._inBox = function(point,box) {
    //This doesn't work for features that cross 180 degrees longitude (e.g. Alaska)
    //TODO: Make this work for spherical math
    return box && point[0] >= box[0][0] && point[0] <= box[1][0] && point[1] >= box[0][1] && point[1] <= box[1][1];
  };

  Boundless.prototype._getBBox = function(feature) {

    if (!feature.geometry) {
      return false;
    }

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

  // JS implementation of the winding number algorithm
  // Based on:
  // http://www.engr.colostate.edu/~dga/dga/papers/point_in_polygon.pdf
  // and Dan Sunday's C++ implementation:
  // http://geomalgorithms.com/a03-_inclusion.html
  Boundless.prototype._winding = function(point,vs) {

    //Is a line from v1 to v2 entirely left of point p, entirely right of it, or neither?
    //A = difference in X from v1 to v2
    //B = difference in in Y from v1 to p
    //C = difference in X from v1 to p
    //D = difference in Y from v1 to v2
    //If AB > CD, it's strictly to the left of p in the direction v1->v2
    //If AB < CD, it's strictly to the right of p in the direction v1->v2
    function dir(v1,v2,p) {
      return (v2[0] - v1[0]) * (p[1] - v1[1]) - (p[0] -  v1[0]) * (v2[1] - v1[1])
    }

    function isLeft(v1,v2,p) {
        return dir(v1,v2,p) > 0;
    }

    function isRight(v1,v2,p) {
      return dir(v1,v2,p) < 0;
    }

    var w = 0;

    //Need to compare last point connecting back to first
    if (vs[vs.length-1][0] !== vs[0][0] || vs[vs.length-1][1] !== vs[0][1]) {
      vs = vs.slice(0);
      vs.push(vs[0]);
    }

    //For each segment
    for (var i = 0, l = vs.length - 1; i < l; i++) {

      //Check upward
      if (vs[i][1] <= point[1]) {
          if (vs[i+1][1] > point[1] && isLeft(vs[i],vs[i+1],point)) {
            w++;
          }
      // Check downward
      } else if (vs[i+1][1] <= point[1] && isRight(vs[i],vs[i+1],point)) {
          w--;
      }

    }

    return w !== 0;

  };

  bl.version = "1.0.0";

  if (typeof define === "function" && define.amd) {
    define(bl);
  } else if (typeof module === "object" && module.exports) {
    var topojson = require("topojson");
    module.exports = bl;
  }

  this.Boundless = bl;

})();