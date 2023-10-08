import {FILTER, Key} from "./QueryInterfaces";
import {Mfield, Sfield} from "./ClausesEnum";

export function IDValidator (id: string): boolean {
	if (id.includes("_")) {
		return false;
	} else if (!id.trim()) {
		return false;
	}

	return true;
}

export function inputStringValidator(inputString: string): boolean {
	if (inputString.includes("*")) {
		const firstAsterisk = inputString.indexOf("*");
		const lastAsterisk = inputString.lastIndexOf("*");

		if (firstAsterisk !== 0 && firstAsterisk !== inputString.length - 1) {
			return false;
		}

		if (lastAsterisk !== 0 && lastAsterisk !== inputString.length - 1) {
			return false;
		}
	}

  // empty or no *
	return true;
}

export function isMkey(key: any): boolean {
	const mFields = Object.values(Mfield);
	return mFields.some((field) => key.endsWith(`${field}`));
}

export function isSkey(key: any): boolean {
	const sFields = Object.values(Sfield);
	return sFields.some((field) => key.endsWith(`${field}`));
}

export function orderKeyValidator(key: Key, key_list: Key[]): boolean {
	return key_list.includes(key);
}

export function getIDsFromQuery(query: any): string[] {
	let ids = new Set<string>();

	// get IDs from the WHERE clause
	if (query.body && query.body.filter) {
		getIDsFromFilter(query.body.filter, ids);
	}

	// get IDs from the OPTIONS clause
	if (query.options && query.options.columns && query.options.columns.key_list) {
		for (const key of query.options.columns.key_list) {
			if (key.idstring) {
				ids.add(key.idstring);
			}
		}
	}

	return [...ids];
}

function getIDsFromFilter(filter: FILTER, ids: Set<string>): void {
	if (filter.logicComp) {
		for (const innerFilter of filter.logicComp.filter_list) {
			getIDsFromFilter(innerFilter, ids);
		}
	} else if (filter.mComp && filter.mComp.mkey) {
		ids.add(filter.mComp.mkey.idstring);
	} else if (filter.sComp && filter.sComp.skey) {
		ids.add(filter.sComp.skey.idstring);
	} else if (filter.negation) {
		getIDsFromFilter(filter.negation.filter, ids);
	}
}

