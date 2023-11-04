import {DefaultTreeAdapterMap} from "parse5";
import JSZip from "jszip";
import * as parse5 from "parse5";
import {InsightError} from "./IInsightFacade";
import {Room} from "../model/Room";
import {Building} from "../model/Building";
import path from "path";
import fs from "fs";
import {parseBuildingData} from "./BuildingManager";
import * as building from "./BuildingManager";

export async function parseOneRoomData(content: string, filePath: string) {
	let zip = new JSZip();
	await zip.loadAsync(content, {base64: true});
	// console.log(filePath);
	let fileContent = zip.file(filePath);
	/* if (!fileContent) {
	  throw new InsightError("no room html in zip");
	 }*/
	let textContent = "";
	try {
		if (fileContent) {
			textContent = await fileContent.async("text");
		}
		/*  if (!textContent) {
		   throw new InsightError("no room html in zip");
		  }*/
	} catch (error) {
		throw new InsightError("parsing room failed");
	}
	if (textContent) {
		return parse5.parse(textContent).childNodes;
	} else {
		return null;
	}
}

export function findRoomsTables(
	nodes: Array<DefaultTreeAdapterMap["childNode"]>
): DefaultTreeAdapterMap["childNode"] | null {
	for (let child of nodes || []) {
		if ("tagName" in child && child.nodeName === "table" && isValidTableOrRow(child)) {
			return child;
		} else if ("childNodes" in child) {
			const result = findRoomsTables(child.childNodes);
			if (result) {
				return result;
			}
		}
	}
	return null;
}

export function findValidRoomRowsInTable(table: DefaultTreeAdapterMap["childNode"]):
	Array<DefaultTreeAdapterMap["childNode"]> {
	function findTbody(node: DefaultTreeAdapterMap["childNode"]): DefaultTreeAdapterMap["childNode"] | null {
		if (node) {
			if ("childNodes" in node) {
				for (let child of node.childNodes) {
					if ("tagName" in child && child.tagName === "tbody") {
						return child;
					}
					const result = findTbody(child);
					if (result) {
						return result;
					}
				}
			}
		}
		return null;
	}

	const tbody = findTbody(table);
	let validRows: Array<DefaultTreeAdapterMap["childNode"]> = [];
	if (tbody && "childNodes" in tbody) {
		for (let child of tbody.childNodes) {
			if ("tagName" in child && child.tagName === "tr" && isValidTableOrRow(child)) {
				validRows.push(child);
			}
		}
	}

	return validRows;
}

export function isValidTableOrRow(child: DefaultTreeAdapterMap["childNode"]): boolean {
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
export function oneRowToRoom(tr: DefaultTreeAdapterMap["childNode"], b: Building): Room | null {
	let roomNumber: string = "";
	let roomName: string = "";
	let seats: number  = 0;
	let type: string = "";
	let furniture: string = "";
	let href: string = "";
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
							href = getHref(td);
							break;
					}
				}
			}
		}
	}
	roomName = b.getShortname() + "_" + roomNumber;
	let room = new Room(roomNumber, roomName, seats, type, furniture, href);
	return room;
}

export function oneRowToRoom2(tr: DefaultTreeAdapterMap["childNode"], lat: number,lon: number,
	fullname: string,shortname: string, address: string): Room | null {
	let roomNumber: string = "";
	let roomName: string = "";
	let seats: number  = 0;
	let type: string = "";
	let furniture: string = "";
	let href: string = "";
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
							href = getHref(td);
							break;
					}
				}
			}
		}
	}
	roomName = shortname + "_" + roomNumber;
	let room = new Room(roomNumber, roomName, seats, type, furniture, href, lat, lon, fullname, shortname, address);
	return room;
}

function getHref(node: DefaultTreeAdapterMap["childNode"]): string {
	if ("childNodes" in node) {
		for (const child of node.childNodes) {
			if (child.nodeName === "a") {
				if ("attrs" in child) {
					for (const attr of child.attrs) {
						if (attr.name === "href") {
							return attr.value;
						}
					}
				}
			}
		}
	}
	return "";
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

function getAnchorTextValue(node: DefaultTreeAdapterMap["childNode"]):
	string {
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
