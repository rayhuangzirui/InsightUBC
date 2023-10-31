import {WHERE} from "./QueryInterfaces";
import {InsightError} from "../controller/IInsightFacade";
import {parseFilter} from "./FilterParser";
import {isEmptyArray, isValidObject} from "./Validators";

export function parseWhere(where: any): WHERE {
	if (!isValidObject(where)) {
		throw new InsightError("WHERE must be an object");
	}

	if (isEmptyArray(Object.keys(where))) {
		return {};
	}

	if (Object.keys(where).length > 1) {
		throw new InsightError("WHERE should only have 1 key, has " + Object.keys(where).length);
	}
	return {
		filter: parseFilter(where),
	};
}
