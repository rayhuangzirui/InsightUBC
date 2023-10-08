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

export default class QueryEngine {
	public dataset: any[];
	public query: Query;

	constructor(dataset: any[], inputQuery: any) {
		this.dataset = dataset;
		// console.log("InputQuery: " + JSON.stringify(inputQuery, null, 2));
		this.query = parseQuery(inputQuery);
		// console.log("parsedQuery: " + JSON.stringify(inputQuery, null, 2));
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

		return dataset.map((entry) => this.selectColumnsHelper(entry, columnKeys));
	}

	private selectColumnsHelper(entry: any, keys: Key[]): any {
		let projectedEntry: any = {};
		for (let key of keys) {
			let comKey = `${key.idstring}_${key.field}`;
			let mappedKey = this.fieldMap[key.field];
			projectedEntry[comKey] = entry[mappedKey];
		}
		return projectedEntry;
	}

	// private fieldMap: {[key in Mfield | Sfield]: string} = {
	// 	avg: "Avg",
	// 	pass: "Pass",
	// 	fail: "Fail",
	// 	audit: "Audit",
	// 	year: "Year",
	// 	dept: "Subject",
	// 	id: "Course",
	// 	instructor: "Professor",
	// 	title: "Title",
	// 	uuid: "id"
	// };

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

		if (!order) {
			return dataset;
		}

		const mappedField = this.fieldMap[order.key.field];

		return dataset.sort((a, b) => {
			if (typeof a[mappedField] === "string" && typeof b[mappedField] === "string") {
				return a[mappedField].localeCompare(b[mappedField]);
			} else if (typeof a[mappedField] === "number" && typeof b[mappedField] === "number") {
				return a[mappedField] - b[mappedField];
			}

			return 0;
		});

	}
}
