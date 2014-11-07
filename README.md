Boundless.js
============

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