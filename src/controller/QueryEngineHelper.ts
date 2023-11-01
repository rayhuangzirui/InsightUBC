import {ANYKEY, FILTER, Key, LOGICCOMPARISON, MCOMPARISON, SCOMPARISON} from "../QueryParsers/QueryInterfaces";
import {APPLYTOKEN, LOGIC, MCOMPARATOR, Mfield, Sfield} from "../QueryParsers/ClausesEnum";
import {isValidField} from "../QueryParsers/Validators";
import {InsightError} from "./IInsightFacade";
import {Decimal} from "decimal.js";

export const fieldMap: {[key in Mfield | Sfield]: string} = {
	avg: "_avg",
	pass: "_pass",
	fail: "_fail",
	audit: "_audit",
	year: "_year",
	dept: "_dept",
	id: "_id",
	instructor: "_instructor",
	title: "_title",
	uuid: "_uuid",

	// Rooms dataset Mfileds (numbers)
	lat: "_lat",
	lon: "_lon",
	seats: "_seats", // In rooms

	// Rooms dataset Sfields (strings)
	fullname: "_fullname",
	shortname: "_shortname",
	number: "_room_number", // In rooms
	name: "_room_name", // In rooms
	address: "_address",
	type: "_type", // In rooms
	furniture: "_furniture", // In rooms
	href: "_href",
};

export function filterHelper(entry: any, filter: FILTER): boolean {
	if (filter.logicComp) {
		return logicComHelper(entry, filter.logicComp);
	} else if (filter.mComp) {
		return mComHelper(entry, filter.mComp);
	} else if (filter.sComp) {
		return sComHelper(entry, filter.sComp);
	} else if (filter.negation) {
		return !filterHelper(entry, filter.negation.filter);
	} else {
    // No matched return true to the entry
		return true;
	}
}

function logicComHelper(entry: any, logicCom: LOGICCOMPARISON): boolean {
	if (logicCom.logic === LOGIC.AND) {
		return logicCom.filter_list.every((innerFilter) => filterHelper(entry, innerFilter));
	} else if (logicCom.logic === LOGIC.OR) {
		return logicCom.filter_list.some((innerFilter) => filterHelper(entry, innerFilter));
	} else {
		return true;
	}
}
function mComHelper(entry: any, mCom: MCOMPARISON): boolean {
	const mappedField = fieldMap[mCom.mkey.field];
	// if (mappedField === "_seats") {
	// 	// Iterate over each room and check if any room satisfies the condition
	// 	for (let room of entry["_rooms"]) {
	// 		if (compare(room["_seats"], mCom.mcomparator, mCom.num)) {
	// 			return true;
	// 		}
	// 	}
	// 	return false; // If no room satisfies the condition
	// }

	// For other fields, use the original logic
	let mfieldEntry = entry[mappedField];
	return compare(mfieldEntry, mCom.mcomparator, mCom.num);
}

function compare(value: number, comparator: MCOMPARATOR, num: number): boolean {
	switch (comparator) {
		case MCOMPARATOR.LT:
			return value < num;
		case MCOMPARATOR.EQ:
			return value === num;
		case MCOMPARATOR.GT:
			return value > num;
		default:
			return true;
	}
}

// function sComHelper(entry: any, sCom: SCOMPARISON): boolean {
// 	const mappedField = fieldMap[sCom.skey.field];
// 	let sfieldEntry;
// 	if (["_room_name", "_room_number", "_type", "_furniture"].includes(mappedField)) {
// 		for (let room of entry["_rooms"]) {
// 			sfieldEntry = room[mappedField];
// 			if (sfieldEntry === sCom.inputstring) {
// 				return true;
// 			}
// 		}
// 		return false;
// 	}
// 	sfieldEntry = entry[mappedField];
//
// 	if (sCom.inputstring.startsWith("*") && sCom.inputstring.endsWith("*")) {
// 		const string = sCom.inputstring.slice(1, -1);
// 		return sfieldEntry.includes(string);
// 	} else if (sCom.inputstring.startsWith("*")) {
// 		return sfieldEntry.endsWith(sCom.inputstring.slice(1));
// 	} else if (sCom.inputstring.endsWith("*")) {
// 		return sfieldEntry.startsWith(sCom.inputstring.slice(0, -1));
// 	}
//
// 	return sfieldEntry === sCom.inputstring;
// }

function sComHelper(entry: any, sCom: SCOMPARISON): boolean {
	const mappedField = fieldMap[sCom.skey.field];
	let sfieldEntry = entry[mappedField];

	// Check if the mappedField is one of the room-specific fields
	// if (["_room_name", "_room_number", "_type", "_furniture"].includes(mappedField)) {
	// 	sfieldEntry = entry["_rooms"].map((room: any) => room[mappedField]);
	// } else {
	// 	sfieldEntry = entry[mappedField];
	// }

	// if (Array.isArray(sfieldEntry)) {
	// 	// For array values, we'll check if any room entry matches the string pattern
	// 	return sfieldEntry.some((value: string) => isStringMatch(value, sCom.inputstring));
	// }

	return isStringMatch(sfieldEntry, sCom.inputstring);
}

function isStringMatch(fieldValue: string, pattern: string): boolean {
	if (pattern.startsWith("*") && pattern.endsWith("*")) {
		const string = pattern.slice(1, -1);
		return fieldValue.includes(string);
	} else if (pattern.startsWith("*")) {
		return fieldValue.endsWith(pattern.slice(1));
	} else if (pattern.endsWith("*")) {
		return fieldValue.startsWith(pattern.slice(0, -1));
	}

	return fieldValue === pattern;
}

export function selectColumnsHelper(entry: any, keys: ANYKEY[]): any {
	let projectedEntry: any = {};
	for (let key of keys) {
		let comKey;

		if (typeof key === "string") {
			comKey = key;
			projectedEntry[comKey] = entry[key];
		} else {
			comKey = `${key.idstring}_${key.field}`;
			let mappedKey = fieldMap[key.field];
			// if (["_room_name", "_room_number", "_type", "_furniture", "_seats"].includes(mappedKey)) {
			// 	// If the field is in the "_rooms" array, get its values
			// 	projectedEntry[comKey] = entry["_rooms"].map((room: any) => room[mappedKey]);
			// } else {
			// 	// If not, maintain original logic
			// 	if (!isValidField(mappedKey, entry[mappedKey])) {
			// 		return {};
			// 	}
			// 	projectedEntry[comKey] = entry[mappedKey];
			// }
			if (!isValidField(mappedKey, entry[mappedKey])) {
				return {};
			}
			projectedEntry[comKey] = entry[mappedKey];
		}
	}
	return projectedEntry;
}

export function calculateValueByToken(token: APPLYTOKEN, group: any[], comKey: string): number {
	let result: number;
	let total: Decimal;
	let avg: number;

	switch(token) {
		case "MAX":
			result = Math.max(...group.map((entry) => entry[comKey]));
			break;
		case "MIN":
			result = Math.min(...group.map((entry) => entry[comKey]));
			break;
		case "AVG":
			total = new Decimal(0);
			for(let entry of group) {
				total = total.add(new Decimal(entry[comKey]));
			}
			avg = total.toNumber() / group.length;
			result = Number(avg.toFixed(2));
			break;
		case "COUNT":
			result = new Set(group.map((entry) => entry[comKey])).size;
			break;
		case "SUM":
			total = group.reduce((acc, entry) => acc + entry[comKey], 0);
			result = Number(total.toFixed(2));
			break;
		default:
			throw new InsightError(`Unsupported token: ${token}`);
	}

	return result;
}


export function constructGroupKey(entry: any, keys: Key[]): string {
	return keys.map((key) => entry[fieldMap[key.field]]).join("");
}

