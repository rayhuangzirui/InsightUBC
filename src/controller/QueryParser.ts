import {
	COLUMNS, FILTER, Key, LOGICCOMPARISON, MCOMPARISON, Mkey, NEGATION, OPTIONS, ORDER,
	Query, SCOMPARISON, Skey, WHERE
} from "./QueryInterfaces";
import {
	WhereClause, NOT, IS, Mfield, Sfield, LOGIC, MCOMPARATOR, OrderClause, ColumnsClause, OptionsClause
} from "./ClausesEnum";
import {IDValidator, inputStringValidator, isMkey, isSkey, orderKeyValidator} from "./Validators";
import {InsightError} from "./IInsightFacade";

export class QueryParser {
// todo: 调用parseQuery的地方必须catch InsightError 并且 return一个被拒绝的error
	public parseQuery(query: any): Query {
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
			body: this.parseWhere(parsedQuery[body]),
			options: this.parseOptions(parsedQuery[options])
		};
	}

	public parseWhere(where: any): WHERE {
		let filter = where[WhereClause.WHERE];
		if (!filter) {
			return {};
		}

		return {
			filter: filter,
		};
	}

	public parseFilter(filter: any): FILTER {
		if (!filter) {
			return {};
		}

		let filterClause = Object.keys(filter)[0];
		let parsedFilter: FILTER = {};

		if (Object.values(LOGIC).includes(filterClause as LOGIC)) {
			parsedFilter.logicComp = this.parseLogicComparison(filter);
		} else if (Object.values(MCOMPARATOR).includes(filterClause as MCOMPARATOR)) {
			parsedFilter.mComp = this.parseMComparison(filter);
		} else if (Object.values(IS).includes(filterClause as IS)) {
			parsedFilter.sComp = this.parseSComparison(filter);
		} else if (Object.values(NOT).includes(filterClause as NOT)) {
			parsedFilter.negation = this.parseNegation(filter);
		} else {
			throw new InsightError("Invalid filter key: " + filterClause);
		}

		return parsedFilter;
	}

	// options 必须有columns, orders是可选的,且columns必须包含一个key(mkey或者skey)
	// 且columns在前 orders在后
	public parseOptions(options: any): OPTIONS {
		let columns = Object.keys(options)[0];
		if (!Object.values(ColumnsClause).includes(columns as ColumnsClause)) {
			throw new InsightError("Invalid COLUMNS clause: " + columns);
		}

		let keyList = options[columns];
		if (!keyList || !Array.isArray(keyList)) {
			throw new InsightError("Invalid columns list");
		}

		if (Object.prototype.hasOwnProperty.call(options, "ORDER")) {
			let orderValue = options.ORDER;
			if (typeof orderValue !== "string") {
				throw new InsightError("ORDER field is not a string");
			}
			if (!(this.validateMField(orderValue) || this.validateSField(orderValue))) {
				throw new InsightError("Invalid ORDER filed: " + orderValue);
			} else {
				return {
					columns: this.parseColumns(keyList),
					order: this.parseOrder(options[orderValue], keyList)
				};
			}
		} else {
			return {
				columns: this.parseColumns(keyList)
			};
		}
	}

	public parseLogicComparison(logicCom: any): LOGICCOMPARISON {
		let logicComparator = Object.keys(logicCom)[0];
		let filters = logicCom[logicComparator];

		if (!filters || typeof filters !== "object") {
			throw new InsightError(logicComparator + " must be an array");
		}

		if (filters.isEmpty()) {
			throw new InsightError(logicComparator + " must be a non-empty");
		}

		let parsedFilters = [];
		for (let filter of filters) {
			let parsedFilter = this.parseFilter(filter);
			if (!parsedFilter) {
				throw new InsightError("Invalid filter");
			}
			parsedFilters.push(parsedFilter);
		}

		return {
			logic: logicComparator as LOGIC,
			filter_list: parsedFilters
		};
	}

	public parseMComparison(mCom: any): MCOMPARISON {
		let mComparator = Object.keys(mCom)[0];
		let mComValue = mCom[mComparator];

		if (!mComValue || typeof mComValue !== "object") {
			throw new InsightError(mComparator + " has invalid key");
		}

		let mKey = Object.keys(mComValue)[0];
		let num = mComValue[mKey];

		return {
			mcomparator: mComparator as MCOMPARATOR,
			mkey: this.parseMKey(mKey),
			num: num
		};
	}

	public parseMKey(mKey: any): Mkey {
		if (typeof mKey !== "string" || !mKey.includes("_")) {
			throw new InsightError("Invalid mkey format");
		}

		const [idstring, mfield] = mKey.split("_");
		if (IDValidator(idstring)) {
			throw new InsightError("Invalid ID");
		}

		if (!Object.values(Mfield).includes(mfield as Mfield)) {
			throw new InsightError("Invalid mfield value");
		}

		return {
			idstring: idstring,
			field: mfield as Mfield
		};
	}

	// ... similar pattern for parseSComparison, parseSKey ...

	public parseSComparison(sCom: any): SCOMPARISON {
		let sComparator = Object.keys(sCom)[0];
		let sComValue = sCom[sComparator];

		if (!sComValue || typeof sComValue !== "object") {
			throw new InsightError(sComparator + " has invalid key");
		}

		let skey = Object.keys(sComValue)[0];
		let inputstring = sComValue[skey];

		if (!inputStringValidator(inputstring)) {
			throw new InsightError("Invalid input string: Asterisk (*) can only be the first or last characters");
		}

		return {
			is: sComparator as IS,
			skey: this.parseSKey(skey),
			inputstring: inputstring
		};
	}

	public parseSKey(sKey: any): Skey {
		if (typeof sKey !== "string" || !sKey.includes("_")) {
			throw new InsightError("Invalid skey format");
		}

		const [idstring, sfield] = sKey.split("_");
		if (IDValidator(idstring)) {
			throw new InsightError("Invalid ID");
		}

		if (!Object.values(Sfield).includes(sfield as Sfield)) {
			throw new InsightError("Invalid sfield value");
		}

		return {
			idstring: idstring,
			field: sfield as Sfield
		};
	}

	public validateMField(field: string): boolean {
		return Object.values(Mfield).includes(field as Mfield);
	}

	public validateSField(field: string): boolean {
		return Object.values(Sfield).includes(field as Sfield);
	}

	public parseOrder(order: any, key_list: Key[]): ORDER {
		if (!orderKeyValidator(order.key, key_list)) {
			throw new InsightError("ORDER key must be in COLUMNS");
		}

		return {
			key: this.parseKey(order)
		};
	}

	public parseNegation(negation: any): NEGATION {
		let not = Object.keys(negation)[0];
		let notValue = negation[not]; // filter

		if (!notValue || typeof notValue !== "object") {
			throw new InsightError(not + " has invalid key");
		}

		let filter = this.parseFilter(notValue);

		return {
			NOT: not as NOT,
			filter: filter
		};
	}

	public parseColumns(columns: any): COLUMNS {
		let keys: Key[] = [];
		for (const key of columns) {
			let parsedKey = this.parseKey(key);
			if (!parsedKey) {
				throw new InsightError("Invalid key");
			}
			keys.push(parsedKey);
		}

		return {
			key_list: keys
		};
	}

	public parseKey(key: any): Key {
		if (!key) {
			throw new InsightError("Invalid key");
		}

		if (isMkey(key)) {
			return this.parseMKey(key);
		} else if (isSkey(key)) {
			return this.parseSKey(key);
		} else {
			throw new InsightError("No appropriate key");
		}
	}
}


