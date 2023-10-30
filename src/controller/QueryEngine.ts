import {COLUMNS, FILTER, Key, ORDER, Query} from "../QueryParsers/QueryInterfaces";
import {parseQuery} from "../QueryParsers/QueryParser";
import {filterHelper, selectColumnsHelper} from "./QueryEngineHelper";
import {isValidObject, isValidApplyKey, isValidString, compareValues} from "../QueryParsers/Validators";

export default class QueryEngine {
	public dataset: any[];
	public query: Query;

	constructor(dataset: any[], inputQuery: any) {
		this.dataset = dataset;
		this.query = parseQuery(inputQuery);
	}

	public getFilter(): FILTER {
		return this.query.body.filter as FILTER;
	}

	public getColumns(): COLUMNS {
		return this.query.options.columns;
	}

	public getOrder(): ORDER{
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

		// If no filter, return all entries
		if (!filter) {
			return this.dataset;
		}

		return this.dataset.filter((entry) => filterHelper(entry, filter));
	}

	private selectColumns(dataset: any[]): any[] {
		const columnKeys = this.getColumns().anykey_list;

		const mappedDataset = dataset.map((entry) => selectColumnsHelper(entry, columnKeys));

		return mappedDataset.filter((entry) => Object.keys(entry).length > 0);
	}

	private sortDataInOrder(dataset: any[]): any[] {
		const order = this.getOrder(); // parsed ORDER

		if (!isValidObject(order)) {
			return dataset;
		}

		if ("anykey" in order) {
			let key;
			if (typeof order.anykey === "string" && isValidApplyKey(order.anykey)) {
				// order key is applykey
				key = order.anykey;
				// TODO: implement applykey sorting
			}
			key = order.anykey as Key;
			let comKey = `${key.idstring}_${key.field}`;

			return dataset.sort((a, b) => compareValues(a[comKey], b[comKey]));
		} else if ("dir" in order && "keys" in order) {
			let dir = order.dir;
			let keys = order.keys;

			return dataset.sort((a, b) => {
				for (let key of keys) {
					if (typeof key === "string" && isValidApplyKey(key)) {
						// order key is applykey

						// TODO: implement applykey sorting
					}
					key = key as Key;
					let comKey = `${key.idstring}_${key.field}`;
					let comparison = compareValues(a[comKey], b[comKey]);
					if (comparison !== 0) {
						return dir === "UP" ? comparison : -comparison;
					}
				}
				return 0;
			});
		}

		return dataset;
	}

}
