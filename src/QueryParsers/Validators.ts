import {APPLYRULE, FILTER, Key} from "./QueryInterfaces";
import {Mfield, Sfield} from "./ClausesEnum";
import {InsightDatasetKind, InsightError} from "../controller/IInsightFacade";
import {jsonToRooms, jsonToSection} from "../controller/InsightHelpers";

export function IDValidator (id: string): boolean {
	if (id.includes("_")) {
		return false;
	} else if (!id.trim()) {
		return false;
	}

	return true;
}

export function inputStringValidator(inputString: string): boolean {
	if (inputString.includes("*")) {
		const firstAsterisk = inputString.indexOf("*");
		const lastAsterisk = inputString.lastIndexOf("*");

		if (firstAsterisk !== 0 && firstAsterisk !== inputString.length - 1) {
			return false;
		}

		if (lastAsterisk !== 0 && lastAsterisk !== inputString.length - 1) {
			return false;
		}
	}

  // empty or no *
	return true;
}

export function isMkey(key: any): boolean {
	const mFields = Object.values(Mfield);
	return mFields.some((field) => key.endsWith(`${field}`));
}

export function isSkey(key: any): boolean {
	const sFields = Object.values(Sfield);
	return sFields.some((field) => key.endsWith(`${field}`));
}

export function isKeyinList(key: any, key_list: any[]): boolean {
	return key_list.includes(key);
}

export function isKeyinGroupList(targetKey: Key, keyList: Key[]): boolean {
	const targetStr = JSON.stringify(targetKey).trim();
	return keyList.some((key) => JSON.stringify(key).trim() === targetStr);
}

export function isKeyInApplyRules(key: any, applyRules: APPLYRULE[]): boolean {
	for (const rule of applyRules) {
		if (rule.applykey === key) {
			return true;
		}
	}
	return false;
}


export function getIDsFromQuery(query: any): string[] {
	let ids = new Set<string>();

	// get IDs from the WHERE clause
	if (query.body && query.body.filter) {
		getIDsFromFilter(query.body.filter, ids);
	}

	// get IDs from the OPTIONS clause
	if (query.options && query.options.columns && query.options.columns.anykey_list) {
		for (const key of query.options.columns.anykey_list) {
			if (key.idstring) {
				ids.add(key.idstring);
			}
		}
	}

	// Get IDs from the TRANSFORMATIONS clause (GROUP)
	if (query.transformations && query.transformations.group) {
		for (const key of query.transformations.group.keys) {
			ids.add(key.idstring);
		}
	}

	// Get IDs from the TRANSFORMATIONS clause (APPLY)
	if (query.transformations && query.transformations.apply) {
		if (Array.isArray(query.transformations.apply) && query.transformations.apply.length > 0) {
			for (const applyRule of query.transformations.apply) {
				ids.add(applyRule.key.idstring);
			}
		}
	}

	return [...ids];
}

function getIDsFromFilter(filter: FILTER, ids: Set<string>): void {
	if (filter.logicComp) {
		for (const innerFilter of filter.logicComp.filter_list) {
			getIDsFromFilter(innerFilter, ids);
		}
	} else if (filter.mComp && filter.mComp.mkey) {
		ids.add(filter.mComp.mkey.idstring);
	} else if (filter.sComp && filter.sComp.skey) {
		ids.add(filter.sComp.skey.idstring);
	} else if (filter.negation) {
		getIDsFromFilter(filter.negation.filter, ids);
	}
}

export function isValidField(mappedKey: string, value: any): boolean {
	const stringFields = ["_dept", "_id", "_instructor", "_title", "_uuid",
		"_fullname", "_shortname", "_room_number", "_room_name", "_address", "_type", "_furniture", "_href"];
	const numberFields = ["_avg", "_pass", "_fail", "_audit", "_year", "_lat", "_lon", "_seats"];

	if (stringFields.includes(mappedKey)) {
		return typeof value === "string";
	} else if (numberFields.includes(mappedKey)) {
		return typeof value === "number";
	}
	return false;
}

export function isFieldForRooms(mappedKey: string): boolean {
	const stringFields = ["_fullname", "_shortname",
		"_room_number", "_room_name", "_address", "_type", "_furniture", "_href"];
	const numberFields = ["_lat", "_lon", "_seats"];

	if (stringFields.includes(mappedKey)) {
		return true;
	} else if (numberFields.includes(mappedKey)) {
		return true;
	}
	return false;
}

export function isFieldForSections(mappedKey: string): boolean {
	const stringFields = ["_dept", "_id", "_instructor", "_title", "_uuid"];
	const numberFields = ["_avg", "_pass", "_fail", "_audit", "_year"];

	if (stringFields.includes(mappedKey)) {
		return true;
	} else if (numberFields.includes(mappedKey)) {
		return true;
	}
	return false;
}

export function isValidApplyKey(key: any): boolean {
	return /^[^_]+$/g.test(key);
}

export function isValidArray(arr: any): boolean {
	return Array.isArray(arr) && arr !== null;
}

export function isValidObject(obj: any): boolean {
	return typeof obj === "object" && obj !== null;
}

export function isValidString(str: any): boolean {
	// return typeof str === "string" && str !== null && str !== "";
	return typeof str === "string";
}

export function isEmptyArray(arr: any): boolean {
	return arr.length === 0;
}

export async function getDatasetFromKind(kind: InsightDatasetKind, id: string): Promise<any>{
	switch (kind) {
		case InsightDatasetKind.Sections:
			return await jsonToSection(id);
		case InsightDatasetKind.Rooms:
			return await jsonToRooms(id);
		default:
			throw new InsightError("No dataset found with the given ID and kind");
	}
}

