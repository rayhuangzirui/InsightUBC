import {
	COLUMNS, FILTER, Key, LOGICCOMPARISON, MCOMPARISON,
	Mkey, NEGATION, OPTIONS, ORDER, Query, SCOMPARISON, Skey, WHERE} from "./QueryInterfaces";
import {WhereClause, NOT, IS, Mfield, Sfield,
	LOGIC, MCOMPARATOR, OrderClause, ColumnsClause, OptionsClause} from "./ClausesEnum";
import {IDValidator, inputStringValidator, isMkey, isSkey, orderKeyValidator} from "./Validators";
import {InsightError} from "./IInsightFacade";

export function parseQuery(query: any): Query {
	if (typeof query !== "object") {
		throw new InsightError("Invalid JSON format");
	}
	let parsedQuery = query;

	try {
		let jsonQuery = JSON.stringify(query);
		JSON.parse(jsonQuery);
	} catch (e) {
		throw new InsightError("Invalid JSON format");
	}

	let body = Object.keys(parsedQuery)[0];
	if (!Object.values(WhereClause).includes(body as WhereClause)) {
		throw new InsightError("Invalid WHERE clause: " + body);
	}
	let options = Object.keys(parsedQuery)[1];
	if (!Object.values(OptionsClause).includes(options as OptionsClause)) {
		throw new InsightError("Invalid OPTIONS clause: " + options);
	}
	return {
		body: parseWhere(parsedQuery[body]),
		options: parseOptions(parsedQuery[options])
	};
}

export function parseWhere(where: any): WHERE {
	if (!where || Object.keys(where).length === 0) {
		return {};
	}
	if (Object.keys(where).length > 1) {
		throw new InsightError("WHERE should only have 1 key, has " + Object.keys(where).length);
	}
	return {
		filter: parseFilter(where),
	};
}
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

	let filters = logicCom[logicComparator];

	if (!filters || !Array.isArray(filters)) {
		throw new InsightError(logicComparator + " must be an array");
	}

	let parsedFilters: FILTER[] = [];

	if (filters.length === 0){
		throw new InsightError(logicComparator + " must be a non-empty");
	}

	for (let filter of filters) {
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

	let mComValue = mCom[mComparator];
	if (!mComValue || typeof mComValue !== "object") {
		throw new InsightError(mComparator + " has invalid key");
	}

	let mKey = Object.keys(mComValue)[0];
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

	return {
		idstring: idstring,
		field: mfield as Mfield,
	};
}


export function parseSComparison(sCom: any): SCOMPARISON {
	let sComparator = Object.keys(sCom)[0]; // IS

	let sComValue = sCom[sComparator];

	if (!sComValue || typeof sComValue !== "object") {
		throw new InsightError(sComValue + " has invalid key");
	}

	let skey = Object.keys(sComValue)[0];
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

export function parseNegation(negation: any): NEGATION {
	let not = Object.keys(negation)[0];
	let notValue = negation[not]; // filter

	if (!notValue || typeof notValue !== "object") {
		throw new InsightError(not + " has invalid key");
	}
	let filter = parseFilter(notValue);
	return {
		NOT: not as NOT,
		filter: filter,
	};
}

export function parseOptions(options: any): OPTIONS{
	if (!Object.prototype.hasOwnProperty.call(options, "COLUMNS")) {
		throw new InsightError("OPTIONS missing COLUMNS");
	}

	let columns = Object.keys(options)[0];
	if (!Object.values(ColumnsClause).includes(columns as ColumnsClause)) {
		throw new InsightError("Invalid COLUMNS clause: " + columns);
	}
	let keyList = options[columns];
	if (!keyList || !Array.isArray(keyList)) {
		throw new InsightError("Invalid columns list");
	}
	let order = Object.keys(options)[1];

	if (order !== undefined && !Object.values(OrderClause).includes(order as OrderClause)) {
		throw new InsightError("Invalid ORDER clause: " + order);
	}
	if (Object.prototype.hasOwnProperty.call(options, "ORDER")) {
		let orderKey = options["ORDER"];

		if (typeof orderKey !== "string") {
			throw new InsightError("Invalid ORDER key type: " + typeof orderKey);
		}

		if (keyList.includes(orderKey)) {
			return {
				columns: parseColumns(keyList),
				order: parseOrder(orderKey, keyList)
			};
		} else {
			throw new InsightError("ORDER key: " + orderKey + " is not found in COLUMNS key list");
		}
	} else {
		return {
			columns: parseColumns(keyList)
		};
	}
}

export function parseColumns(columns: any): COLUMNS {
	let keys: Key[] = [];
	for (const key of columns) {
		if (typeof key !== "string") {
			throw new InsightError("Expected COLUMNS keys to be string, but was " + typeof key);
		}
		let parsedKey = parseKey(key);
		if (!parsedKey) {
			throw new InsightError("Invalid key");
		}
		keys.push(parsedKey);
	}
	if (keys.length === 0) {
		throw new InsightError("COLUMNS must be a non-empty array");
	}
	return {
		key_list: keys,
	};
}

export function parseKey(key: any): Key{
	if (!key) {
		throw new InsightError("Invalid key");
	}

	if (isMkey(key)) {
		return parseMKey(key);
	} else if (isSkey(key)) {
		return parseSKey(key);
	} else {
		throw new InsightError("No appropriate key");
	}
}

export function parseOrder(orderKey: any, key_list: Key[]): ORDER {
	if (!orderKeyValidator(orderKey, key_list)) {
		throw new InsightError("ORDER key must be in COLUMNS");
	}
	return {
		key: parseKey(orderKey),
	};
}
