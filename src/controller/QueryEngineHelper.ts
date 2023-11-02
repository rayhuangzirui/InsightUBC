import {ANYKEY, FILTER, Key, LOGICCOMPARISON, MCOMPARISON, SCOMPARISON} from "../QueryParsers/QueryInterfaces";
import {APPLYTOKEN, LOGIC, MCOMPARATOR, Mfield, Sfield} from "../QueryParsers/ClausesEnum";
import {isFieldForRooms, isFieldForSections, isValidField} from "../QueryParsers/Validators";
import {InsightDatasetKind, InsightError} from "./IInsightFacade";
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

export function filterHelper(entry: any, filter: FILTER, kind: InsightDatasetKind): boolean {
	if (filter.logicComp) {
		return logicComHelper(entry, filter.logicComp, kind);
	} else if (filter.mComp) {
		return mComHelper(entry, filter.mComp, kind);
	} else if (filter.sComp) {
		return sComHelper(entry, filter.sComp, kind);
	} else if (filter.negation) {
		return !filterHelper(entry, filter.negation.filter, kind);
	} else {
    // No matched return true to the entry
		return true;
	}
}

function logicComHelper(entry: any, logicCom: LOGICCOMPARISON, kind: InsightDatasetKind): boolean {
	if (logicCom.logic === LOGIC.AND) {
		return logicCom.filter_list.every((innerFilter) => filterHelper(entry, innerFilter, kind));
	} else if (logicCom.logic === LOGIC.OR) {
		return logicCom.filter_list.some((innerFilter) => filterHelper(entry, innerFilter, kind));
	} else {
		return true;
	}
}
function mComHelper(entry: any, mCom: MCOMPARISON, kind: InsightDatasetKind): boolean {
	const mappedField = fieldMap[mCom.mkey.field];

	// For other fields, use the original logic
	let mfieldEntry = entry[mappedField];
	if (kind === InsightDatasetKind.Rooms && isFieldForSections(mappedField)) {
		throw new InsightError("Cannot compare " + mappedField + " in Rooms dataset");
	}

	if (kind === InsightDatasetKind.Sections && isFieldForRooms(mappedField)) {
		throw new InsightError("Cannot compare " + mappedField + " in Sections dataset");
	}
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


function sComHelper(entry: any, sCom: SCOMPARISON, kind: InsightDatasetKind): boolean {
	const mappedField = fieldMap[sCom.skey.field];
	let sfieldEntry = entry[mappedField];
	if (kind === InsightDatasetKind.Rooms && isFieldForSections(mappedField)) {
		throw new InsightError("Cannot compare " + mappedField + " in Rooms dataset");
	}

	if (kind === InsightDatasetKind.Sections && isFieldForRooms(mappedField)) {
		throw new InsightError("Cannot compare " + mappedField + " in Sections dataset");
	}
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

export function selectColumnsHelper(entry: any, keys: ANYKEY[], kind: InsightDatasetKind): any {
	let projectedEntry: any = {};
	for (let key of keys) {
		let comKey;

		if (typeof key === "string") {
			comKey = key;
			projectedEntry[comKey] = entry[key];
		} else {
			comKey = `${key.idstring}_${key.field}`;
			let mappedKey = fieldMap[key.field];
			if (kind === InsightDatasetKind.Rooms && isFieldForSections(mappedKey)) {
				throw new InsightError("Cannot compare " + mappedKey + " in Rooms dataset");
			}

			if (kind === InsightDatasetKind.Sections && isFieldForRooms(mappedKey)) {
				throw new InsightError("Cannot compare " + mappedKey + " in Sections dataset");
			}
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

