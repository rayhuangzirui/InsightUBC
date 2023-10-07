import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError, ResultTooLargeError
} from "./IInsightFacade";
import JSZip from "jszip";
import path from "path";
import * as fs from "fs";
import QueryEngine from "./QueryEngine";
import {parseQuery} from "./QueryParser";
import e from "express";
import {getIDsFromQuery} from "./Validators";


/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
	private _currentAddedDataset: InsightDataset[] = [];
	private _currentAddedDatasetId: string[] = [];
	//
	// datasetList:[] = {ID1: dataset[], ID2: dataset[]...}
	private MAX_SIZE = 5000;
	constructor() {
		console.log("InsightFacadeImpl::init()");
	}
	public async addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		if (!this.isIdKindValid(id, kind)) {
			return Promise.reject(new InsightError());
		}
		if (this._currentAddedDataset.some((dataset) => dataset.id === id)) {
			return Promise.reject(new InsightError("Dataset already exists"));
		}

		let zip = new JSZip();
		let jobs: Array<Promise<{[course: string]: string}>> = [];
		// if the input file is not a valid zip file, it will throw an error
		let loadedContent;

		try {
			loadedContent = await zip.loadAsync(content, {base64: true});
			const isValid = await this.isValidZip(loadedContent);
			if (!isValid) {
				throw new InsightError("Zip is not valid");
			}
		} catch (error) {
			throw new InsightError("Zip validation failed");
		}
		loadedContent.forEach((relativePath, zipEntry) => {
			// macos creates some metadata files that we don't want to parse
			if (!zipEntry.dir && !relativePath.startsWith("__MACOSX/") && !relativePath.endsWith(".DS_Store")) {
				let job = zipEntry.async("string").then((result) => {
					return {[zipEntry.name]: result};
				});
				jobs.push(job);
			}
		});

		// parsedData is an array of objects, each object is a {key:course name, value:course data}
		let parsedData;

		try {
			parsedData = await Promise.all(jobs);
		  // eslint-disable-next-line @typescript-eslint/no-shadow
		} catch (e) {
			throw new InsightError("error parsing course data");
		}

		let rowNumber = this.countRowNum(parsedData);
		const pathToWrite = path.join(__dirname, "..", "data", id + ".json");
		let stringfiedData = JSON.stringify(parsedData, null, 2);

		fs.writeFileSync(pathToWrite, stringfiedData);
		let datasetToBeAdded: InsightDataset = {
			id: id, kind: kind, numRows: rowNumber
		};
		this._currentAddedDataset.push(datasetToBeAdded);
		return this._currentAddedDataset.map((dataset) => dataset.id);
	}

	private isIdKindValid(id: string, kind: InsightDatasetKind): boolean {
		if (id === null || id === undefined) {
			return false;
		}
		if (/^\s*$/.test(id)) {
			return false;
		}
		if (!/^[^_]+$/.test(id)) {
			return false;
		}
		if (kind === InsightDatasetKind.Rooms) {
			return false;
		}
		return true;
	}


	private countRowNum(parsedData: any[]): number {
		let rowNumber = 0;

		for (let data of parsedData) {
			for (let key in data) {
				let courseData;

				try {
					courseData = JSON.parse(data[key]);
					if (courseData.result && Array.isArray(courseData.result)) {
						rowNumber += courseData.result.length;
					}
				} catch (err) {
					throw new InsightError("error parsing section data");
				}
			}
		}
		return rowNumber;
	}

	private async isValidZip(loadedContent: JSZip): Promise<boolean> {
		let totalDirectories = 0;
		let isValid = true;
		let validationPromises: Array<Promise<any>> = [];

		loadedContent.forEach((relativePath, zipEntry) => {
			const promise = (async () => {
				if (zipEntry.dir) {
					totalDirectories++;
					if (totalDirectories > 1 || relativePath !== "courses/") {
						isValid = false;
					}
				} else if (!relativePath.startsWith("courses/")) {
					isValid = false;
				} else {
					// try {
					const content = await zipEntry.async("string");
					const parsedJson = JSON.parse(content);
					if (!parsedJson) {
						isValid = false;
					}
				}
			})();
			validationPromises.push(promise);
		});

		await Promise.all(validationPromises);
		if (totalDirectories !== 1) {
			isValid = false;
		}
		return isValid;
	}

	public async removeDataset(id: string): Promise<string> {
		try {
			if (!this.isIdKindValid(id, InsightDatasetKind.Sections)) {
				return Promise.reject(new InsightError());
			}
			// js/ts has garbage collection, so we don't need to manully free memory for the removed dataset
			const datasetExists = this._currentAddedDataset.some((dataset) => dataset.id === id);
			if (!datasetExists) {
				return Promise.reject(new NotFoundError("Dataset not found"));
			}
			// remove from memory cache
			this._currentAddedDataset = this._currentAddedDataset.filter((dataset) => dataset.id !== id);
			const pathToDelete = path.join(__dirname, "..", "data", id + ".json");
			await fs.promises.unlink(pathToDelete);
			return id;

		} catch (error) {
			return Promise.reject(new InsightError("failed to remove dataset"));
		}
	}


	public async listDatasets(): Promise<InsightDataset[]> {
		try {
			return this._currentAddedDataset;
		} catch (error) {
			return Promise.reject(error);
		}
	}

	public async performQuery(query: unknown): Promise<InsightResult[]> {
		try {
			let parsedQuery = parseQuery(query);
			let idFromQuery = getIDsFromQuery(parsedQuery);

			if (idFromQuery.length > 1) {
				return Promise.reject(new InsightError("Querying multiple datasets is rejected"));
			} else if (idFromQuery.length === 0) {
				return Promise.reject(new InsightError("No key found in the query"));
			}

			// let datasetList = this.datsetList;
			let id = idFromQuery[0];

			// if (!dataList.includes(id)) {
			// 	return Promise.reject(new InsightError("Dataset " + id + " does not exist"));
			// }

			// let dataset = dataList[id];
			// let queryEngine = new QueryEngine(dataset, query);
			// let result: InsightResult[] = queryEngine.runEngine();

			// if (result.length > this.MAX_SIZE) {
			// 	return Promise.reject(new ResultTooLargeError("The result is too big"));
			// }
			//
			// return Promise.resolve(result);
		  return Promise.reject("To be complete");
		} catch (error) {
			if (error instanceof InsightError) {
				return Promise.reject(error);
			}
			return Promise.reject(new InsightError("Invalid query"));
		}
	}


	public getCurrentAddedDataset(): InsightDataset[] {
		return this._currentAddedDataset;
	}

	public setCurrentAddedDataset(value: InsightDataset[]) {
		this._currentAddedDataset = value;
	}
}
