import { strict as assert } from 'assert';
import * as fs from 'fs'
import * as fsPromises from 'node:fs/promises';

const DTED_VOID: number = -32767
const UHL_LENGTH = 80
const DSI_LENGTH = 648
const ACC_LENGTH = 2700
const UHL_OFFSET = 0
const DSI_OFFSET = UHL_LENGTH
const ACC_OFFSET = UHL_LENGTH + DSI_LENGTH
const DATA_RECORD_OFFSET = UHL_LENGTH + DSI_LENGTH + ACC_LENGTH

/**
 * 80 bytes at the start of the DTED file
 */
class UserHeaderLabel {
    //Should be UHL
    sentinel: string;
    // DDDMMSSH
    originLongitudeDeg: number 
    // DDDMMSSH
    originLatitudeDeg: number
    //tenths of seconds
    longitudeInterval: number
    //tenths of seconds
    latitudeInterval: number
    absoluteVerticalAccuracyStr?: number = undefined
    securityCode: string //It better be unclassified
    urn: string
    longitudeLineCount: number
    latitudeLineCount: number
    hasMultipleAccuracy: boolean

    constructor(uhlStr: string) {
        assert(uhlStr.length === 80)
        assert(uhlStr.slice(0, 3) === "UHL")
        this.originLongitudeDeg = parseDDDMMSSH(uhlStr, 4)
        this.originLatitudeDeg = parseDDDMMSSH(uhlStr, 12)
        this.longitudeInterval = parseInt(uhlStr.slice(20, 24))
        this.latitudeInterval = parseInt(uhlStr.slice(24, 28))
        this.absoluteVerticalAccuracyStr = parseIntOrNa(uhlStr.slice(28, 32))
        this.securityCode = uhlStr.slice(32, 35).trim()
        assert(this.securityCode === "U", "This software should not be used with classified data.")

        this.urn = uhlStr.slice(35, 47)
        this.longitudeLineCount = parseInt(uhlStr.slice(47, 51))
        this.latitudeLineCount = parseInt(uhlStr.slice(51, 55))
        this.hasMultipleAccuracy = uhlStr.slice(55, 56) === "1"
    }
}

/**
 * 648 bytes after the UHL.
 */
class DataSetIdentifictionRecord {
    securityCode: string
    nimaSeriesDesignator: string
    dataEdition: number
    mergeVersion: string
    maintenanceDateStr: string
    mergeDateStr: string
    maintenanceDescription: string
    producerCode: string
    productSpecification: string
    changeNumber: string
    productSpecificationDate: string
    verticalDatum: string
    horizontalDatumCode: string
    digitizingCollectionSystem: string
    compilationDate: string
    originLatitudeDeg: number
    originLongitudeDeg: number
    southwestLatitudeDeg: number
    southwestLongitudeDeg: number
    northwestLatitudeDeg: number
    northwestLongitudeDeg: number
    northeastLatitudeDeg: number
    northeastLongitudeDeg: number
    southeastLatitudeDeg: number
    southeastLongitudeDeg: number
    clockwiseOrientationAngle: number
    latitudeIntervalSec: number
    longitudeIntervalSec: number
    latitudeLineCount: number
    longitudeLineCount: number
    partialCellIndicator: number

    constructor(dsiStr: string) {
        assert(dsiStr.length === 648, "DSI has incorrect length")
        assert(dsiStr.slice(0, 3) === "DSI", "DSI has incorrect sentinel")

        this.securityCode = dsiStr.slice(3,4)

        this.nimaSeriesDesignator = dsiStr.slice(59, 64)
        this.dataEdition = parseInt(dsiStr.slice(87, 89))
        this.mergeVersion = dsiStr.slice(89, 90)
        this.maintenanceDateStr = dsiStr.slice(90, 94)
        this.mergeDateStr = dsiStr.slice(94, 98)
        this.maintenanceDescription = dsiStr.slice(98, 102)
        this.producerCode = dsiStr.slice(102, 110)
        this.productSpecification = dsiStr.slice(126, 135)
        this.changeNumber = dsiStr.slice(135, 137)
        this.productSpecificationDate = dsiStr.slice(137, 141)
        this.verticalDatum = dsiStr.slice(141, 144)
        this.horizontalDatumCode = dsiStr.slice(144, 149)
        this.digitizingCollectionSystem = dsiStr.slice(149, 159)
        this.compilationDate = dsiStr.slice(159, 163)
        this.originLatitudeDeg = parseDDMMSS_SH(dsiStr, 185)
        this.originLongitudeDeg = parseDDDMMSS_SH(dsiStr, 194)
        this.southwestLatitudeDeg = parseDDMMSSH(dsiStr, 204);
        this.southwestLongitudeDeg = parseDDDMMSSH(dsiStr, 211);
        this.northwestLatitudeDeg = parseDDMMSSH(dsiStr, 219)
        this.northwestLongitudeDeg = parseDDDMMSSH(dsiStr, 226)
        this.northeastLatitudeDeg = parseDDMMSSH(dsiStr, 234)
        this.northeastLongitudeDeg = parseDDDMMSSH(dsiStr, 241)
        this.southeastLatitudeDeg = parseDDMMSSH(dsiStr, 249)
        this.southeastLongitudeDeg = parseDDDMMSSH(dsiStr, 256)
        this.clockwiseOrientationAngle = parseInt(dsiStr.slice(264, 267)) + 
            (parseInt(dsiStr.slice(267, 269)) / 60) + 
            (parseInt(dsiStr.slice(269, 273)) / 3600)
        this.latitudeIntervalSec = parseInt(dsiStr.slice(273, 277)) / 10
        this.longitudeIntervalSec = parseInt(dsiStr.slice(277, 281)) / 10
        this.latitudeLineCount = parseInt(dsiStr.slice(281, 285))
        this.longitudeLineCount = parseInt(dsiStr.slice(285, 289))
        this.partialCellIndicator = parseInt(dsiStr.slice(289, 291))
    }
}

/**
 * 2700 bytes after the DSI
 */
class AccuracyDescriptionRecord {
    absoluteHorizontalAccuracyMeters?: number = undefined
    absoluteVerticalAccuracyMeters?: number = undefined
    relativeHorizontalAccuracyMeters?: number = undefined
    relativeVerticalAccuracyMeters?: number = undefined
    multipleAccuracyOutlineFlag: number
    subregions: Array<AccuracySubregionDescription> = []

    constructor(accStr: string) {
        assert(accStr.length === 2700)
        assert(accStr.slice(0, 3) === "ACC")

        this.absoluteHorizontalAccuracyMeters = parseIntOrNa(accStr.slice(3, 7))
        this.absoluteVerticalAccuracyMeters = parseIntOrNa(accStr.slice(7, 11))
        this.relativeHorizontalAccuracyMeters = parseIntOrNa(accStr.slice(11, 15))
        this.relativeVerticalAccuracyMeters = parseIntOrNa(accStr.slice(15, 19))
        this.multipleAccuracyOutlineFlag = parseInt(accStr.slice(55, 57))
        assert(this.multipleAccuracyOutlineFlag == 0 || (this.multipleAccuracyOutlineFlag >= 2 && this.multipleAccuracyOutlineFlag <= 9))

        let subregionOffset: number = 57
        for(let i = 0; i < this.multipleAccuracyOutlineFlag; i++) {
            const subStr: string = accStr.slice(subregionOffset, 248)
            const pair: AccuracySubregionDescription = new AccuracySubregionDescription(subStr)
            this.subregions.push(pair)
            subregionOffset += 248
        }
    }
}

class AccuracySubregionDescription {
    absoluteHorizontalAccuracyMeters?: number
    absoluteVerticalAccuracyMeters?: number
    relativeHorizontalAccuracyMeters?: number
    relativeVerticalAccuracyMeters?: number
    coordinateCount: number
    coordinatPairDescriptions: Array<CoordinatePairDescription> = []

    constructor(subStr: string) {
        assert(subStr.length === 284)
        this.absoluteHorizontalAccuracyMeters = parseIntOrNa(subStr.slice(0, 4))
        this.absoluteVerticalAccuracyMeters = parseIntOrNa(subStr.slice(4, 8))
        this.relativeHorizontalAccuracyMeters = parseIntOrNa(subStr.slice(8, 12))
        this.relativeVerticalAccuracyMeters = parseIntOrNa(subStr.slice(12, 16))
        this.coordinateCount = parseInt(subStr.slice(16, 18))

        assert(this.coordinateCount >= 3 && this.coordinateCount  <= 14)

        let coordinatePairOffset: number = 18
        for(let i = 0; i < this.coordinateCount; i++) {
            const pairStr: string = subStr.slice(coordinatePairOffset, 19)
            const pair: CoordinatePairDescription = new CoordinatePairDescription(pairStr)
            this.coordinatPairDescriptions.push(pair)
            coordinatePairOffset += 19
        }
    }
}

class CoordinatePairDescription {
    latitude: number
    longitude: number

    constructor(pairStr: string) {
        assert(pairStr.length === 19)

        this.latitude = parseDDMMSS_SH(pairStr, 0)
        this.longitude = parseDDDMMSS_SH(pairStr, 9)
    }
}

/**
 * A set of elevations and a 4 byte checksum. The elevations within a data record have the same longitude. 
 * The first elevation is the southernmost. The last elevation is the northernmost. The data records are
 * arranged by ascending (west to east) longitude.
 * 
 * "Elevations are two-byte integers, high order first, and negatives are
 * signed magnitude. Users may have to swap the bytes and/or convert negatives
 * to the complement they use. This can be done by putting the low order byte
 * first, then turning off bit 15 (the high order bit), then multiplying by -1.
 * For positive numbers, only the bytes are switched."
 */
class DataRecord {
    private data: Uint8Array

    constructor (record: Uint8Array) {
        assert(record[0] === 0o252, "Data record has incorrect starting value. Expected 170. Received " + record[0])
        this.data = record
    }

    public getElevation(index: number):  number {
        if(index < 0) {
            throw new Error("Expected non-negative index for retrieving elevation");  
        }
        if(index >= (this.data.length - 12)/2) {
            throw new Error("Requesting elevation at too large of index: " + index);  
        }
        index = (index * 2) + 8
        return fromSignedMagnitude(this.data.slice(index, index+2))
    }

    public validateChecksum() {
        let calculatedChecksum: number = 0
        let i = 0
        for(; i < this.data.length - 4; i++) {
            calculatedChecksum += this.data[i]
        }
        let expectedChecksum = (this.data[i] << 24) | (this.data[i+1] << 16) | (this.data[i+2] << 8) | this.data[i+3]
        return calculatedChecksum === expectedChecksum
    }
}

class DtedTile {
    filePath: string
    uhl: UserHeaderLabel
    dsi: DataSetIdentifictionRecord
    acc: AccuracyDescriptionRecord
    records: Array<DataRecord>
    constructor(fileBuffer: Buffer) {
        assert(fileBuffer.length > DATA_RECORD_OFFSET, "Not enough bytes to read DTED data. Incorrect file length.")
        
        this.uhl = new UserHeaderLabel(fileBuffer.toString('ascii', UHL_OFFSET, UHL_LENGTH))
        this.dsi = new DataSetIdentifictionRecord(fileBuffer.toString('ascii', DSI_OFFSET, DSI_OFFSET + DSI_LENGTH))
        this.acc = new AccuracyDescriptionRecord(fileBuffer.toString('ascii', ACC_OFFSET, ACC_OFFSET + ACC_LENGTH))
        this.records = []

        let dataRecordLength = 12 + (this.dsi.latitudeLineCount * 2)
        let dataRecordsTotalLength = dataRecordLength * this.dsi.longitudeLineCount

        const expectedLength = DATA_RECORD_OFFSET + dataRecordsTotalLength
        assert(fileBuffer.length == expectedLength, "Expected file to be " + expectedLength + " bytes")

        for (var i = 0; i < this.dsi.longitudeLineCount; i++) {
            let recordStart = DATA_RECORD_OFFSET + (i * dataRecordLength)
            this.records.push(new DataRecord(fileBuffer.subarray(recordStart, recordStart + dataRecordLength)))
        }

        //Verify hashes of dted file
        this.records.forEach(record => assert(record.validateChecksum(), "Expected DTED data to pass checksum"))
    }

    public getNorthLatitude() : number {
        return this.dsi.northeastLatitudeDeg
    }

    public getSouthLatitude() : number {
        return this.dsi.southwestLatitudeDeg
    }

    public getEastLongitude() : number {
        return this.dsi.northeastLongitudeDeg
    }

    public getWestLongitude() : number {
        return this.dsi.southwestLongitudeDeg
    }

    public contains(latitude: number, longitude: number) : boolean {
        return latitude <= this.getNorthLatitude() && latitude >= this.getSouthLatitude() && longitude <= this.getEastLongitude() && longitude >= this.getWestLongitude()
    }

    public getNearestElevation(latitude: number, longitude: number): number {
        assert(this.contains(latitude, longitude))

        //map coordinate to 0..1 range and then to the range of indexes
        const latIndex = ((latitude - this.getSouthLatitude()) * (this.dsi.latitudeLineCount - 1))
        const longIndex = Math.round((longitude - this.getWestLongitude()) * (this.dsi.longitudeLineCount - 1))
        const dataRecord = this.records[longIndex]
        return dataRecord.getElevation(latIndex)
    }
}

/**
 * DTED tiles represent voids in the file using a constant number. 
 * This checks if an elevation returned from a DTED Tile is a void.
 * @param elevation The elevation to check.
 * @returns True if the elevation represent a void value.
 */
function isVoidElevation(elevation: number): boolean {
    return elevation === DTED_VOID
}

function fromSignedMagnitude(signedBytes: Uint8Array ): number {
    let part1 = signedBytes[0]
    let part2 = signedBytes[1]

    let isNegative = (part1 & 0b10000000) != 0 //Check for sign bit set to 1
    let num = (part1 << 8) | part2 //Swap endianess
    if(isNegative) {
        num ^= 0b1000000000000000 //Invert sign bit
        num = ~num //invert bytes
        num += 1; //add 1
    }
    return num
}

function parseDDMMSSH(str: string, offset: number) : number {
    // should only be used for latitude
    let latitudeDeg: number = parseInt(str.slice(offset, offset + 2)) +
        (parseInt(str.slice(offset + 2, offset + 4)) / 60) +
        (parseInt(str.slice(offset + 4, offset + 6)) / 3600);
    const hemisphere = str.slice(offset + 6, offset + 7).toUpperCase();
    if (hemisphere === "S") {
        latitudeDeg *= -1;
    }
    return latitudeDeg;
}

function parseDDDMMSSH(str: string, offset: number) : number {
    let angleDeg: number = parseInt(str.slice(offset, offset + 3)) +
        (parseInt(str.slice(offset + 3, offset + 5)) / 60) +
        (parseInt(str.slice(offset + 5, offset + 7)) / 3600);
    const hemisphere = str.slice(offset + 7, offset + 8).toUpperCase();
    if (hemisphere === "S" || hemisphere === "W") {
        angleDeg *= -1;
    }
    return angleDeg;
}

function parseDDMMSS_SH(str: string, offset: number) : number {
    // should only be used for latitude
    let latitudeDeg: number = parseInt(str.slice(offset, offset + 2)) +
        (parseInt(str.slice(offset + 2, offset + 4)) / 60) +
        (parseFloat(str.slice(offset + 4, offset + 8)) / 3600);
    const hemisphere = str.slice(offset + 8, offset + 9).toUpperCase();
    if (hemisphere === "S") {
        latitudeDeg *= -1;
    }
    return latitudeDeg;
}

function parseDDDMMSS_SH(str: string, offset: number) : number {
    let angleDeg: number = parseInt(str.slice(offset, offset + 3)) +
        (parseInt(str.slice(offset + 3, offset + 5)) / 60) +
        (parseFloat(str.slice(offset + 5, offset + 9)) / 3600);
    const hemisphere = str.slice(offset + 9, offset + 10).toUpperCase();
    if (hemisphere === "S" || hemisphere === "W") {
        angleDeg *= -1;
    }
    return angleDeg;
}

function parseIntOrNa(str: string) : number | undefined {
    let num: number | undefined = undefined
    if(str.trim() !== "NA") {
        this.absoluteVerticalAccuracyMeters = parseInt(str)
    }
    return num;
}

/**
 * Reads in a DTED file synchronously.
 * @param filePath Path to the DTED file being read.
 * @returns A DTED tile if successful or null if unsuccessful.
 */
function readDtedSync(filePath: string) : DtedTile {
    //Attempt to read in DTED file
    let fileBuffer = fs.readFileSync(filePath)
    return new DtedTile(fileBuffer)
}

/**
 * Reads in a DTED file asynchronously.
 * @param filePath Path to the DTED file being read.
 * @returns A promise wrapping a DTED tile if successful or null if unsuccessful.
 */
async function readDtedAsync(filePath: string) : Promise<DtedTile> {
    //Attempt to read in DTED file
    let fileBuffer = await fsPromises.readFile(filePath)
    return new DtedTile(fileBuffer)
}

export { UserHeaderLabel, DataSetIdentifictionRecord, AccuracyDescriptionRecord, AccuracySubregionDescription, CoordinatePairDescription, DataRecord, DtedTile, isVoidElevation, readDtedAsync, readDtedSync}
