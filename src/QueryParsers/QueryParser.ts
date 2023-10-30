import {Query} from "./QueryInterfaces";
import {WhereClause, OptionsClause, TransformationsClause} from "./ClausesEnum";
import {InsightError} from "../controller/IInsightFacade";
import {parseWhere} from "./WhereParser";
import {parseOptions} from "./OptionsParser";
import {parseTransformations} from "./TransformationsParser";
import {isValidObject} from "./Validators";

export function parseQuery(query: any): Query {
	if (!isValidObject(query)) {
		throw new InsightError("Invalid JSON format");
	}
	let parsedQuery = query;

	try {
		let jsonQuery = JSON.stringify(query);
		JSON.parse(jsonQuery);
	} catch (e) {
		throw new InsightError("Invalid JSON format");
	}

	const validClauses = ["WHERE", "OPTIONS", "TRANSFORMATIONS"];

	const queryKeys = Object.keys(parsedQuery);

	if (!queryKeys.includes("WHERE") || !queryKeys.includes("OPTIONS")) {
		throw new InsightError("Missing WHERE or OPTIONS");
	}

	for (let key of queryKeys) {
		if (!validClauses.includes(key)) {
			throw new InsightError("Unexpected key in Query: " + key);
		}
	}

	let body = Object.keys(parsedQuery)[0];
	if (!Object.values(WhereClause).includes(body as WhereClause)) {
		throw new InsightError("Invalid WHERE clause: " + body);
	}

	let result: Query = {
		body: parseWhere(parsedQuery["WHERE"]),
		options: parseOptions(parsedQuery["OPTIONS"])
	};

	if (queryKeys.includes("TRANSFORMATIONS")) {
		result.transformations = parseTransformations(parsedQuery["TRANSFORMATIONS"]);
	}

	return result;
}

