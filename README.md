Wherewolf
=========

A server-less boundary service. Find what geographic feature (e.g. an election district) a given point lies in.

[Very brief example code]

[blah blah blah intro]

[examples of when we use it at WNYC]

[To locate an address instead of a lat/lng, you need to geocode it first.  see the examples.]

[including in browser]

[installing via npm]

# Dependencies

If you're using it in the browser, and your data is GeoJSON, there are no dependencies.

If you're using it in the browser, and your data is TopoJSON, include the topojson library first.

# API

## Wherewolf.add(layerName,features[,key])

Adds a set of features (GeoJSON or TopoJSON) as a layer name layerName to a Wherewolf. If features is a topology, all objects are added with their object key as the layer name unless a key is provided for a specific object to be added.

Returns the updated Wherewolf.

## Wherewolf.addAll(topology)

Adds each object in a topology as a layer to the Wherewolf. The object key is used as the layer name.

Returns the updated Wherewolf.

## Wherewolf.find(point[,options])

Returns an array with the properties of the feature in each layer that the point is found in.

Possible options are:
    'layer': get one specific layer name (default: all layers)
    'wholeFeature': return the feature itself (default: just its properties)


Example: 
If Wherewolf ww has layers ["State Senate", "State Assembly", "Borough (NYC)"], and point is in Queens,
    ww.find(point,{layer: "Borough (NYC"}) will return
    {name: 'Queens'}

    ww.find(point,{layer: "Borough (NYC)", wholeFeature: true) will return
    { type: 'Feature',
  properties: { name: 'Queens' },
  geometry: { type: 'Polygon', coordinates: [ [Object] ] },
  bbox: 
   [ [ -74.03902792005192, 40.53463332746448 ],
     [ -73.70000544788745, 40.811711305254065 ] ] }

    ww.find(point, {wholeFeature: true}) will return
    { 'State Senate': 
   { type: 'Feature',
     id: 15,
     properties: { name: 'SS16' },
     geometry: { type: 'Polygon', coordinates: [Object] },
     bbox: [ [Object], [Object] ] },
  'State Assembly': 
   { type: 'Feature',
     id: 39,
     properties: { name: 'AD40' },
     geometry: { type: 'Polygon', coordinates: [Object] },
     bbox: [ [Object], [Object] ] },
  'Borough (NYC)': 
   { type: 'Feature',
     properties: { name: 'Queens' },
     geometry: { type: 'Polygon', coordinates: [Object] },
     bbox: [ [Object], [Object] ] }}


## Wherewolf.get(layerName)
Returns the features of the layer named layerName, returns null if layerName not found.

Example: If a Wherewolf ww has layers ["State Senate", "State Assembly", "Borough (NYC)"] and we call ww.get("Borough (NYC)"), we would get:

[ { type: 'Feature',
    properties: { name: 'Staten Island' },
    geometry: { type: 'Polygon', coordinates: [Object] },
    bbox: [ [Object], [Object] ] },
  { type: 'Feature',
    properties: { name: 'Manhattan' },
    geometry: { type: 'MultiPolygon', coordinates: [Object] },
    bbox: [ [Object], [Object] ] },
  { type: 'Feature',
    properties: { name: 'Bronx' },
    geometry: { type: 'Polygon', coordinates: [Object] },
    bbox: [ [Object], [Object] ] },
  { type: 'Feature',
    properties: { name: 'Brooklyn' },
    geometry: { type: 'Polygon', coordinates: [Object] },
    bbox: [ [Object], [Object] ] },
  { type: 'Feature',
    properties: { name: 'Queens' },
    geometry: { type: 'Polygon', coordinates: [Object] },
    bbox: [ [Object], [Object] ] } ]


If we call ww.get("Neighborhoods"), we would get null because w has no layer named "Neighbohoods".

## Wherewolf.remove(layerName)

Removes layer with name layerName if it exists, returns array of remaining layer names.

Example: If a Wherewolf ww has layers ["State Senate", "State Assembly", "Borough (NYC)"], and we call ww.remove("State Senate"), we will get back ww which now has layers ["State Assembly", "Borough (NYC)"]. 

## Wherewolf.layerNames()

Returns an array of current layer names.

Example: ["State Senate", "State Assembly", "Borough (NYC)"]

=======
# Examples

* Basic
* Multiple layers
* Add all TopoJSON objects at once
* Options
* Geocode an address
* New York boundary service
* Use as a Node module

# Performance

As a stress test of performance, we tried adding all 3141 counties in the United States as a Wherewolf layer and then searching it for 5000 random nearby points.  In most instances, finding the containing feature for a point took less than a tenth of a millisecond.  In the worst case, it took about 8 milliseconds.

* **Chrome 38 (OS X, Macbook Pro):** 53ms to summon, 0.08ms to search each point
* **Safari 7.0.2 (OS X, Macbook Pro):** 11ms to summon, 0.07ms to search each point
* **Firefox 33 (OS X, Macbook Pro):** 23ms to summon, 0.07ms to search each point
* **Chrome 34 (Android 4.4.4, Nexus 5):** 53ms to summon, 0.72ms to search each point
* **IE9 (Windows 7):** 32ms to summon, 0.62ms to search each point
* **IE10 (Windows 7):** 20ms to summon, 0.54ms to search each point
* **Firefox 29 (Android 2.3.4):** 267ms to summon, 8.2ms to search each point
* **Mobile Safari (iOS 7, iPhone 5C):** 48ms to summon, 1.1ms to search each point
* **Chrome 38 (iOS 7, iPad Mini):** 53ms to summon, 1.74ms to search each point

The main performance limitation when using Wherewolf is the size of the GeoJSON or TopoJSON files you have to load in before you can search.  But you can get these files pretty small by a) converting to TopoJSON, b) removing extraneous attribute info, and c) gzipping.  Even the file of all the counties in the US is only 78k as gzipped TopoJSON, which will download in about 1.8 seconds on a 3G connection, or 73 milliseconds on a 30mbps Wifi connection.

If you have concerns about initial load time due to file size, a fancy approach would to be divide the features into subsets and only initially load a GeoJSON file with the bounding box for each subset.  For example, you could have `northwest-us.topojson`, `southwest-us.topojson`, `northeast-us.topojson`, and `southeast-us.topojson`, and `quadrants.topojson`.  Then you could do something like:

    ww.add("quadrants",quadrants);

    //When you need to search...
    var quadrant = ww.find([lng,lat],{layer:"quadrants"});

    //If they are in one of the four rectangles,
    //Load that file and search it
    //You're only loading/search 25% of the counties
    if (quadrant.name) {
      $.getJSON(quadrant.name+".topojson",function(counties){
        ww.add("counties",counties);
        var theCountyTheyAreIn = ww.find([lng,lat],{layer:"counties"});
      });
    }

In this way, you load very little data up front, but the downside is you introduce a bit of extra delay when they search.

# Fine print

* This will probably not work for a feature that crosses the North or South Pole.
* This may not work for a very special case of a point that lies right on the antimeridian being checked against a feature that crosses the antimeridian. It's unclear whether any scenario on the actual earth can cause this problem.  Don't worry, the Aleutian Islands work fine.
* [Geo data precision]

# Credits/License

By [Noah Veltman](https://twitter.com/veltman) and [Jenny Ye](https://twitter.com/thepapaya)

Special thanks to:

* [WNYC](http://www.wnyc.org/)
* [OpenNews](http://opennews.org) - this was released as part of the November 2014 OpenNews Code Convening
* [Substack](https://github.com/substack) for his [point-in-polygon module](https://github.com/substack/point-in-polygon)
* [Mike Bostock](https://github.com/mbostock) for [TopoJSON](https://github.com/mbostock/topojson)

Available under the MIT license.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.