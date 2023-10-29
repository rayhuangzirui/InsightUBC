import {Query} from "./QueryInterfaces";
import {WhereClause, OptionsClause} from "./ClausesEnum";
import {InsightError} from "../controller/IInsightFacade";
import {parseWhere} from "./WhereParser";
import {parseOptions} from "./OptionsParser";

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

