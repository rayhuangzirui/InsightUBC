import {ANYKEY, COLUMNS, Key, OPTIONS, ORDER} from "./QueryInterfaces";
import {InsightError} from "../controller/IInsightFacade";
import {ColumnsClause, OrderClause} from "./ClausesEnum";
import {isValidObject, isValidArray, isValidString, orderKeyValidator} from "./Validators";
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
		let orderValue = options["ORDER"];
		return {
			columns: parseColumns(keyList),
			order: parseOrder(orderValue, keyList)
		};

		// if (typeof orderKey !== "string") {
		// 	throw new InsightError("Invalid ORDER key type: " + typeof orderKey);
		// }
		// if (keyList.includes(orderKey)) {
		// 	return {
		// 		columns: parseColumns(keyList),
		// 		order: parseOrder(orderKey, keyList)
		// 	};
		// } else {
		// 	throw new InsightError("ORDER key: " + orderKey + " is not found in COLUMNS key list");
		// }
	} else {
		return {
			columns: parseColumns(keyList)
		};
	}
}
export function parseColumns(columns: any): COLUMNS {
	let keys: ANYKEY[] = [];
	for (const key of columns) {
		if (!isValidString(key)) {
			throw new InsightError("Expected COLUMNS keys to be string, but was " + typeof key);
		}

		if (key.includes("_")) {
			// key is mkey or skey
			keys.push(parseKey(key));
			continue;
		}

		// key is applykey
		keys.push(key);
	}
	if (keys.length === 0) {
		throw new InsightError("COLUMNS must be a non-empty array");
	}
	return {
		anykey_list: keys,
	};
}

export function parseOrder(order: any, key_list: Key[]): ORDER {
	if (isValidString(order)) { // single key
		if (!orderKeyValidator(order, key_list)) {
			throw new InsightError("ORDER key must be in COLUMNS");
		}

		if (!order.includes("_")) {
			// order key is applykey
			return {
				anykey: order,
			};
		}

		// order key is mkey or skey
		return {
			anykey: parseKey(order),
		};
	} else if (isValidObject(order) && Object.keys(order).length === 2) {
		const validClause = ["dir", "keys"];
		const orderClause = Object.keys(order);

		for (let clause of orderClause) {
			if (!validClause.includes(clause)) {
				throw new InsightError("Invalid ORDER clause: " + clause);
			}
		}

		let dir = order["dir"];
		let keys = order["keys"];
		if (!["UP", "DOWN"].includes(dir)) {
			throw new InsightError("Invalid ORDER direction");
		}

		if (!isValidArray(keys) || !keys.every((key: any) => orderKeyValidator(key, key_list))) {
			throw new InsightError("ORDER keys must be in COLUMNS");
		}

		return {
			dir: dir,
			keys: keys.map((key: any)=>typeof key === "string" ? key : parseKey(key))
		};
	} else {
		throw new InsightError("Invalid ORDER format");
	}
}
