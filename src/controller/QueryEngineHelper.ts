import {ANYKEY, FILTER, Key, LOGICCOMPARISON, MCOMPARISON, SCOMPARISON} from "../QueryParsers/QueryInterfaces";
import {LOGIC, MCOMPARATOR, Mfield, Sfield} from "../QueryParsers/ClausesEnum";
import {isValidField} from "../QueryParsers/Validators";

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

	// Rooms dataset Mfileds
	lat: "_lat",
	lon: "_lon",
	seats: "_seats",

	// Rooms dataset Sfields
	fullname: "_fullname",
	shortname: "_shortname",
	number: "_number",
	name: "_name",
	address: "_address",
	type: "_type",
	furniture: "_furniture",
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
	const mfieldEntry = entry[mappedField];
	switch (mCom.mcomparator) {
		case MCOMPARATOR.LT:
			return mfieldEntry < mCom.num;
		case MCOMPARATOR.EQ:
			return mfieldEntry === mCom.num;
		case MCOMPARATOR.GT:
			return mfieldEntry > mCom.num;
		default:
			return true;
	}
}

function sComHelper(entry: any, sCom: SCOMPARISON): boolean {
	const mappedField = fieldMap[sCom.skey.field];
	const sfieldEntry = entry[mappedField];

	if (sCom.inputstring.startsWith("*") && sCom.inputstring.endsWith("*")) {
		const string = sCom.inputstring.slice(1, -1);
		return sfieldEntry.includes(string);
	} else if (sCom.inputstring.startsWith("*")) {
		return sfieldEntry.endsWith(sCom.inputstring.slice(1));
	} else if (sCom.inputstring.endsWith("*")) {
		return sfieldEntry.startsWith(sCom.inputstring.slice(0, -1));
	}

	return sfieldEntry === sCom.inputstring;
}

export function selectColumnsHelper(entry: any, keys: ANYKEY[]): any {
	let projectedEntry: any = {};
	for (let key of keys) {
		let comKey;

		if (typeof key === "string") {
			comKey = key;
		} else {
			comKey = `${key.idstring}_${key.field}`;
		}
		let mappedKey = (typeof key !== "string") ? fieldMap[key.field] : key;

		if (!isValidField(mappedKey, entry[mappedKey])) {
			return {};
		}

		projectedEntry[comKey] = entry[mappedKey];
	}
	return projectedEntry;
}
