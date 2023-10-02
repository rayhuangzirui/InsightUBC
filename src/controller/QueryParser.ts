import {
	COLUMNS,
	FILTER, IS, Key,
	LOGIC,
	LOGICCOMPARISON,
	MCOMPARATOR,
	MCOMPARISON,
	Mfield,
	Mkey, NEGATION, NOT, OPTIONS, ORDER,
	Query, SCOMPARISON, Sfield, Skey,
	WHERE
} from "./QueryInterfaces";
import {IDValidator, inputStringValidator, isMkey, isSkey} from "./StringValidators";

export function parseQuery(query: any): Query {
	let parsedQuery;
	try {
		parsedQuery = JSON.parse(query);
	} catch (e) {
		throw new Error("Invalid JSON format");
	}

	if (!parsedQuery) {
		throw new Error("Invalid Query format");
	} else if (!Object.prototype.hasOwnProperty.call(parsedQuery, "body")) {
		throw new Error("Missing WHERE");
	} else if (!Object.prototype.hasOwnProperty.call(parsedQuery, "options")) {
		throw new Error("Missing OPTIONS");
	}

	return {
		body: parseWhere(parsedQuery.body),
		options: parseOptions(parsedQuery.options)
	};
}

export function parseWhere(where: any): WHERE {
	if (!where) {
		return {};
	}

	if (Object.prototype.hasOwnProperty.call(where, "filter")) {
		return {
			filter: parseFilter(where.filter)
		};
	}

	return {};
}
export function parseFilter(filter: any): FILTER {
	if (!filter) {
		return {};
	}

	let parsedFilter: FILTER = {};

	if (filter.AND || filter.OR) {
		parsedFilter.logicComp = parseLogicComparison(filter);
	} else if (filter.LT || filter.GT || filter.EQ) {
		parsedFilter.mComp = parseMComparison(filter);
	} else if (filter.IS) {
		parsedFilter.sComp = parseSComparison(filter);
	} else if (filter.NOT) {
		parsedFilter.negation = parseNegation(filter);
	} else {
		throw new Error("Invalid filter key");
	}

	return parsedFilter;
}

export function parseLogicComparison(logicCom: any): LOGICCOMPARISON {
	let logic = logicCom.AND ? LOGIC.AND : LOGIC.OR;
	let filters = logicCom[logic].map((f: FILTER) => parseFilter(f));

	if (filters.length === 0) {
		throw new Error(logic + " must be a non-empty array");
	}

	return {
		logic: logic,
		filter_list: filters,
	};
}
export function parseMComparison(mCom: any): MCOMPARISON {
	let mComparator = mCom.LT ? MCOMPARATOR.LT : mCom.GT ? MCOMPARATOR.GT : MCOMPARATOR.EQ;
	let mKey = mCom.mkey;
	let num = mCom.num;

	return {
		mcomparator: mComparator,
		mkey: parseMKey(mKey),
		num: num,
	};
}

export function parseMKey(mKey: any): Mkey {
  // handle validation of mkey
	if (typeof mKey !== "string" || mKey[0] !== "\"" || mKey[mKey.length - 1] !== "\"" || !mKey.includes("_")) {
		throw new Error("Invalid mkey format");
	}

  // remove the double quote and split idstring and mfield by underscore
	const [idstring, mfield] = mKey.slice(1, -1).split("_");

  // handle validation of idstring
	if (IDValidator(idstring)) {
		throw new Error("Invalid ID");
	}

  // handle mfield
	if (!Object.values(Mfield).includes(mfield as Mfield)) {
		throw new Error("Invalid mfield value");
	}

	return {
		idstring: idstring,
		mfield: mfield as Mfield,
	};
}


export function parseSComparison(sCom: any): SCOMPARISON {
	if (!sCom || sCom.is !== IS.IS || !sCom.skey || typeof sCom.inputstring !== "string") {
		throw new Error("Invalid SCOMPARISON format");
	}

	if (!inputStringValidator(sCom.inputstring)) {
		throw new Error("Invalid input string: Asterisk (*) can only be the first or last characters");
	}

	return {
		is: IS.IS,
		skey: parseSKey(sCom.skey),
		inputstring:sCom.inputstring,
	};
}

export function parseSKey(sKey: any): Skey {
  // handle validation of mkey
	if (typeof sKey !== "string" || sKey[0] !== "\"" || sKey[sKey.length - 1] !== "\"" || !sKey.includes("_")) {
		throw new Error("Invalid skey format");
	}

  // remove the double quote and split idstring and mfield by underscore
	const [idstring, sfield] = sKey.slice(1, -1).split("_");

  // handle validation of idstring
	if (!IDValidator(idstring)) {
		throw new Error("Invalid ID");
	}

  // handle mfield
	if (!Object.values(Sfield).includes(sfield as Sfield)) {
		throw new Error("Invalid sfield value");
	}

	return {
		idstring: idstring,
		sfield: sfield as Sfield,
	};
}


export function parseNegation(negation: any): NEGATION {
	if (!negation || !negation.NOT || negation.NOT !== NOT.NOT) {
		throw new Error("Invalid negation format");
	}

	const filter = parseFilter(negation.filter);
	if (!filter) {
		throw new Error("No filter");
	}

	return {
		NOT: NOT.NOT,
		filter: filter,
	};
}

export function parseOptions(options: any): OPTIONS{
	if (!options) {
		throw new Error("Invalid OPTIONS format");
	}

	const columns = parseColumns(options.columns);
	if (!columns || columns.key_list.length === 0) {
		throw new Error("Invalid COLUMNS");
	}

	let order;

	if (options.order) {
		order = parseOrder(options.order);
	}

	return {
		columns: columns,
		order: order,
	};
}

export function parseColumns(columns: any): COLUMNS {
	if (!columns || !Array.isArray((columns.key_list))) {
		throw new Error("Invalid columns format");
	}

	const keys: Key[] = [];
	for (const key of columns.key_list) {
		const parsedKey = parseKey(key);
		if (!parsedKey) {
			throw new Error("Invalid key");
		}
		keys.push(parsedKey);
	}

	return {
		key_list: keys,
	};
}

export function parseKey(key: any): Key {
	if (!key) {
		throw new Error("Invalid key");
	}

	if (isMkey(key)) {
		return parseMKey(key);
	} else if (isSkey(key)) {
		return parseSKey(key);
	} else {
		throw new Error("No appropriate key");
	}
}

export function parseOrder(order: any): ORDER {
	return {
		key: parseKey(order),
	};
}
