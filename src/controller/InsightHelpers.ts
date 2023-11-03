import {InsightDataset, InsightDatasetKind, InsightError} from "./IInsightFacade";
import {Section} from "../model/Section";
import path from "path";
import fs from "fs";
import fs_promise from "fs/promises";
import JSZip from "jszip";
import {parse,DefaultTreeAdapterMap} from "parse5";
import * as parse5 from "parse5";
import {Building} from "../model/Building";
import {Room} from "../model/Room";
import {parseBuildingData, updateLatLon} from "./BuildingManager";
import * as building from "./BuildingManager";
import * as rooms from "./RoomsManager";

export let tables: any[] = [];
export function extractResultValues(data: any[]): any[] {
	try {
		const results: any[] = [];
		data.forEach((item) => {
			for (const key in item) {
				const innerObject = JSON.parse(item[key]);
				if ("result" in innerObject) {
					results.push(...innerObject.result);
				}
			}
		});
		return results;
	} catch (e) {
		throw new InsightError("error parsing section data in extractResultValues");
	}
}

export async function jsonToSection(datasetId: string): Promise<Section[]> {
	try {
		const dataFilePath = path.join(__dirname, "..", "..", "data", "Sections" + "_" + datasetId + ".json");
		// after readfilesync, it's a json string, need to parse it to json object
		let datafileString = await fs_promise.readFile(dataFilePath, "utf8");
		// the data is of nested json format,after parse, it's a ts object array
		// the array contains ts objects;  each object element contains a json string(the real data fields for a section)
		let parsedObjectArray = JSON.parse(datafileString);
		// return all the section data in the file as an Object[]
		let sectionRawData = extractResultValues(parsedObjectArray);
		let sectionArray: Section[] = [];
		for (let section of sectionRawData) {
			let testsection = new Section(section.Subject, section.Course,
				section.Avg, section.Professor, section.Title,
				section.Pass, section.Fail, section.Audit,
				String(section.id), Number(section.Year));
			if (section.Section === "overall") {
				testsection.year = 1900;
			}
			sectionArray.push(testsection);
		}
		return sectionArray;
	} catch (e) {
		throw new InsightError("error parsing section data");
	}
}

export async function jsonToRooms(datasetId: string): Promise<Room[]> {
	const dataFilePath = path.join(__dirname, "..", "..", "data", "Buildings" + "_" + datasetId + ".json");
	let datafileString: string = await fs_promise.readFile(dataFilePath, "utf8");
	return  JSON.parse(datafileString);
}
/* export async function tableToRooms(datasetId: string): Promise<DefaultTreeAdapterMap["element"]> {
	const dataFilePath = path.join(__dirname, "..", "..", "data", "Buildings" + "_" + datasetId + ".json");
	let datafileString: string = await fs_promise.readFile(dataFilePath, "utf8");
	// datafileString = JSON.parse(datafileString);
	let serilizedString =  parse5.serialize(JSON.parse(datafileString));
	const document = parse5.parse(serilizedString);
	return document.childNodes[0] as DefaultTreeAdapterMap["element"];
}*/
export async function tableToRooms(datasetId: string) {
	const dataFilePath: string = path.join(__dirname, "..", "..", "data", "Buildings" + "_" + datasetId + ".html");
	const htmlString: string = await fs.promises.readFile(dataFilePath, {encoding: "utf8"});
	const document = parse5.parse(htmlString);
/*	if ("childNodes" in document.childNodes[0]) {
		console.log(document.childNodes[0].childNodes[1]);
	}*/
	return document;
}

export function getAllRooms(buildings: Building[]): Room[] {
	let allRooms: Room[] = [];
	for (const b of buildings) {
		const rs = b._rooms;
		for (const r of rs) {
			const newRoom = new Room(
				r._room_number,
				r._room_name,
				r._seats,
				r._type,
				r._furniture,
				r._href,
				b._lat,
				b._lon,
				b._fullname,
				b._shortname,
				b._address
			);
			allRooms.push(newRoom);
		}
	}
	return allRooms;
}

export async function isValidZip(loadedContent: JSZip): Promise<boolean> {
	let totalDirectories = 0;
	let isValid = true;
	let validationPromises: Array<Promise<any>> = [];

	loadedContent.forEach((relativePath, zipEntry) => {
		const promise = (async () => {
			if (zipEntry.dir) {
				totalDirectories++;
				if (totalDirectories > 1 || (relativePath !== "courses/" && relativePath !== "campus/")) {
					isValid = false;
				}
			} else if (!relativePath.startsWith("courses/")) {
				isValid = false;
			} else {
				try {
					const content = await zipEntry.async("string");
					const parsedJson = JSON.parse(content);
					if (!parsedJson) {
						isValid = false;
					}
				} catch (e) {
					throw new InsightError("error parsing section data");
				}
			}
		})();
		validationPromises.push(promise);
	});
	await Promise.all(validationPromises);
	if (totalDirectories !== 1) {
		isValid = false;
	}
	return isValid;
}

export function isIdKindValid(id: string, kind: InsightDatasetKind): boolean {
	if (kind !== InsightDatasetKind.Rooms && kind !== InsightDatasetKind.Sections) {
		return false;
	}
	if (id === null || id === undefined) {
		return false;
	}
	if (/^\s*$/.test(id)) {
		return false;
	}
	if (!/^[^_]+$/.test(id)) {
		return false;
	}
	return true;
}

export function countRowNumSections(parsedData: any[]): number {
	let rowNumber = 0;

	for (let data of parsedData) {
		for (let key in data) {
			let courseData;

			try {
				courseData = JSON.parse(data[key]);
				if (courseData.result && Array.isArray(courseData.result)) {
					rowNumber += courseData.result.length;
				}
			} catch (err) {
				throw new InsightError("error parsing section data in countRowNum");
			}
		}
	}
	return rowNumber;
}

export function countRowNumBuildings  (parsedData: any[]): number {
	let rowNumber = 0;
	for (let data of parsedData){
		rowNumber += data._rooms.length;
	}
	return rowNumber;
}

export async function parseRoomData(content: string): Promise<Array<DefaultTreeAdapterMap["childNode"]>> {
	let zip = new JSZip();
	let indexContent;
	let textContent;
	await zip.loadAsync(content, {base64: true}).then(async function(contents) {
		indexContent = contents.file("index.htm");
		if (indexContent) {
			textContent = await indexContent.async("text");
			if (textContent) {
				return parse5.parse(textContent).childNodes;
			}
		} else {
			throw new Error("no index.htm in zip");
		}
	});
	if (textContent) {
		return parse5.parse(textContent).childNodes;
	} else {
		throw new Error("Failed to parse the content.");
	}
}

export async function processBuilding(
	b: Building,
	content: string,
	roomsModule: any
): Promise<number> {
	let filePath = b.getHref().slice(2);
	let roomContent = await roomsModule.parseRoomData(content, filePath);
	let roomTable = roomsModule.findRoomsTables(roomContent);
	if (roomTable) {
		let roomTbody = roomsModule.findValidRoomRowsInTable(roomTable as DefaultTreeAdapterMap["childNode"]);
		let roomsList = roomsModule.rowsToRooms(roomTbody, b);
		if (roomsList.length > 0) {
			b.setRooms(roomsList);
			return roomsList.length;
		}
	}
	return 0;
}

export async function processAllBuildings(
	buildings: Building[],
	content: string,
	roomsModule: any
): Promise<number> {
	const roomCounts = await Promise.all(buildings.map((b) => processBuilding(b, content, roomsModule)));
	return roomCounts.reduce((acc, count) => acc + count, 0);
}

export function createTimeoutPromise(timeout: number, errorMessage: string): Promise<never> {
	return new Promise<never>((_, reject) => {
		setTimeout(() => reject(new InsightError(errorMessage)), timeout);
	});
}

function extractAndTransformLinks(htmlContent: string): string[] {
	const linkPattern = /\.\/campus\/discover\/buildings-and-classrooms\/(\w+)/g;
	let match: RegExpExecArray | null;
	const transformedLinks = [];
	while ((match = linkPattern.exec(htmlContent)) !== null) {
		transformedLinks.push(`campus/discover/buildings-and-classrooms/${match[1]}.htm`);
	}

	return transformedLinks;
}

export async function processZip(content: string, htmlFileName: string): Promise<string[]> {
	try {
		const zip = new JSZip();
		await zip.loadAsync(Buffer.from(content, "base64"));
		const htmlFile = zip.file(htmlFileName);
		if (!htmlFile) {
			throw new Error(`File "${htmlFileName}" does not exist in the ZIP archive.`);
		}
		const htmlContent = await htmlFile.async("string");
		const links = extractAndTransformLinks(htmlContent);
		const uniqueLinks = [...new Set(links)];
		return uniqueLinks;
	} catch (error) {
		console.error("Error processing ZIP file:", error);
		return [];
	}
}

export function countRoomsInHtml(htmlContent: string) {
	const firstRoomRegex = /<tr class="(?:odd|even) views-row-first(?:"| views-row-last")>/;
	const lastRoomRegex = /<tr class="(?:odd|even) views-row-last">/;
	const otherRoomsRegex = /<tr class="(?:odd|even)(?!.*views-row-first)(?!.*views-row-last)">/g;
	const firstRoomMatch = firstRoomRegex.test(htmlContent) ? 1 : 0;
	const lastRoomMatch = lastRoomRegex.test(htmlContent) ? 1 : 0;
	const otherRoomsMatches = (htmlContent.match(otherRoomsRegex) || []).length;
	return firstRoomMatch + lastRoomMatch + otherRoomsMatches;
}

export async function countTotalRooms(content: string, links: string[]): Promise<number> {
	try {
		const zip = new JSZip();
		await zip.loadAsync(Buffer.from(content, "base64"));
		const counts = await Promise.all(links.map(async (link) => {
			const file = zip.file(link);
			if (!file) {
				throw new Error(`File "${link}" does not exist in the ZIP archive.`);
			}

			const htmlContent = await file.async("string");
			return countRoomsInHtml(htmlContent);
		}));

		return counts.reduce((acc, count) => acc + count, 0);
	} catch (error) {
		console.error("Error counting rooms:", error);
		return 0;
	}
}
