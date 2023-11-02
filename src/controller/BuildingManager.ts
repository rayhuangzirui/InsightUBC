import {DefaultTreeAdapterMap, parse} from "parse5";
import JSZip from "jszip";
import * as parse5 from "parse5";
import {Building} from "../model/Building";
import {tables} from "./InsightHelpers";
import {GeoResponse} from "./GeoResponse";
import {InsightError} from "./IInsightFacade";
import {GeoService} from "./GeoService";

export async function parseBuildingData(content: string): Promise<Array<DefaultTreeAdapterMap["childNode"]>> {
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
	return parse5.parse(textContent).childNodes;
}

export function findBuildingTables(
	nodes: Array<DefaultTreeAdapterMap["childNode"]>
): DefaultTreeAdapterMap["childNode"] | null {
	for (const node of nodes) {
		if ("tagName" in node && node.tagName === "table" && isValidTableOrRow(node)) {
			return node;
		}
		if ("childNodes" in node) {
			const childNodes = node.childNodes || [];
			const result = findBuildingTables(childNodes);
			if (result) {
				return result;
			}
		}
	}
	return null;
}


export function findValidBuildingRowsInTable(table: DefaultTreeAdapterMap["childNode"]):
	Array<DefaultTreeAdapterMap["childNode"]> {
	let validRows: Array<DefaultTreeAdapterMap["childNode"]> = [];
	function findTbody(node: DefaultTreeAdapterMap["childNode"]): DefaultTreeAdapterMap["childNode"] | null {
		if ("tagName" in node && node.tagName === "tbody") {
			return node;
		}
		if ("childNodes" in node) {
			for (let child of node.childNodes) {
				if ("tagName" in child && child.tagName === "tbody") {
					return child;
				}
				if ("childNodes" in child) {
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
	if (tbody && "childNodes" in tbody) {
		for (let child of tbody.childNodes) {
			if ("tagName" in child && child.tagName === "tr" && isValidTableOrRow(child)) {
				validRows.push(child);
			}
		}
	}
	return validRows;
}


export function oneRowToBuilding(tr: DefaultTreeAdapterMap["childNode"]): Building {
	let lat = 0;
	let lon = 0;
	let shortname: string | null = null;
	let fullname: string | null = null;
	let address: string | null = null;
	let href: string | null = null;
	function findText(node: DefaultTreeAdapterMap["childNode"]): string | null {
		if ("childNodes" in node) {
			const textNode = node.childNodes.find((child) => child.nodeName === "#text");
			return textNode && "value" in textNode ? textNode.value.trim() : null;
		}
		return null;
	}

	if ("childNodes" in tr) {
		for (let td of tr.childNodes) {
			if ("attrs" in td) {
				for (let attr of td.attrs) {
					let result;
					switch (attr.value) {
						case "views-field views-field-nothing":
							result = setFullNameHref(td);
							href = result.href;
							fullname = result.fullname;
							break;
						case "views-field views-field-field-building-address":
							address = findText(td);
							break;
						case "views-field views-field-field-building-code":
							shortname = findText(td);
							break;
					}
					if (address && shortname && fullname && href) {
						break;
					}
				}
				if (address && shortname && fullname && href) {
					break;
				}
			}
		}
	}

	if (shortname && fullname && address && href) {
		return new Building(lat, lon, fullname, shortname, address, href);
	} else {
		throw new Error("invalid building row");
	}
}


export function jsonToBuilding(trs: Array<DefaultTreeAdapterMap["childNode"]>): Building[] {
	let buildings: Building[] = [];
	for (let tr of trs) {
		let building: Building = oneRowToBuilding(tr);
		buildings.push(building);
	}
	return buildings;
}

export function isValidTableOrRow(child: DefaultTreeAdapterMap["childNode"]): boolean {
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


