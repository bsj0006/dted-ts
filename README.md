# DTED Tile

[![npm](https://img.shields.io/npm/v/dted-tile)](https://www.npmjs.com/package/dted-tile/)

This project provides the ability to parse a DTED tile. All of the DTED data is currently read directly into memory.

## Getting Started

Install by running `npm i dted-tile`

It can then be used like this to read in elelvation data for a point.
```ts
import * as dted from "dted-tile";

var dtedTile: dted.DtedTile = dted.readDtedSync("n33_w116_3arc_v2.dt1")
var heightAboveMsl: number = dtedTile.getNearestElevation(33.211, -115.82)
```

By default, the checksum values in the dted file will be validated. To avoid this you can call `dted.readDtedSync("n33_w116_3arc_v2.dt1", {validateChecksum: false})` or `dted.readDtedAsync("n33_w116_3arc_v2.dt1", {validateChecksum: false})`

## DTED Details

The DTED format provides elevation of the terrain at a coordinate relative to Mean Sea Level (MSL).
In the example in the Getting Started section, the `getNearestElevation` call returns -71. This means that the terrain is -71 meters below 0 meters MSL. 

The DTED is normally relative to the EGM96 MSL data, but EGM2008 is probably fine for most applications.

## Similar

For a Python DTED parser, see https://github.com/bbonenfant/dted/