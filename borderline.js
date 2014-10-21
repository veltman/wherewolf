function Boundless(collection,key) {

  if (collection.type) {

    if (collection.type === "FeatureCollection") {

      this.features = collection.features;

    } else if (collection.type === "Topology") {


      if (typeof topojson !== "undefined" && topojson.feature) {

        if (!collection.objects) {

          //throw error
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

            throw new Error("You supplied a topology with multiple objects: "+JSON.stringify(keys)+".  You need to specify which object to search.");

          }

        }

        var converted = topojson.feature(collection,collection.objects[key]);

        //In case it's one feature
        if (converted.type === "Feature") {

          this.features = [converted];

        } else {

          this.features = converted.features;

        }

      } else {

          throw new Error("You must include the TopoJSON client library (https://github.com/mbostock/topojson) if you're using a TopoJSON file.");

      }

    }

  } else if (Array.isArray(collection) && collection[0].type === "Feature") {

    this.features = collection;

  } else {

    throw new Error("No valid GeoJSON or TopoJSON supplied.");

  }

  var that = this;

  this.features = this.features.map(function(f){
    f.bbox = f.bbox || that._bounds(f);
    return f;
  });

  return this;

}

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

  //if (Array.isArray(this.searchBounds)) {
  //  search.bounds = this.searchBounds = new google.maps.LatLngBounds(
  //      new google.maps.LatLng(Math.min(this.bounds[0][1],this.bounds[1][1]),Math.min(this.bounds[0][0],this.bounds[1][0])),
  //      new google.maps.LatLng(Math.max(this.bounds[0][1],this.bounds[1][1]),Math.max(this.bounds[0][0],this.bounds[1][0]))
  //  );
  //}

  var that = this;


  this.geocoder.geocode(search,function(results, status) {

    if (status != google.maps.GeocoderStatus.OK) {
      return cb(status,null);
    }

    if (search.bounds) {
      results = results.filter(function(d){
        //fix this
        return true;
      });
    }

    if (!results.length) {
      return cb("No location found.",null);
    }

    var ll = {
      lng: results[0].geometry.location.lng(),
      lat: results[0].geometry.location.lat()
    };

    cb(null,{
      lat: ll.lat,
      lng: ll.lng,
      result: that.find([ll.lng,ll.lat])
    });

  });

};

Boundless.prototype.find = function(point) {

  for (var i = 0, l = this.features.length; i < l; i++) {

    if (this.inside(point,this.features[i])) {
      return this.features[i].properties;
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

Boundless.prototype._bounds = function(feature) {

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
