import {WHERE} from "./QueryInterfaces";
import {InsightError} from "../controller/IInsightFacade";
import {parseFilter} from "./FilterParser";

export function parseWhere(where: any): WHERE {
	if (!where) {
		throw new InsightError("WHERE must be an object");
	}

	if (Object.keys(where).length === 0) {
		return {};
	}
	if (Object.keys(where).length > 1) {
		throw new InsightError("WHERE should only have 1 key, has " + Object.keys(where).length);
	}
	return {
		filter: parseFilter(where),
	};
}
