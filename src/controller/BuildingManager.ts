import {DefaultTreeAdapterMap, parse} from "parse5";
import JSZip from "jszip";
import * as parse5 from "parse5";
import {Building} from "../model/Building";
import {tables} from "./InsightHelpers";
import {GeoResponse} from "./GeoResponse";
import {InsightError} from "./IInsightFacade";
import {GeoService} from "./GeoService";
// mport {Template} from "parse5/dist/tree-adapters/default";

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
	for (let child of nodes || []) {
		if ("tagName" in child) {
			if (child.tagName === "table") {
				if (isValidTableOrRow(child)){
					return child;
				}
			}
			const result = findBuildingTables(child.childNodes);
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

export function findCadidateBuildingRows(tbody: DefaultTreeAdapterMap["childNode"]):
	Array<DefaultTreeAdapterMap["childNode"]> {
	let candidateRows: Array<DefaultTreeAdapterMap["childNode"]> = [];
	if ("childNodes" in tbody) {
		for (let child of tbody.childNodes) {
			if ("tagName" in child) {
				if (child.tagName === "tr") {
					candidateRows.push(child);
				}
			}
		}
	}
	return candidateRows;
}

export function findValidBuildingRows(candidateRows: Array<DefaultTreeAdapterMap["childNode"]>):
	Array<DefaultTreeAdapterMap["childNode"]> {
	let validRows: Array<DefaultTreeAdapterMap["childNode"]> = [];
	for (let row of candidateRows) {
		if (isValidTableOrRow(row)) {
			validRows.push(row);
		}
	}
	return validRows;
}

function setFullNameHref(
	attrs: parse5.Token.Attribute,
	td: DefaultTreeAdapterMap["childNode"]
/*		| Element
		| Template
		| (Element & {childNodes: unknown})
		| (Template & {
				childNodes: unknown;
		  })*/,
	href: string | null,
	fullname: string | null
) {
	if (attrs.name === "class" && attrs.value === "views-field views-field-title") {
		if ("childNodes" in td) {
			for (const child of td.childNodes) {
				if (child.nodeName === "a") {
					if ("attrs" in child) {
						for (const attr of child.attrs) {
							if (attr.name === "href") {
								href = attr.value;
							}
						}
					}
					for (const subChild of child.childNodes) {
						if (subChild.nodeName === "#text") {
							if ("value" in subChild) {
								fullname = subChild.value.trim();
							}
						}
					}
				}
			}
		}
	}
	return {href, fullname};
}

export function oneRowToBuilding(tr: DefaultTreeAdapterMap["childNode"]): Building{
	let lat = 0;
	let lon = 0;
	let shortname: string | null = null;
	let fullname: string| null = null;
	let address: string| null = null;
	let href: string| null = null;
	if ("childNodes" in tr) {
		for (let td of tr.childNodes) {
			if ("attrs" in td) {
				for (let attrs of td.attrs) {
					const fullNameHref = setFullNameHref(attrs, td, href, fullname);
					href = fullNameHref.href;
					fullname = fullNameHref.fullname;
					if (attrs.name === "class" && attrs.value === "views-field views-field-field-building-address") {
						if ("childNodes" in td) {
							for (const child of td.childNodes) {
								if (child.nodeName === "#text") {
									if ("value" in child) {
										address = child.value.trim();
									}
								}
							}
						}
					}
					if (attrs.name === "class" && attrs.value === "views-field views-field-field-building-code") {
						if ("childNodes" in td) {
							for (const child of td.childNodes) {
								if (child.nodeName === "#text") {
									if ("value" in child) {
										shortname = child.value.trim();
									}
								}
							}
						}
					}
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


