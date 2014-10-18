function Boundless(collection) {

  if (collection.type) {

    if (collection.type === "FeatureCollection") {

      this.features = collection.features;

    } else if (collection.type === "Topology") {

      if (topojson && "feature" in topojson) {

        var key;

        for (var i in collection.objects) {
          key = i;
          break;
        }

        if (key) {

          this.features = topojson.feature(collection,collection.objects[key]);

          //In case it's one feature
          if (this.features.type && this.features.type === "Feature") {

            this.features = [this.features];

          }

        } else {
          //invalid topojson?
        }

      } else {
        //Missing topojson library
      }

    }

  } else if (Array.isArray(collection) && collection[0].type === "Feature") {

    this.features = collection;

  }

  var that = this;

  this.features = this.features.map(function(f){
    f.bbox = f.bbox || that.bounds(f);
    return f;
  });

  return this;

}

Boundless.prototype.find = function(point) {

  for (var i = 0, l = this.features.length; i < l; i++) {

    if (this.inside(point,this.features[i])) {
      return this.features[i].properties;
    }

  }
  return null;

}

Boundless.prototype.inside = function(point,feature) {

    if (point[0] < feature.bbox[0][0] || point[0] > feature.bbox[1][0] || point[1] < feature.bbox[0][1] || point[1] > feature.bbox[1][1]) {
      return false;
    }

    var that = this;

    var inRing = function(ring){
        return that.pip(point,ring);
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

}

Boundless.prototype.pip = function(point, vs) {

  // ray-casting algorithm based on
  // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
  // implementation from substack's point-in-polygon module
  // https://www.npmjs.org/package/point-in-polygon

  var x = point[0], y = point[1];
  
  var inside = false;
  for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
      var xi = vs[i][0], yi = vs[i][1];
      var xj = vs[j][0], yj = vs[j][1];
      
      var intersect = ((yi > y) != (yj > y))
          && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
  }
  
  return inside;

}

Boundless.prototype.bounds = function(feature) {

  //Don't check inner rings
  var outer = feature.geometry.type === "Polygon" ? [feature.geometry.coordinates[0]] : feature.geometry.coordinates.map(function(f){
    return f[0];
  });

  //For each point, extend bounds as needed
  var bounds = [[Infinity,Infinity],[-Infinity,-Infinity]]

  outer.forEach(function(polygon){

    polygon.forEach(function(point){

      bounds = [
        [
          Math.min(point[0][0],bounds[0][0]),
          Math.min(point[0][1],bounds[0][1])
        ],
        [
          Math.max(point[1][0],bounds[1][0]),
          Math.max(point[1][1],bounds[1][1])
        ]
      ];

    });

  });

  return bounds;

};