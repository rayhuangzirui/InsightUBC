import {COLUMNS, Key, OPTIONS, ORDER} from "./QueryInterfaces";
import {InsightError} from "../controller/IInsightFacade";
import {ColumnsClause, OrderClause} from "./ClausesEnum";
import {orderKeyValidator} from "./Validators";
import {parseKey} from "./FilterParser";

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

export function parseOrder(orderKey: any, key_list: Key[]): ORDER {
	if (!orderKeyValidator(orderKey, key_list)) {
		throw new InsightError("ORDER key must be in COLUMNS");
	}
	return {
		key: parseKey(orderKey),
	};
}
