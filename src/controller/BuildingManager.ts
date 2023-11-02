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
	let shortname: string | null = null;
	let fullname: string | null = null;
	let address: string | null = null;
	let href: string | null = null;
	const isElement = (node: any): node is Element & {childNodes: any[], attrs: any[]} =>
		Object.prototype.hasOwnProperty.call(node, "attrs") && Object.prototype.hasOwnProperty.call(node, "childNodes");
	const extractText = (node: any): string | null => {
		const textNode = node.childNodes.find((child: any) => child.nodeName === "#text");
		return textNode ? textNode.value.trim() : null;
	};
	const extractAnchorData = (node: any): {href: string | null, text: string | null} => {
		const anchorNode = node.childNodes.find((child: any) => child.nodeName === "a");
		const href1 = anchorNode?.attrs.find((attr: any) => attr.name === "href")?.value || null;
		const text = extractText(anchorNode);
		return {href: href1, text};
	};
	if (!("childNodes" in tr)) {
		throw new Error("Invalid input node");
	}
	for (const node of tr.childNodes) {
		if (isElement(node)) {
			for (const attr of node.attrs) {
				let anchorData;
				switch (attr.value) {
					case "views-field views-field-nothing":
						anchorData = extractAnchorData(node);
						fullname = anchorData.text;
						href = anchorData.href;
						break;
					case "views-field views-field-field-building-address":
						address = extractText(node);
						break;
					case "views-field views-field-field-building-code":
						shortname = extractText(node);
						break;
				}
			}
		}
		if (address && shortname && fullname && href) {
			break;
		}
	}
	if (shortname && fullname && address && href) {
		return new Building(0, 0, fullname, shortname, address, href);
	} else {
		throw new Error("Incomplete data for building row");
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


