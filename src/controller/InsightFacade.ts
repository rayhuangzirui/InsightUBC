import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError
} from "./IInsightFacade";
import JSZip from "jszip";
import fs from "fs";
import path from "path";
import QueryEngine from "./QueryEngine";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
	private _currentAddedDataset: InsightDataset[] = [];
	constructor() {
		console.log("InsightFacadeImpl::init()");
	}
	public async addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		try {
			if (/^\s*$/.test(id) || !/^[^_]+$/.test(id)) {
				return Promise.reject(new InsightError("Invalid ID"));
			}
			if (this._currentAddedDataset.some((dataset) => dataset.id === id)) {
				return Promise.reject(new InsightError("Dataset with the same ID already added"));
			}
			let zip = new JSZip();
			let loadedContent = await zip.loadAsync(content, {base64: true});
			let jobs: Array<Promise<{[course: string]: string}>> = [];
			loadedContent.forEach((relativePath, zipEntry) => {
				// macos creates some metadata files that we don't want to parse
				if (!zipEntry.dir && !relativePath.startsWith("__MACOSX/") && !relativePath.endsWith(".DS_Store")) {
					let job = zipEntry.async("text")
						.then((result) => {
							return {[zipEntry.name]: result};
						});
					jobs.push(job);
				}
			});
			// parsedData is an array of objects, each object is a {key:course name, value:course data}
			let parsedData = await Promise.all(jobs);
			// let rowNumber = parsedData.length;
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
						console.log("error parsing course data:", err);
					}
				}
			}
			const pathToWrite = path.join(__dirname, "..", "data", id + ".json");
			let stringfiedData = JSON.stringify(parsedData, null, 2);
			fs.writeFileSync(pathToWrite, stringfiedData);

			let datasetToBeAdded: InsightDataset = {
				id: id,
				kind: kind,
				numRows: rowNumber
			};
			this._currentAddedDataset.push(datasetToBeAdded);
			return this._currentAddedDataset.map((dataset) => dataset.id);
		} catch (error) {
			return Promise.reject(error);
		}
	}


	public async removeDataset(id: string): Promise<string> {
		try {
			if (/^\s*$/.test(id) || !/^[^_]+$/.test(id)) {
				return Promise.reject(new InsightError("Invalid ID"));
			}
			// js/ts has garbage collection, so we don't need to manully free memory for the removed dataset
			const datasetExists = this._currentAddedDataset.some((dataset) => dataset.id === id);
			if (!datasetExists) {
				return Promise.reject(new NotFoundError("Dataset not found"));
			}

			this._currentAddedDataset = this._currentAddedDataset.filter((dataset) => dataset.id !== id);
			const pathToDelete = path.join(__dirname, "..", "data", id + ".json");
			await fs.promises.unlink(pathToDelete);
			return id;

		} catch (error) {
			return Promise.reject(error);
		}
	}


	public performQuery(query: unknown): Promise<InsightResult[]> {
		// initialize dataset, pass it into QueryEngine
		// const queryEngine = new QueryEngine(dataset,query);
		return Promise.reject("Not implemented.");
	}

	public async listDatasets(): Promise<InsightDataset[]> {
		try {
			return Promise.resolve(this._currentAddedDataset);
		} catch (error) {
			console.error("Error listing datasets:", error);
			return Promise.reject(error);
		}
	}

	public get currentAddedDataset(): InsightDataset[] {
		return this._currentAddedDataset;
	}

	public set currentAddedDataset(value: InsightDataset[]) {
		this._currentAddedDataset = value;
	}
}
