import {DefaultTreeAdapterMap, foreignContent, parse} from "parse5";
import JSZip from "jszip";
import * as parse5 from "parse5";
import {Building} from "../model/Building";
import {tables} from "./InsightHelpers";
import {GeoResponse} from "./GeoResponse";
import {InsightError} from "./IInsightFacade";
import {GeoService} from "./GeoService";
import {parseGroup} from "../QueryParsers/TransformationsParser";
import {ifError} from "assert";
import {
	findRoomsTables,
	findValidRoomRowsInTable,
	oneRowToRoom,
	oneRowToRoom2,
	parseOneRoomData
} from "./RoomsManager";
import fs_promise from "fs/promises";
import {Room} from "../model/Room";

export async function parseBuildingData(content: string): Promise<Array<DefaultTreeAdapterMap["element"]>> {
	let zip = new JSZip();

	await zip.loadAsync(content, {base64: true});

	let indexContent = zip.file("index.htm");
	if (!indexContent) {
		throw new InsightError("no index.htm in zip");
	}

	let textContent = await indexContent.async("text");
	if (!textContent) {
		throw new Error("Failed to retrieve the content from index.htm.");
	}
	return parse5.parse(textContent).childNodes as Array<DefaultTreeAdapterMap["element"]>;
}

export function findBuildingTables(
	nodes: Array<DefaultTreeAdapterMap["element"]>
): DefaultTreeAdapterMap["element"] | null {
	for (const node of nodes) {
		if (node.tagName === "table") {
			return node;
		}
		const childNodes: Array<DefaultTreeAdapterMap["childNode"]> = node.childNodes || [];
		const result = findBuildingTables(childNodes as Array<DefaultTreeAdapterMap["element"]>);
		if (result) {
			return result;
		}
	}
	return null;
}

export async function oneRowToRooms(content: string, tr: DefaultTreeAdapterMap["childNode"]): Promise<Room[]> {
	let roomList: Room[] = [];
	let geoService = new GeoService();
	let lat: number = 0;
	let lon: number = 0;
	let address: string = extractAddress(tr);
	let shortname: string = extractShortname(tr);
	let fullname: string = extractFullname(tr);
	let bHref: string = extractHref(tr);

	if (address) {
		let geoResponse = await geoService.fetchGeolocation(address);
		if (geoResponse.lat && geoResponse.lon) {
			lat = geoResponse.lat;
			lon = geoResponse.lon;
		}
	}

	let room = await parseOneRoomData(content, bHref.slice(2));
	let roomTable = findRoomsTables(room) as DefaultTreeAdapterMap["element"];
	let trs = findValidRoomRowsInTable(roomTable);
	for (let row of trs) {
		let aroom = oneRowToRoom2(row, lat, lon, fullname, shortname, address);
		if (aroom) {
			roomList.push(aroom);
		}
	}

	return roomList;
}

export function findValidBuildingRowsInTable(
	table: DefaultTreeAdapterMap["element"]
): Array<DefaultTreeAdapterMap["element"]> {
	let validRows: Array<DefaultTreeAdapterMap["element"]> = [];

	function findRows(node: DefaultTreeAdapterMap["element"]) {
		if (node.tagName === "tr" && node.parentNode?.nodeName === "tbody" && isValidTableOrRow(node)) {
			validRows.push(node);
		} else if ("childNodes" in node) {
			(node.childNodes as Array<DefaultTreeAdapterMap["element"]>).forEach(findRows);
		}
	}
	findRows(table);
	return validRows;
}

function extractAddress(tr: DefaultTreeAdapterMap["childNode"]): string {
	let address = "";
	if ("childNodes" in tr) {
		const addressNode = tr.childNodes.find((child) => {
			return "attrs" in child && child.attrs.some((attr) =>
				attr.value === "views-field views-field-field-building-address");
		});
		if (addressNode && "childNodes" in addressNode) {
			const textNode = addressNode.childNodes[0];
			if (textNode && textNode.nodeName === "#text" && "value" in textNode) {
				address = textNode.value.trim();
			}
		}
	}
	return address;
}

function extractShortname(tr: DefaultTreeAdapterMap["childNode"]): string {
	let shortname = "";
	if ("childNodes" in tr) {
		const codeNode = tr.childNodes.find((child) => {
			return "attrs" in child && child.attrs.some((attr) =>
				attr.value === "views-field views-field-field-building-code");
		});
		if (codeNode && "childNodes" in codeNode) {
			const textNode = codeNode.childNodes[0];
			if (textNode && textNode.nodeName === "#text" && "value" in textNode) {
				shortname = textNode.value.trim();
			}
		}
	}
	return shortname;
}

function extractFullname(tr: DefaultTreeAdapterMap["childNode"]): string {
	let fullname = "";
	if ("childNodes" in tr) {
		const titleNode = tr.childNodes.find((child) => {
			return "attrs" in child && child.attrs.some((attr) => attr.value === "views-field views-field-title");
		});
		if (titleNode && "childNodes" in titleNode) {
			const anchorNode = titleNode.childNodes.find((child) => child.nodeName === "a");
			if (anchorNode && "childNodes" in anchorNode) {
				const textNode = anchorNode.childNodes.find((child) => child.nodeName === "#text");
				if (textNode && "value" in textNode) {
					fullname = textNode.value.trim();
				}
			}
		}
	}
	return fullname;
}

function extractHref(tr: DefaultTreeAdapterMap["childNode"]): string {
	let href = "";
	if ("childNodes" in tr) {
		const titleNode = tr.childNodes.find((child) => {
			return "attrs" in child && child.attrs.some((attr) => attr.value === "views-field views-field-title");
		});
		if (titleNode && "childNodes" in titleNode) {
			const anchorNode = titleNode.childNodes.find((child) => child.nodeName === "a");
			if (anchorNode && "attrs" in anchorNode) {
				const hrefAttr = anchorNode.attrs.find((attr) => attr.name === "href");
				if (hrefAttr) {
					href = hrefAttr.value;
				}
			}
		}
	}
	return href;
}

export async function jsonToRooms(content: string, trs: Array<DefaultTreeAdapterMap["childNode"]>): Promise<Room[]> {
	const promises = trs.map((tr) => oneRowToRooms(content, tr));
	const roomsLists = await Promise.all(promises);
	let totalRooms: Room[] = roomsLists.flat();
	console.log(totalRooms.length);
	return totalRooms;
}
export function isValidTableOrRow(child: DefaultTreeAdapterMap["element"]): boolean {
	return hasShortName(child) && hasFullName(child) && hasAddress(child) && hasHref(child);
}

export function hasShortName(child: DefaultTreeAdapterMap["childNode"]): boolean {
	if ("attrs" in child) {
		for (const attr of child.attrs) {
			if (attr.name === "class" && attr.value === "views-field views-field-field-building-code") {
				return true;
			}
		}
	}

	if ("childNodes" in child) {
		for (const subChild of child.childNodes) {
			if (hasShortName(subChild)) {
				return true;
			}
		}
	}

	return false;
}

export function hasFullName(child: DefaultTreeAdapterMap["childNode"]): boolean {
	if ("attrs" in child) {
		for (const attr of child.attrs) {
			if (attr.name === "class" && attr.value === "views-field views-field-title") {
				return true;
			}
		}
	}

	if ("childNodes" in child) {
		for (const subChild of child.childNodes) {
			if (hasFullName(subChild)) {
				return true;
			}
		}
	}
	return false;
}

export function hasAddress(child: DefaultTreeAdapterMap["childNode"]): boolean {
	if ("attrs" in child) {
		for (const attr of child.attrs) {
			if (attr.name === "class" && attr.value === "views-field views-field-field-building-address") {
				return true;
			}
		}
	}

	if ("childNodes" in child) {
		for (const subChild of child.childNodes) {
			if (hasAddress(subChild)) {
				return true;
			}
		}
	}

	return false;
}

export function hasHref(child: DefaultTreeAdapterMap["childNode"]): boolean {
	if ("attrs" in child) {
		for (const attr of child.attrs) {
			if (attr.name === "class" && attr.value === "views-field views-field-nothing") {
				return true;
			}
		}
	}

	if ("childNodes" in child) {
		for (const subChild of child.childNodes) {
			if (hasHref(subChild)) {
				return true;
			}
		}
	}
	return false;
}

export async function updateLatLon(buildings: Building[]) {
	// a singleton geoService
	let geoService = new GeoService();
	const promises = buildings.map(async (building) => {
		// building.setGeoService(geoService);
		try {
			let geoResponse: GeoResponse = await geoService.fetchGeolocation(building.getAddress());
			building.setLatLon(geoResponse);
		} catch (err) {
			throw new InsightError("error in getting geoResponse");
		}
	});
	await Promise.all(promises);
}

function setFullNameHref(
	td: DefaultTreeAdapterMap["childNode"]
): {href: string | null, fullname: string | null} {
	let href: string | null = null;
	let fullname: string | null = null;
	if ("tagName" in td) {
		const anchorNode = td.childNodes.find((node) => node.nodeName === "a");
		if (anchorNode && "attrs" in anchorNode) {
			const hrefAttr = anchorNode.attrs.find((attr) => attr.name === "href");
			href = hrefAttr ? hrefAttr.value : null;

			const textNode = anchorNode.childNodes.find((node) => node.nodeName === "#text");
			if (textNode && "value" in textNode) {
				fullname = textNode.value.trim();
			}
		}
	}
	return {href, fullname};
}


