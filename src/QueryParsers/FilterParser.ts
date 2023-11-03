import {
	ANYKEY,
	FILTER,
	LOGICCOMPARISON,
	MCOMPARISON,
	Mkey,
	NEGATION,
	SCOMPARISON,
	Skey
} from "./QueryInterfaces";
import {IS, LOGIC, MCOMPARATOR, Mfield, NOT, Sfield} from "./ClausesEnum";
import {InsightError} from "../controller/IInsightFacade";
import {
	IDValidator,
	inputStringValidator,
	isMkey,
	isValidObject,
	isSkey,
	isValidArray
} from "./Validators";

export function parseFilter(filter: any): FILTER {
	if (!filter) {
		return {};
	}

	let filterClause = Object.keys(filter)[0];

	let parsedFilter: FILTER = {};

	if (Object.values(LOGIC).includes(filterClause as LOGIC)) {
		parsedFilter.logicComp = parseLogicComparison(filter);
	} else if (Object.values(MCOMPARATOR).includes(filterClause as MCOMPARATOR)) {
		parsedFilter.mComp = parseMComparison(filter);
	} else if (Object.values(IS).includes(filterClause as IS)) {
		parsedFilter.sComp = parseSComparison(filter);
	} else if (Object.values(NOT).includes(filterClause as NOT)) {
		parsedFilter.negation = parseNegation(filter);
	} else {
		throw new InsightError("Invalid filter key: " + filterClause);
	}

	return parsedFilter;
}

export function parseLogicComparison(logicCom: any): LOGICCOMPARISON {
	let logicComparator = Object.keys(logicCom)[0]; // AND, OR

	if (!isValidObject(logicCom)) {
		throw new InsightError(logicComparator + " must be an object");
	}

	let filters = logicCom[logicComparator];

	if (!isValidArray(filters)) {
		throw new InsightError(logicComparator + " must be an array");
	}

	let parsedFilters: FILTER[] = [];

	if (filters.length === 0){
		throw new InsightError(logicComparator + " must be a non-empty array");
	}

	for (let filter of filters) {
		if (!isValidObject(filter)) {
			throw new InsightError("Filter in " + logicComparator + " must be an object");
		}

		let parsedFilter = parseFilter(filter);
		parsedFilters.push(parsedFilter);
	}

	return {
		logic: logicComparator as LOGIC,
		filter_list: parsedFilters,
	};
}
export function parseMComparison(mCom: any): MCOMPARISON {
	let mComparator = Object.keys(mCom)[0]; // LT, GT, EQ;

	if (!isValidObject(mCom)) {
		throw new InsightError(mComparator + " must be an object");
	}

	let mComValue = mCom[mComparator];
	if (!isValidObject(mComValue)) {
		throw new InsightError(mComparator + " must be an object");
	}

	let mKey = Object.keys(mComValue)[0];
	if (!mKey || typeof mKey !== "string") {
		throw new InsightError(mKey + " must be a string");
	}
	let num = mComValue[mKey];

	if (typeof num !== "number") {
		throw new InsightError(mComparator + " expects a number. But was: " + typeof num);
	}

	return {
		mcomparator: mComparator as MCOMPARATOR,
		mkey: parseMKey(mKey),
		num: num,
	};
}


export function parseSComparison(sCom: any): SCOMPARISON {
	let sComparator = Object.keys(sCom)[0]; // IS
	if (!isValidObject(sCom)) {
		throw new InsightError(sComparator + " must be an object");
	}

	let sComValue = sCom[sComparator];

	if (!sComValue || typeof sComValue !== "object") {
		throw new InsightError(sComValue + " must be an object");
	}

	let skey = Object.keys(sComValue)[0];
	if (!skey || typeof skey !== "string") {
		throw new InsightError(skey + " must be a string");
	}
	let inputstring = sComValue[skey];

	if (typeof inputstring !== "string") {
		throw new InsightError("Expected inputstring to be string, but was: " + typeof inputstring);
	}

	if (!inputStringValidator(inputstring)) {
		throw new InsightError("Invalid input string: Asterisk (*) can only be the first or last characters");
	}

	return {
		is: sComparator as IS,
		skey: parseSKey(skey),
		inputstring:inputstring,
	};
}

export function parseNegation(negation: any): NEGATION {
	let not = Object.keys(negation)[0];
	if (!isValidObject(negation)) {
		throw new InsightError(not + " must be an object");
	}

	let notValue = negation[not]; // filter

	if (!isValidObject(notValue) || Array.isArray(notValue)) {
		throw new InsightError(not + " must be an object");
	}

	let filter = parseFilter(notValue);
	return {
		NOT: not as NOT,
		filter: filter,
	};
}

export function parseKey(key: any): ANYKEY{
	if (!key || typeof key !== "string") {
		throw new InsightError("Invalid key");
	}

	if (!key.includes("_")) {
		// key is applykey
		return key;
	}

	if (isMkey(key)) {
		return parseMKey(key);
	} else if (isSkey(key)) {
		return parseSKey(key);
	}

	throw new InsightError("Invalid key " + key);
}

export function parseSKey(sKey: any): Skey {
	if (typeof sKey !== "string") {
		throw new InsightError("Expected sKey to be a string");
	}

	let parts = sKey.split("_");
	if (parts.length !== 2) {
		throw new InsightError("Invalid mkey format: " + sKey);
	}
	let [idstring, sfield] = parts;

	if (!sKey.includes("_")) {
		throw new InsightError("Invalid skey format");
	}
	if (!IDValidator(idstring)) {
		throw new InsightError("Invalid ID");
	}
	if (!Object.values(Sfield).includes(sfield as Sfield)) {
		throw new InsightError("Invalid sfield value");
	}
	return {
		idstring: idstring,
		field: sfield as Sfield,
	};
}

export function parseMKey(mKey: any): Mkey {
	if (typeof mKey !== "string") {
		throw new InsightError("Expected mKey to be a string");
	}

	if (!mKey.includes("_")) {
		throw new InsightError("Invalid mkey format");
	}

	let parts = mKey.split("_");

	if (parts.length !== 2) {
		throw new InsightError("Invalid mkey format: " + mKey);
	}

	let [idstring, mfield] = parts;
	if (!IDValidator(idstring)) {
		throw new InsightError("Invalid ID");
	}

	if (!Object.values(Mfield).includes(mfield as Mfield)) {
		throw new InsightError("Invalid mfield value");
	}

	// idstring_mfield validation

	return {
		idstring: idstring,
		field: mfield as Mfield,
	};
}
