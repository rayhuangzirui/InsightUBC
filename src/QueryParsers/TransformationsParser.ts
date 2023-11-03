import {InsightError} from "../controller/IInsightFacade";
import {ANYKEY, APPLYRULE, GROUP, Key, TRANSFORMATIONS} from "./QueryInterfaces";
import {parseKey} from "./FilterParser";
import {APPLYTOKEN} from "./ClausesEnum";
import {isValidArray, isValidObject, isValidString, isValidApplyKey} from "./Validators";

export function parseTransformations(transformations: any): TRANSFORMATIONS {
	if (!isValidObject(transformations)) {
		throw new InsightError("TRANSFORMATIONS must be an object");
	}
	const validKeys = ["GROUP", "APPLY"];
	if (Object.keys(transformations).length !== 2) {
		throw new InsightError("TRANSFORMATIONS should only have 2 keys, has " + Object.keys(transformations).length);
	}

	let group = transformations["GROUP"];
	let apply = transformations["APPLY"];
	if (!group) {
		throw new InsightError("TRANSFORMATIONS missing GROUP");
	}
	if (!apply) {
		throw new InsightError("TRANSFORMATIONS missing APPLY");
	}

	// Check for unexpected keys
	for (let key of Object.keys(transformations)) {
		if (!validKeys.includes(key)) {
			throw new InsightError("Unexpected key in TRANSFORMATIONS: " + key);
		}
	}
	let keyList = transformations["GROUP"];

	let applyRuleList = transformations["APPLY"];

	if (applyRuleList.length === 0) {
		return {
			group: parseGroup(keyList),
			apply: []
		};
	}

	return {
		group: parseGroup(keyList),
		apply: parseApply(applyRuleList)
	};
}

export function parseGroup(group: any): GROUP {
	// Check if group is an array
	if (!group || !Array.isArray(group)) {
		throw new InsightError("GROUP must be an array, but was " + typeof group);
	}

	if (group.length === 0) {
		throw new InsightError("GROUP must be a non-empty array");
	}

	let keys: ANYKEY[] = [];
	for (const key of group) {
		if (typeof key !== "string") {
			throw new InsightError("GROUP keys must be string, but was " + typeof key);
		}

		if (!key.includes("_")) {
			// key is applykey
			throw new InsightError("GROUP keys must be mkey or skey, but was " + key);
		}

		// key is mkey or skey
		let parsedKey = parseKey(key);
		if (!parsedKey || typeof parsedKey !== "object") {
			throw new InsightError("Invalid key in GROUP clause: " + key);
		}

		keys.push(parsedKey);
	}
	return {
		keys: keys as Key[],
	};
}

export function parseApply(apply: any): APPLYRULE[] {
	if (!isValidArray(apply)) {
		throw new InsightError("APPLY must be an array");
	}
	let parsedApply: APPLYRULE[] = [];
	let visitedApplyKeys: string[] = [];

	for (let applyRule of apply) {
		if (!isValidObject(applyRule)) {
			throw new InsightError("applyrule in APPLY must be an object");
		}
		let parsedApplyRule = parseApplyRule(applyRule);

		if (visitedApplyKeys.includes(parsedApplyRule.applykey)) {
			throw new InsightError("Duplicate applykey in APPLY: " + parsedApplyRule.applykey);
		}

		visitedApplyKeys.push(parsedApplyRule.applykey);
		parsedApply.push(parsedApplyRule);
	}
	return parsedApply;
}

export function parseApplyRule(applyRule: any): APPLYRULE {
	if (!isValidObject(applyRule)) {
		throw new InsightError("APPLYRULE must be an object");
	}
	if (Object.keys(applyRule).length !== 1) {
		throw new InsightError("APPLYRULE must have 1 key");
	}

	let applyKey = Object.keys(applyRule)[0];

  // Check if applyKey is a valid applykey
	if (typeof applyKey !== "string" || !isValidApplyKey(applyKey)) {
		throw new InsightError("Invalid APPLYRULE applykey: " + applyKey);
	}

	let applyTokenObject = applyRule[applyKey];

  // Check if applyToken is an object
	if (!isValidObject(applyTokenObject) || Array.isArray(applyTokenObject)) {
		throw new InsightError("APPLYRULE must have an object as its value");
	}

  // Make sure applyTokenObject only has 1 key
	if (Object.keys(applyTokenObject).length !== 1) {
		throw new InsightError("APPLYRULE must have 1 key, but has " + Object.keys(applyTokenObject).length);
	}

  // Get the applyToken, MAX, MIN, AVG, SUM, COUNT
	let applyToken = Object.keys(applyTokenObject)[0];

  // Check if applyToken is valid APPLYTOKEN clause, MAX, MIN, AVG, SUM, COUNT
	if (!Object.values(APPLYTOKEN).includes(applyToken as APPLYTOKEN)) {
		throw new InsightError("Invalid APPLYTOKEN clause: " + applyToken);
	}

	let applyTokenKey = applyTokenObject[applyToken];
	if (typeof applyTokenKey !== "string" || !applyTokenKey) {
		throw new InsightError("Invalid APPLYRULE target key: " + applyTokenKey);
	}

	return {
		applykey: applyKey,
		applytoken: applyToken as APPLYTOKEN,
		key: parseKey(applyTokenKey) as Key,
	};
}

