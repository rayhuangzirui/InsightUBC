import {
	COLUMNS,
	FILTER, Key,
	LOGICCOMPARISON,
	MCOMPARISON,
	Mkey, NEGATION, OPTIONS, ORDER,
	Query, SCOMPARISON, Skey,
	WHERE
} from "./QueryInterfaces";
import {WhereClause, NOT, IS, Mfield, Sfield,
	LOGIC, MCOMPARATOR, OrderClause, ColumnsClause, OptionsClause} from "./ClausesEnum";
import {IDValidator, inputStringValidator, isMkey, isSkey, orderKeyValidator} from "./Validators";
import {InsightError} from "./IInsightFacade";

export function parseQuery(query: any): Query {
	let parsedQuery;
	try {
		parsedQuery = JSON.parse(query);
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
	// the filter in where is optional
	let filter = where[WhereClause.WHERE];
	if (!filter) {
		return {};
	}

	return {
		filter: filter,
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

	if (!filters || typeof filters !== "object") {
		throw new InsightError(logicComparator + " must be an array");
	}

	if (filters.isEmpty()){
		throw new InsightError(logicComparator + " must be a non-empty");
	}

	for (let filter of filters) {
		let parsedFilter = parseFilter(filter);
		if (!parseFilter) {
			throw new InsightError("Invalid filter");
		}
		filters.push(parsedFilter);
	}

	return {
		logic: logicComparator as LOGIC,
		filter_list: filters,
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

	return {
		mcomparator: mComparator as MCOMPARATOR,
		mkey: parseMKey(mKey),
		num: num,
	};
}

export function parseMKey(mKey: any): Mkey {
  // handle validation of mkey
	if (typeof mKey !== "string" || !mKey.includes("_")) {
		throw new InsightError("Invalid mkey format");
	}

  // remove the double quote and split idstring and mfield by underscore
	const [idstring, mfield] = mKey.split("_");

  // handle validation of idstring
	if (IDValidator(idstring)) {
		throw new InsightError("Invalid ID");
	}

  // handle mfield
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
  // handle validation of mkey
	if (typeof sKey !== "string" || !sKey.includes("_")) {
		throw new InsightError("Invalid skey format");
	}

  // remove the double quote and split idstring and mfield by underscore
	const [idstring, sfield] = sKey.split("_");

  // handle validation of idstring
	if (!IDValidator(idstring)) {
		throw new InsightError("Invalid ID");
	}

  // handle sfield
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
	let columns = Object.keys(options)[0];
	if (!Object.values(ColumnsClause).includes(columns as ColumnsClause)) {
		throw new InsightError("Invalid COLUMNS clause: " + columns);
	}

	let keyList = options[columns];
	if (!keyList || !Array.isArray(keyList)) {
		throw new InsightError("Invalid columns list");
	}

	if (Object.prototype.hasOwnProperty.call(options, "ORDER")) {
		let orderClause = Object.values(options)[1];
		if (!Object.values(OrderClause).includes(orderClause as OrderClause)) {
			throw new InsightError("Invalid ORDER clause: " + orderClause);
		}

		if (typeof orderClause === "string" && orderClause in options) {
			return {
				columns: parseColumns(keyList),
				order: parseOrder(options[orderClause], keyList)
			};
		} else {
			throw new InsightError("Invalid ORDER format");
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
		let parsedKey = parseKey(key);
		if (!parsedKey) {
			throw new InsightError("Invalid key");
		}
		keys.push(parsedKey);
	}

	return {
		key_list: keys,
	};
}

export function parseKey(key: any): Key{
	if (!key) {
		throw new InsightError("Invalid key");
		// return null;
	}

	if (isMkey(key)) {
		return parseMKey(key);
	} else if (isSkey(key)) {
		return parseSKey(key);
	} else {
		throw new InsightError("No appropriate key");
		// return null;
	}
}

export function parseOrder(order: any, key_list: Key[]): ORDER {
	if (!orderKeyValidator(order.key, key_list)) {
		throw new InsightError("ORDER key must be in COLUMNS");
	}

	return {
		key: parseKey(order),
	};
}
