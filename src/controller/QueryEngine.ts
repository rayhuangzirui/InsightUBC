import {
	COLUMNS,
	FILTER,
	Key,
	LOGICCOMPARISON,
	MCOMPARISON,
	ORDER,
	Query,
	SCOMPARISON,
} from "./QueryInterfaces";
import {MCOMPARATOR, LOGIC, Sfield, Mfield} from "./ClausesEnum";
import {parseQuery} from "./QueryParser";
// import {ResultTooLargeError} from "./IInsightFacade";

export default class QueryEngine {
	public dataset: any[];
	public query: Query;
	// private MAX_SIZE;

	constructor(dataset: any[], inputQuery: any) {
		this.dataset = dataset;
		// console.log("InputQuery: " + JSON.stringify(inputQuery, null, 2));
		this.query = parseQuery(inputQuery);
		// console.log("parsedQuery: " + JSON.stringify(inputQuery, null, 2));
		// this.MAX_SIZE = max_size;
	}

	public getFilter(): FILTER {
		return this.query.body.filter as FILTER;
	}

	public getColumns(): COLUMNS {
		return this.query.options.columns;
	}

	public getOrder(): ORDER | null{
		return this.query.options.order as ORDER;
	}

	public runEngine(): any[] {
		let results = this.filterData();
		results = this.selectColumns(results);
		results = this.sortDataInOrder(results);
		return results;
	}

	private filterData(): any[] {
		let filter = this.getFilter();
		// console.log("Filter is: " + filter);

		// If no filter, return all entries
		if (!filter) {
			return this.dataset;
		}

		return this.dataset.filter((entry) => this.filterHelper(entry, filter));
	}

	private filterHelper(entry: any, filter: FILTER): boolean {
		if (filter.logicComp) {
			return this.logicComHelper(entry, filter.logicComp);
		} else if (filter.mComp) {
			return this.mComHelper(entry, filter.mComp);
		} else if (filter.sComp) {
			return this.sComHelper(entry, filter.sComp);
		} else if (filter.negation) {
			return !this.filterHelper(entry, filter.negation.filter);
		} else {
			// No matched return true to the entry
			return true;
		}
	}

	private logicComHelper(entry: any, logicCom: LOGICCOMPARISON): boolean {
		if (logicCom.logic === LOGIC.AND) {
			return logicCom.filter_list.every((innerFilter) => this.filterHelper(entry, innerFilter));
		} else if (logicCom.logic === LOGIC.OR) {
			return logicCom.filter_list.some((innerFilter) => this.filterHelper(entry, innerFilter));
		} else {
			return true;
		}
	}

	private mComHelper(entry: any, mCom: MCOMPARISON): boolean {
		const mappedField = this.fieldMap[mCom.mkey.field];
		const mfieldEntry = entry[mappedField];
		switch (mCom.mcomparator) {
			case MCOMPARATOR.LT:
				return mfieldEntry < mCom.num;
			case MCOMPARATOR.EQ:
				return mfieldEntry === mCom.num;
			case MCOMPARATOR.GT:
				return mfieldEntry > mCom.num;
			default:
				return true;
		}
	}

	private sComHelper(entry: any, sCom: SCOMPARISON): boolean {
		// console.log("mapped field: " + mappedField);
		const mappedField = this.fieldMap[sCom.skey.field];
		const sfieldEntry = entry[mappedField];
		// console.log("entry: ", entry);
		// console.log("sfield entry for entry: " + entry + "is: " + sfieldEntry);

		if (sCom.inputstring.startsWith("*") && sCom.inputstring.endsWith("*")) {
			const string = sCom.inputstring.slice(1, -1);
			return sfieldEntry.includes(string);
		} else if (sCom.inputstring.startsWith("*")) {
			return sfieldEntry.endsWith(sCom.inputstring.slice(1));
		} else if (sCom.inputstring.endsWith("*")) {
			return sfieldEntry.startsWith(sCom.inputstring.slice(0, -1));
		}

		return sfieldEntry === sCom.inputstring;
	}

	private selectColumns(dataset: any[]): any[] {
		const columnKeys = this.getColumns().key_list;

		const mappedDataset = dataset.map((entry) => this.selectColumnsHelper(entry, columnKeys));
		// if (mappedDataset.length > this.MAX_SIZE) {
		// 	throw new ResultTooLargeError("The result is too big. " +
		// 		"Only queries with a maximum of 5000 results are supported.");
		// }

		return mappedDataset.filter((entry) => Object.keys(entry).length > 0);
	}

	private selectColumnsHelper(entry: any, keys: Key[]): any {
		let projectedEntry: any = {};
		for (let key of keys) {
			let comKey = `${key.idstring}_${key.field}`;
			let mappedKey = this.fieldMap[key.field];

			if (!this.isValidField(mappedKey, entry[mappedKey])) {
				return {};
			}

			projectedEntry[comKey] = entry[mappedKey];
		}
		return projectedEntry;
	}

	private isValidField(mappedKey: string, value: any): boolean {
		switch (mappedKey) {
			// && value.trim() !== ""
			case "_dept":
				return typeof value === "string";
			case "_id":
				return typeof value === "string";
			case "_instructor":
				return typeof value === "string";
			case "_title":
				return typeof value === "string" ;
			case "_uuid":
				return typeof value === "string";
			case "_avg":
				return typeof value === "number";
			case "_pass":
				return typeof value === "number";
			case "_fail":
				return typeof value === "number";
			case "_audit":
				return typeof value === "number";
			case "_year":
				return typeof value === "number";
			default:
				return false;
		}
	}

	private fieldMap: {[key in Mfield | Sfield]: string} = {
		avg: "_avg",
		pass: "_pass",
		fail: "_fail",
		audit: "_audit",
		year: "_year",
		dept: "_dept",
		id: "_id",
		instructor: "_instructor",
		title: "_title",
		uuid: "_uuid"
	};
	private sortDataInOrder(dataset: any[]): any[] {
		const order = this.getOrder();
		// console.log("order is " + JSON.stringify(order, null, 2));

		if (!order) {
			// console.log("No sort");
			return dataset;
		}
		let key = order.key;
		let comKey = `${key.idstring}_${key.field}`;

		// console.log("Sorting " + comKey);
		return dataset.sort((a, b) => {
			if (typeof a[comKey] === "string" && typeof b[comKey] === "string") {
				if (a[comKey] !== b[comKey]) {
					return a[comKey].localeCompare(b[comKey]);
				}
			} else if (typeof a[comKey] === "number" && typeof b[comKey] === "number") {
				if (a[comKey] !== b[comKey]) {
					// console.log("Performed num com");
					return a[comKey] - b[comKey];
				}
			}

			return 0;
		});

	}

}
