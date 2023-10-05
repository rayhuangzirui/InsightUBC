import {
	COLUMNS,
	FILTER,
	LOGIC,
	LOGICCOMPARISON,
	MCOMPARATOR,
	MCOMPARISON,
	ORDER,
	Query, SCOMPARISON,
	WHERE,
	Key
} from "./QueryInterfaces";
import {parseKey, parseMKey, parseQuery} from "./QueryParser";
import {isMkey} from "./StringValidators";

export default class QueryEngine {
	public dataset: any[];
	public query: Query;
	constructor(dataset: any[], inputQuery: any) {
		this.dataset = dataset;
		this.query = parseQuery(inputQuery);
	}

	public getWhere(): WHERE {
		return this.query.body;
	}
	public getFilter(): FILTER {
		return this.query.body.filter as FILTER;
	}

	public getColumns(): COLUMNS {
		return this.query.options.columns;
	}

	public getOrder(): ORDER | null {
		return this.query.options.order || null;
	}

	public runEngine(): any[] {
		let results = this.filterData();
		results = this.selectColumns(results);
		// TODO: results = this.orderData(results);
		return results;
	}

	private filterData(): any[] {
		const filter = this.getFilter();

		// If no filter, return all entries
		if (!filter) {
			return this.dataset;
		}

		let filtered = this.dataset.filter((entry) => this.performFilter(entry, filter));
		return filtered;
	}

	private performFilter(entry: any, filter: FILTER): boolean {
		if (filter.logicComp) {
			return this.performLogicCom(entry, filter.logicComp);
		} else if (filter.mComp) {
			return this.performMCom(entry, filter.mComp);
		} else if (filter.sComp) {
			return this.performSCom(entry, filter.sComp);
		} else if (filter.negation) {
			return !this.performFilter(entry, filter.negation.filter);
		} else {
			// No matched return true to the entry
			return true;
		}
	}

	private performLogicCom(entry: any, logicCom: LOGICCOMPARISON): boolean {
		if (logicCom.logic === LOGIC.AND) {
			return logicCom.filter_list.every((innerFilter) => this.performFilter(entry, innerFilter));
		} else if (logicCom.logic === LOGIC.OR) {
			return logicCom.filter_list.some((innerFilter)=> this.performFilter(entry, innerFilter));
		} else {
			return true;
		}
	}

	private performMCom(entry: any, mCom: MCOMPARISON): boolean {
		const mfield = entry[mCom.mkey.field];
		switch (mCom.mcomparator) {
			case MCOMPARATOR.LT:
				return mfield < mCom.num;
			case MCOMPARATOR.EQ:
				return mfield === mCom.num;
			case MCOMPARATOR.GT:
				return mfield > mCom.num;
			default:
				return true;
		}
	}

	private performSCom(entry: any, sCom: SCOMPARISON): boolean {
		const sfield = entry[sCom.skey.field];
		return sfield.includes(sCom.inputstring);
	}

	private selectColumns(dataset: any[]): any[] {
		const columnKeys = this.getColumns().key_list;

		return dataset.map((entry) => this.getProjectedEntry(entry, columnKeys));
	}

	private getProjectedEntry(entry: any, keys: Key[]): any {
		let projectedEntry: any = {};
		for (let key of keys) {
			const comKey = `"${key.idstring}_${key.field}"`;
			// projectedEntry[key] = entry[key];
		}
	}

	// public validateQuery(): boolean {
	// 	if (!this.query) {
	// 		return false;
	// 	}
	//
	// 	if (!this.query.body || !this.query.options) {
	// 		return false;
	// 	}
	//
	// 	if (!this.validateWhere(this.query.body)) {
	// 		return false;
	// 	}
	//
	// 	if (!this.validateOptions(this.query.options)) {
	// 		return false;
	// 	}
	//
	// 	return true;
	// }
	//
	// private validateWhere(body: WHERE): boolean {
	// 	// when no filter in WHERE, valid for query all entries
	// 	if (!body.filter) {
	// 		return true;
	// 	}
	//
	// 	const filter = body.filter;
	// 	if (filter.logicComp) {
	// 		if (!filter.logicComp || !filter.logicComp.logic ||
	// 			!filter.logicComp.filter_list || filter.logicComp.filter_list.length === 0) {
	// 			return false;
	// 		}
	// 		return true;
	// 	} else if (filter.mComp) {
	// 		if (!filter.mComp || !filter.mComp.mkey ||
	// 			!filter.mComp.mcomparator || !filter.mComp.num) {
	// 			return false;
	// 		}
	// 		return true;
	// 	} else if (filter.sComp) {
	// 		if (!filter.sComp || !filter.sComp.is || !filter.sComp.skey ||
	// 			!inputStringValidator(filter.sComp.inputstring)) {
	// 			return false;
	// 		}
	//
	// 		return true;
	// 	} else if (filter.negation) {
	// 		if (!filter.negation || !filter.negation.NOT || !filter.negation.filter) {
	// 			return false;
	// 		}
	//
	// 		return true;
	// 	} else {
	// 		return false;
	// 	}
	// }
	//
	// private validateOptions(options: OPTIONS): boolean {
	// 	if (!options.columns || options.columns.key_list.length === 0) {
	// 		return false;
	// 	}
	//
	// 	for (const key of options.columns.key_list) {
	// 		if (!key) {
	// 			return false;
	// 		}
	// 	}
	//
	// 	if (!options.order) {
	// 		return false;
	// 	}
	//
	// 	if (!this.validateOrder(options.order.key)) {
	// 		return false;
	// 	}
	//
	// 	return true;
	// }
	//
	// private validateOrder(key: Key): boolean {
	// 	return !!parseKey(key);
	// }
}
