import {Query} from "./QueryInterfaces";
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

	// Check for unexpected clauses in query
	for (let key of queryKeys) {
		if (!validClauses.includes(key)) {
			throw new InsightError("Unexpected clause in Query: " + key);
		}
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

