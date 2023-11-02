import {DefaultTreeAdapterMap} from "parse5";
import JSZip from "jszip";
import * as parse5 from "parse5";
import fs from "fs";
import * as fs_extra from "fs-extra";
import {InsightError} from "./IInsightFacade";
import {Room} from "../model/Room";
import {Building} from "../model/Building";
// import {hasAddress, hasFullName, hasHref, hasShortName, isValidTableOrRow} from "./BuildingManager";


export async function parseRoomData(content: string, roomFilePath: string):
	Promise<Array<DefaultTreeAdapterMap["childNode"]>> {
	let zip = new JSZip();
	await zip.loadAsync(content, {base64: true});
	let fileContent = zip.file(roomFilePath);
	if (!fileContent) {
		throw new InsightError("no room html in zip");
	}
	let textContent = await fileContent.async("text");
	if (!textContent) {
		throw new InsightError("no room html in zip");
	}
	// return a document object, this object is similar to the DOM tree
	return parse5.parse(textContent).childNodes;
}

export function findRoomsTables(
	nodes: Array<DefaultTreeAdapterMap["childNode"]>
): DefaultTreeAdapterMap["childNode"] | null {
	for (let child of nodes || []) {
		if ("tagName" in child) {
			if (child.tagName === "table") {
				if (isValidTableOrRow(child)){
					return child;
				}
			}
			const result = findRoomsTables(child.childNodes);
			if (result) {
				return result;
			}
		}
	}
	return null;
}

export function findTbody(table: DefaultTreeAdapterMap["childNode"]): DefaultTreeAdapterMap["childNode"] | null {
	if ("childNodes" in table) {
		for (let child of table.childNodes) {
			if ("tagName" in child) {
				if (child.tagName === "tbody") {
					return child;
				}
			}
			const result = findTbody(child);
			if (result) {
				return result;
			}
		}
	}
	return null;
}

export function isValidTableOrRow(child: DefaultTreeAdapterMap["childNode"]): boolean {
	// return hasFullName(element) && hasShortName(element) && hasAddress(element) && hasHref(element);
	return hasRoomNumber(child) && hasRoomSeats(child) && hasRoomType(child) && hasRoomFurniture(child);
}

export function hasRoomNumber(child: DefaultTreeAdapterMap["childNode"]): boolean {
	if ("attrs" in child) {
		for (const attr of child.attrs) {
			if (attr.name === "class" && attr.value === "views-field views-field-field-room-number") {
				return true;
			}
		}
	}
	if ("childNodes" in child) {
		for (const subChild of child.childNodes) {
			if (hasRoomNumber(subChild)) {
				return true;
			}
		}
	}
	return false;
}

export function hasRoomSeats(child: DefaultTreeAdapterMap["childNode"]): boolean {
	if ("attrs" in child) {
		for (const attr of child.attrs) {
			if (attr.name === "class" && attr.value === "views-field views-field-field-room-capacity") {
				return true;
			}
		}
	}
	if ("childNodes" in child) {
		for (const subChild of child.childNodes) {
			if (hasRoomSeats(subChild)) {
				return true;
			}
		}
	}
	return false;
}

export function hasRoomType(child: DefaultTreeAdapterMap["childNode"]): boolean {
	if ("attrs" in child) {
		for (const attr of child.attrs) {
			if (attr.name === "class" && attr.value === "views-field views-field-field-room-type") {
				return true;
			}
		}
	}
	if ("childNodes" in child) {
		for (const subChild of child.childNodes) {
			if (hasRoomType(subChild)) {
				return true;
			}
		}
	}
	return false;
}

export function hasRoomFurniture(child: DefaultTreeAdapterMap["childNode"]): boolean {
	if ("attrs" in child) {
		for (const attr of child.attrs) {
			if (attr.name === "class" && attr.value === "views-field views-field-field-room-furniture") {
				return true;
			}
		}
	}
	if ("childNodes" in child) {
		for (const subChild of child.childNodes) {
			if (hasRoomFurniture(subChild)) {
				return true;
			}
		}
	}
	return false;
}

export function findCadidateRoomRows(tbody: DefaultTreeAdapterMap["childNode"]):
	Array<DefaultTreeAdapterMap["childNode"]> {
	let candidateRows: Array<DefaultTreeAdapterMap["childNode"]> = [];
	if (tbody) {
		if ("childNodes" in tbody) {
			for (let child of tbody.childNodes) {
				if ("tagName" in child) {
					if (child.tagName === "tr") {
						candidateRows.push(child);
					}
				}
			}
		}
	}
	return candidateRows;
}

export function findValidRoomRows(candidateRows: Array<DefaultTreeAdapterMap["childNode"]>):
	Array<DefaultTreeAdapterMap["childNode"]> {
	let validRows: Array<DefaultTreeAdapterMap["childNode"]> = [];
	for (let row of candidateRows) {
		if (isValidTableOrRow(row)) {
			validRows.push(row);
		}
	}
	return validRows;
}
export function oneRowToRoom(tr: DefaultTreeAdapterMap["childNode"], building: Building): Room | null {
	let roomNumber: string = "";
	let roomName: string = "";
	let seats: number | null = 0;
	let type: string = "";
	let furniture: string = "";

	if ("childNodes" in tr) {
		for (let td of tr.childNodes) {
			if ("attrs" in td) {
				for (let attrs of td.attrs) {
					switch (attrs.value) {
						case "views-field views-field-field-room-type":
							type = getTextValue(td);
							break;
						case "views-field views-field-field-room-capacity":
							seats = getSeatValue(td) ? getSeatValue(td) : 0;
							break;
						case "views-field views-field-field-room-furniture":
							furniture = getTextValue(td);
							break;
						case "views-field views-field-field-room-number":
							roomNumber = getAnchorTextValue(td);
							break;
					}
				}
			}
		}
	}
	return new Room(roomNumber, roomName, seats, type, furniture);

/*	if (roomNumber && seats && type && furniture) {
		roomName = building.getShortname() + "_" + roomNumber;
		return new Room(roomNumber, roomName, seats, type, furniture);
	} else {
		return null;
	}*/
}

function getTextValue(node: DefaultTreeAdapterMap["childNode"]): string {
	if ("childNodes" in node) {
		for (const child of node.childNodes) {
			if (child.nodeName === "#text" && "value" in child) {
				return child.value.trim();
			}
		}
	}
	return "";
}

function getSeatValue(node: DefaultTreeAdapterMap["childNode"]): number{
	if ("childNodes" in node) {
		for (const child of node.childNodes) {
			if (child.nodeName === "#text" && "value" in child) {
				return Number(child.value.trim());
			}
		}
	}
	return 0;
}

function getAnchorTextValue(node: DefaultTreeAdapterMap["childNode"]): string {
	if ("childNodes" in node) {
		for (const child of node.childNodes) {
			if (child.nodeName === "a") {
				for (const subChild of child.childNodes) {
					if (subChild.nodeName === "#text" && "value" in subChild) {
						return subChild.value.trim();
					}
				}
			}
		}
	}
	return "";
}

export function rowsToRooms(rows: Array<DefaultTreeAdapterMap["childNode"]>, building: Building): Room[] {
	let rooms: Room[] = [];
	for (let row of rows) {
		let room: Room| null = oneRowToRoom(row, building);
		if (room) {
			rooms.push(room);
		}
	}
	return rooms;
}
