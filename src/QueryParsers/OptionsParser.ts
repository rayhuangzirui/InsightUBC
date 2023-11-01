import {ANYKEY, COLUMNS, OPTIONS, ORDER} from "./QueryInterfaces";
import {InsightError} from "../controller/IInsightFacade";
import {isValidObject, isValidArray, isValidString, isKeyinList} from "./Validators";
import {parseKey} from "./FilterParser";

export function parseOptions(options: any): OPTIONS{
	const validKeys = ["COLUMNS", "ORDER"];

	for (let key of Object.keys(options)) {
		if (!validKeys.includes(key)) {
			throw new InsightError("Unexpected key in OPTIONS: " + key);
		}
	}

	if (!Object.prototype.hasOwnProperty.call(options, "COLUMNS")) {
		throw new InsightError("OPTIONS missing COLUMNS");
	}

	let keyList = options["COLUMNS"];
	if (!isValidArray(keyList) || keyList.length === 0) {
		throw new InsightError("Invalid columns list, must be a non-empty array");
	}

	if (Object.prototype.hasOwnProperty.call(options, "ORDER")) {
		let orderValue = options["ORDER"];

		return {
			columns: parseColumns(keyList),
			order: parseOrder(orderValue, keyList)
		};

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

export function parseOrder(order: any, key_list: ANYKEY[]): ORDER {
	if (isValidString(order)) { // single key
		if (!isKeyinList(order, key_list)) {
			throw new InsightError("ORDER key must be in COLUMNS");
		}

		return {
			// key type determined in parseKey
			anykey: parseKey(order),
		};
	} else if (isValidObject(order) && Object.keys(order).length === 2) {
		const validClause = ["dir", "keys"];
		const orderClause = Object.keys(order);

		for (let clause of orderClause) {
			if (!validClause.includes(clause)) {
				throw new InsightError("Invalid dir or keys clause in ORDER: " + clause);
			}
		}

		let dir = order["dir"];
		let keys = order["keys"];
		if (!["UP", "DOWN"].includes(dir)) {
			throw new InsightError("Invalid ORDER direction");
		}

		if (!isValidArray(keys) || !keys.every((key: any) => isKeyinList(key, key_list))) {
			throw new InsightError("ORDER keys must be in COLUMNS");
		}

		return {
			dir: dir,
			// key type determined in parseKey
			keys: keys.map((key: any)=>parseKey(key))
		};
	} else {
		throw new InsightError("Invalid ORDER format");
	}
}
