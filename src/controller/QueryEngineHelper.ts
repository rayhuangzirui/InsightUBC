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


function sComHelper(entry: any, sCom: SCOMPARISON): boolean {
	const mappedField = fieldMap[sCom.skey.field];
	let sfieldEntry = entry[mappedField];
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
			if (group.map((entry) => entry[comKey]).some((value) => typeof value !== "number")) {
				throw new InsightError("MAX token only applies to number");
			}
			result = Math.max(...group.map((entry) => entry[comKey]));
			break;
		case "MIN":
			if (group.map((entry) => entry[comKey]).some((value) => typeof value !== "number")) {
				throw new InsightError("MIN token only applies to number");
			}
			result = Math.min(...group.map((entry) => entry[comKey]));
			break;
		case "AVG":
			if (group.map((entry) => entry[comKey]).some((value) => typeof value !== "number")) {
				throw new InsightError("AVG token only applies to number");
			}
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
			if (group.map((entry) => entry[comKey]).some((value) => typeof value !== "number")) {
				throw new InsightError("SUM token only applies to number");
			}
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

export function validateFieldWithKind(query: any, kind: InsightDatasetKind): boolean {
	let keys: ANYKEY[] = [];
	if (query.options) {
		if (query.options.columns && query.options.columns.anykey_list) {
			keys = query.options.columns.anykey_list;
			for (let key of keys) {
				if (typeof key === "string") {
					continue;
				} else {
					let mappedKey = fieldMap[key.field];
					kindFieldValidate(kind, mappedKey);
				}
			}
		}
	}
	if (query.body.filter) {
		filterFieldValidate(query.body.filter, kind);
	}
	if (query.transformations) {
		if (query.transformations.group) {
			let keysInGroup: Key[] = query.transformations.group.keys;
			for (let key of keysInGroup) {
				let mappedKey = fieldMap[key.field];
				kindFieldValidate(kind, mappedKey);
			}
		}
		if (query.transformations.apply) {
			for (let applyRule of query.transformations.apply) {
				let key: Key = applyRule.key;
				let mappedKey = fieldMap[key.field];
				kindFieldValidate(kind, mappedKey);
			}
		}
	}
	return true;
}

export function filterFieldValidate(filter: FILTER, kind: InsightDatasetKind): boolean {
	if (filter.logicComp) {
		return logicComFieldValidate(filter.logicComp, kind);
	} else if (filter.mComp) {
		return mComFieldValidate(filter.mComp, kind);
	} else if (filter.sComp) {
		return sComFieldValidate(filter.sComp, kind);
	} else if (filter.negation) {
		return filterFieldValidate(filter.negation.filter, kind);
	} else {
		return true;
	}
}

export function logicComFieldValidate(logicCom: LOGICCOMPARISON, kind: InsightDatasetKind): boolean {
	return logicCom.filter_list.every((innerFilter) => filterFieldValidate(innerFilter, kind));
}

export function mComFieldValidate(mCom: MCOMPARISON, kind: InsightDatasetKind): boolean {
	const mappedField = fieldMap[mCom.mkey.field];
	kindFieldValidate(kind, mappedField);
	return true;
}

export function sComFieldValidate(sCom: SCOMPARISON, kind: InsightDatasetKind): boolean {
	const mappedField = fieldMap[sCom.skey.field];
	kindFieldValidate(kind, mappedField);
	return true;
}

export function kindFieldValidate(kind: InsightDatasetKind, mappedField: string): void {
	if (kind === InsightDatasetKind.Rooms && isFieldForSections(mappedField)) {
		throw new InsightError("Cannot compare " + mappedField + " in Rooms dataset");
	}

	if (kind === InsightDatasetKind.Sections && isFieldForRooms(mappedField)) {
		throw new InsightError("Cannot compare " + mappedField + " in Sections dataset");
	}
}

