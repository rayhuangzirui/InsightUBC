import {InsightDatasetKind, InsightError} from "./IInsightFacade";
import {Section} from "../model/Section";
import path from "path";
import fs from "fs";
import JSZip from "jszip";
import {parse,DefaultTreeAdapterMap} from "parse5";
import * as parse5 from "parse5";
import {Building} from "../model/Building";

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

export function jsonToSection(datasetId: string): Section[] {
	try {
		const dataFilePath = path.join(__dirname, "..", "..", "data", datasetId + ".json");
		// after readfilesync, it's a json string, need to parse it to json object
		let datafileString = fs.readFileSync(dataFilePath, "utf8");
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
			sectionArray.push(testsection);
		}
		return sectionArray;
	} catch (e) {
		throw new InsightError("error parsing section data");
	}
}

export async function isValidZip(loadedContent: JSZip): Promise<boolean> {
	let totalDirectories = 0;
	let isValid = true;
	let validationPromises: Array<Promise<any>> = [];

	loadedContent.forEach((relativePath, zipEntry) => {
		const promise = (async () => {
			if (zipEntry.dir) {
				totalDirectories++;
				if (totalDirectories > 1 || relativePath !== "courses/") {
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
	if (id === null || id === undefined) {
		return false;
	}
	if (/^\s*$/.test(id)) {
		return false;
	}
	if (!/^[^_]+$/.test(id)) {
		return false;
	}
	if (kind === InsightDatasetKind.Rooms) {
		return false;
	}
	return true;
}

export function countRowNum(parsedData: any[]): number {
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

// parse the index.html to a dom-like tree
export async function parseRoomData(content: string): Promise<Array<DefaultTreeAdapterMap["childNode"]>> {
	let zip = new JSZip();
	let indexContent;
	let textContent;
	await zip.loadAsync(content, {base64: true}).then(async function(contents) {
		// 返回代表index.html文件对象
		indexContent = contents.file("index.htm");
		if (indexContent) {
			// text string; content of index.html
			textContent = await indexContent.async("text");
			if (textContent) {
				// return a document object, this object is similar to the DOM tree
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

