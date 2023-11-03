import {APPLYRULE, COLUMNS, FILTER, Key, ORDER, Query, TRANSFORMATIONS} from "../QueryParsers/QueryInterfaces";
import {parseQuery} from "../QueryParsers/QueryParser";
import {
	calculateValueByToken,
	constructGroupKey,
	fieldMap,
	filterHelper,
	selectColumnsHelper,
} from "./QueryEngineHelper";
import {
	isFieldForRooms,
	isFieldForSections,
	isKeyInApplyRules,
	isKeyinGroupList,
	isValidApplyKey
} from "../QueryParsers/Validators";
import {InsightDatasetKind, InsightError} from "./IInsightFacade";

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

	public getOrder(): ORDER {
		return this.query.options.order as ORDER;
	}

	public getTransformations(): TRANSFORMATIONS {
		return this.query.transformations as TRANSFORMATIONS;
	}

	public runEngine(): any[] {
		let results = this.filterData();
		results = this.transformData(results);
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
		if (this.getTransformations()) {
			for (let key of columnKeys) {
				if (typeof key === "string" && isValidApplyKey(key)) {
					// column key is applykey
					if (!isKeyInApplyRules(key, this.getTransformations().apply)) {
						throw new InsightError("Column key " + JSON.stringify(key) + " not in apply key list");
					}
				} else {
					key = key as Key;

					if (!isKeyinGroupList(key, this.getTransformations().group.keys)) {
						throw new InsightError(
							"Column key " +
								JSON.stringify(key) +
								" not in group keys list" +
								JSON.stringify(this.getTransformations().group.keys)
						);
					}
				}
			}
		}

		const mappedDataset = dataset.map((entry) => selectColumnsHelper(entry, columnKeys));
		return mappedDataset.filter((entry) => Object.keys(entry).length > 0);
	}

	private sortDataInOrder(dataset: any[]): any[] {
		const order = this.getOrder(); // parsed ORDER

		if (!order) {
			return dataset;
		}

		const compareByKey = (a: any, b: any, key: any): number => {
			if (typeof key === "string") {
				if (a[key] < b[key]) {
					return -1;
				}
				if (a[key] > b[key]) {
					return 1;
				}
				return 0;
			} else {
				let comKey = `${key.idstring}_${key.field}`;
				if (a[comKey] < b[comKey]) {
					return -1;
				}
				if (a[comKey] > b[comKey]) {
					return 1;
				}
				return 0;
			}
		};

		if ("anykey" in order) {
			return dataset.sort((a, b) => compareByKey(a, b, order.anykey));
		} else if ("dir" in order && "keys" in order) {
			const {dir, keys} = order;
			return dataset.sort((a, b) => {
				for (let key of keys) {
					let comparison = compareByKey(a, b, key);
					if (comparison !== 0) {
						return dir === "UP" ? comparison : -comparison;
					}
				}
				return 0;
			});
		}

		return dataset;
	}

	private transformData(dataset: any[]): any[] {
		const transformations = this.getTransformations();
		if (!transformations) {
			return dataset;
		}

		const groupedData = this.groupData(dataset);
		return this.applyRules(groupedData);
	}

	private groupData(dataset: any[]): {[key: string]: any[]} {
		const transformations = this.getTransformations();
		if (!transformations) {
			return {};
		}
		// Group entries by group keys
		const groupedEntries: {[key: string]: any[]} = {};
		for (const entry of dataset) {
			let groupKey = constructGroupKey(entry, transformations.group.keys);

			if (!groupedEntries[groupKey]) {
				groupedEntries[groupKey] = [];
			}
			// Add entry to group
			groupedEntries[groupKey].push(entry);
		}
		// Return array of groups, where each group is an array of entries
		return groupedEntries;
	}

	private applyRules(groupedData: {[key: string]: any[]}): any[] {
		const transformations = this.getTransformations();
		if (!transformations) {
			return Object.values(groupedData);
		}
		return Object.values(groupedData).map((group) => {
			return transformations.apply.reduce(
				(entry: any, applyRule: APPLYRULE) => {
					const mappedKey = fieldMap[applyRule.key.field];
					entry[applyRule.applykey] = calculateValueByToken(applyRule.applytoken, group, mappedKey);
					return entry;
				},
				{...group[0]}
			);
		});
	}
}
