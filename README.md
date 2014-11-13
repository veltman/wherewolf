[Name to be determined]
=======================

A server-less boundary service. Find what geographic feature (e.g. an election district) a given point lies in.

# Benchmarks

So far, in Chrome:

## GeoJSON

* 11ms to initialize a Boundless instance from that data
* 0.008ms to locate a lat/lng

At 3G speed (750 kbps):
* 12394ms to load a 1.1mb GeoJSON file of lower 48 states
* 164ms to geocode and locate an address

At DSL speed (2 mpbs):
* 4270ms to load a 1.1mb GeoJSON file of lower 48 states
* 84ms to geocode and locate an address

On Wifi (30mpbs):
* 311ms to load a 1.1mb GeoJSON file of lower 48 states
* 56ms to geocode and locate an address

## TopoJSON

* 12ms to initialize a Boundless instance from that data
* 0.008ms to locate a lat/lng

At 3G speed (750 kbps):
* 811ms to load a 60k GeoJSON file of lower 48 states

At DSL speed (2 mpbs):
* 274ms to load a 60k TopoJSON file of lower 48 states

On Wifi (30mpbs):
* 25ms to load a 60k TopoJSON file of lower 48 states

# Credits/License

By Noah Veltman and Jenny Ye

Special thanks to:

* [WNYC](http://www.wnyc.org/)
* [OpenNews](http://opennews.org)
* [Substack](https://github.com/substack) for his [point-in-polygon module](https://github.com/substack/point-in-polygon)
* [Mike Bostock](https://github.com/mbostock) for [D3](http://d3js.org/) and [TopoJSON](https://github.com/mbostock/topojson)

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