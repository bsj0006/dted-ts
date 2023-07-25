const dted = require("./../dist/dted")

test("Test synchronously reading an incorrect file", () => {
  const filePath = "./fakeFolderName"
  expect(() => dted.readDtedSync(filePath)).toThrow()
})

test("Test asynchronously reading an incorrect file", async () => {
  const filePath = "./fakeFolderName"
  let hasErr = false
  try {
    await dted.readDtedAsync(filePath)
  } catch (err) {
    hasErr = true
  }
  expect(hasErr).toBe(true)
})

test("Test synchronously reading a proper dted file", () => {
  const filePath = "./test/data/n33_w116_3arc_v2.dt1"
  const dtedTile = dted.readDtedSync(filePath)
  expect(dtedTile).not.toBeNull()

  //Expects for dsi
  expect(dtedTile.dsi).not.toBeNull()
  expect(dtedTile.dsi.securityCode).toEqual("U")
  expect(dtedTile.dsi.nimaSeriesDesignator).toEqual("DTED1")
  expect(dtedTile.dsi.dataEdition).toEqual(2)
  expect(dtedTile.dsi.mergeVersion).toEqual("A")
  expect(dtedTile.dsi.maintenanceDateStr).toEqual("0000")
  expect(dtedTile.dsi.mergeDateStr).toEqual("0000")
  expect(dtedTile.dsi.maintenanceDescription).toEqual("0000")
  expect(dtedTile.dsi.producerCode).toEqual("USCNIMA ")
  expect(dtedTile.dsi.productSpecification).toEqual("PRF89020B")
  expect(dtedTile.dsi.changeNumber).toEqual("00")
  expect(dtedTile.dsi.productSpecificationDate).toEqual("0005")
  expect(dtedTile.dsi.verticalDatum).toEqual("E96")
  expect(dtedTile.dsi.horizontalDatumCode).toEqual("WGS84")
  expect(dtedTile.dsi.digitizingCollectionSystem).toEqual("SRTM      ")
  expect(dtedTile.dsi.compilationDate).toEqual("0002")
  expect(dtedTile.dsi.originLatitudeDeg).toEqual(33)
  expect(dtedTile.dsi.originLongitudeDeg).toEqual(-116)
  expect(dtedTile.dsi.southwestLatitudeDeg).toEqual(33)
  expect(dtedTile.dsi.southwestLongitudeDeg).toEqual(-116)
  expect(dtedTile.dsi.northwestLatitudeDeg).toEqual(34)
  expect(dtedTile.dsi.northwestLongitudeDeg).toEqual(-116)
  expect(dtedTile.dsi.northeastLatitudeDeg).toEqual(34)
  expect(dtedTile.dsi.northeastLongitudeDeg).toEqual(-115)
  expect(dtedTile.dsi.southeastLatitudeDeg).toEqual(33)
  expect(dtedTile.dsi.southeastLongitudeDeg).toEqual(-115)
  expect(dtedTile.dsi.clockwiseOrientationAngle).toEqual(0)
  expect(dtedTile.dsi.latitudeIntervalSec).toEqual(3)
  expect(dtedTile.dsi.longitudeIntervalSec).toEqual(3)
  expect(dtedTile.dsi.latitudeLineCount).toEqual(1201)
  expect(dtedTile.dsi.longitudeLineCount).toEqual(1201)
  expect(dtedTile.dsi.partialCellIndicator).toEqual(0)
})

test("Test contains for coordinate outside bounds", () => {
  const filePath = "./test/data/n33_w116_3arc_v2.dt1"
  const dtedTile = dted.readDtedSync(filePath)

  expect(dtedTile.contains(32.8, -116.2)).toBe(false)
})

test("Test contains for coordinate within bounds", () => {
  const filePath = "./test/data/n33_w116_3arc_v2.dt1"
  const dtedTile = dted.readDtedSync(filePath)

  expect(dtedTile.contains(33.8, -115.2)).toBe(true)
})

test("Test contains for coordinate on bounds", () => {
  const filePath = "./test/data/n33_w116_3arc_v2.dt1"
  const dtedTile = dted.readDtedSync(filePath)

  expect(dtedTile.contains(33, -116)).toBe(true)
})

test("Test getNearestElevation for coordinate on corner", () => {
  const filePath = "./test/data/n33_w116_3arc_v2.dt1"
  const dtedTile = dted.readDtedSync(filePath)

  expect(dtedTile.getNearestElevation(33, -116)).toEqual(297)
  expect(dtedTile.getNearestElevation(34, -116)).toEqual(1361)
  expect(dtedTile.getNearestElevation(33, -115)).toEqual(158)
  expect(dtedTile.getNearestElevation(34, -115)).toEqual(371)
})

test("Test getNearestElevation for coordinate in middle", () => {
  const filePath = "./test/data/n33_w116_3arc_v2.dt1"
  const dtedTile = dted.readDtedSync(filePath)

  expect(dtedTile.getNearestElevation(33.5, -115.5)).toEqual(686)
  expect(dtedTile.getNearestElevation(33.2, -115.1)).toEqual(469)
  expect(dtedTile.getNearestElevation(33.89, -115.02)).toEqual(368)
})

test("Test getNorthLatitude", () => {
  const filePath = "./test/data/n33_w116_3arc_v2.dt1"
  const dtedTile = dted.readDtedSync(filePath)
  expect(dtedTile.getNorthLatitude()).toEqual(34)
})

test("Test getSouthLatitude", () => {
  const filePath = "./test/data/n33_w116_3arc_v2.dt1"
  const dtedTile = dted.readDtedSync(filePath)
  expect(dtedTile.getSouthLatitude()).toEqual(33)
})

test("Test getEastLatitude", () => {
  const filePath = "./test/data/n33_w116_3arc_v2.dt1"
  const dtedTile = dted.readDtedSync(filePath)
  expect(dtedTile.getEastLongitude()).toEqual(-115)
})

test("Test getWestLatitude", () => {
  const filePath = "./test/data/n33_w116_3arc_v2.dt1"
  const dtedTile = dted.readDtedSync(filePath)
  expect(dtedTile.getWestLongitude()).toEqual(-116)
})
