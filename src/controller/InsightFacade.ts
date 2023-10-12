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
import * as fs_extra from "fs-extra";
import {Section} from "../model/Section";
import QueryEngine from "./QueryEngine";
import {parseQuery} from "./QueryParser";
import {getIDsFromQuery} from "./Validators";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
	private _currentAddedInsightDataset: InsightDataset[] = [];
	private MAX_SIZE = 5000;
	private _initialization: Promise<void>;
	// private _isLoaded: boolean = false;
	constructor() {
		this._initialization = this.init()
			.then(() => {
				console.log("init success");
				// this._isLoaded = true;
			}).catch(() => console.log("init failed"));
		console.log("InsightFacadeImpl::init()");
	}

	private async init() {
		return await this.loadAddedDatasetFromDisk();
	}
	public async addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		await this._initialization;
		if (!this.isIdKindValid(id, kind)) {
			return Promise.reject(new InsightError());
		}
		if (this._currentAddedInsightDataset.some((dataset) => dataset.id === id)) {
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
		} catch (e) {
			throw new InsightError("error parsing course data");
		}

		let rowNumber = this.countRowNum(parsedData);
		const pathToWrite = path.join(__dirname, "..","..", "data", id + ".json");
		let stringfiedData = JSON.stringify(parsedData, null, 2);
		await this.ensureDirectoryExists(path.join(__dirname, "..", "..", "data"));
		fs.writeFileSync(pathToWrite, stringfiedData);
		let datasetToBeAdded: InsightDataset = {
			id: id, kind: kind, numRows: rowNumber
		};
		this._currentAddedInsightDataset.push(datasetToBeAdded);
		return this._currentAddedInsightDataset.map((dataset) => dataset.id);
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
		await this._initialization;
		try {
			if (!this.isIdKindValid(id, InsightDatasetKind.Sections)) {
				return Promise.reject(new InsightError());
			}
			// js/ts has garbage collection, so we don't need to manully free memory for the removed dataset
			const datasetExists = this._currentAddedInsightDataset.some((dataset) => dataset.id === id);
			if (!datasetExists) {
				return Promise.reject(new NotFoundError("Dataset not found"));
			}
			// remove from memory cache
			this._currentAddedInsightDataset = this._currentAddedInsightDataset.filter((dataset) => dataset.id !== id);
			const pathToDelete = path.join(__dirname, "..","..", "data", id + ".json");
			await fs.promises.unlink(pathToDelete);
			return id;
		} catch (error) {
			return Promise.reject(new InsightError("failed to remove dataset"));
		}
	}

	public async listDatasets(): Promise<InsightDataset[]> {
		await this._initialization;
		try {
			return this._currentAddedInsightDataset;
		} catch (error) {
			return Promise.reject(error);
		}
	}

	// push the existing dataset to the _currentAddedInsightDataset for handling crashes
	public async loadAddedDatasetFromDisk(): Promise<void> {
		await this.ensureDirectoryExists(path.join(__dirname, "..", "..", "data"));
		const files = await fs_extra.promises.readdir(path.join(__dirname, "..","..", "data"));

		const filePromises = files.map(async (file) => {
			if (file === ".gitkeep") {
				return;
			}
			const filePath = path.join(__dirname, "..", "..","data", file);
			const stat = await fs_extra.stat(filePath);

			if (stat.isFile()) {
				const fileContent = await fs_extra.readFile(filePath, "utf8");
				const parsedData = (JSON.parse(fileContent) as any[]);

				this._currentAddedInsightDataset.push({
					id: file.split(".")[0],
					kind: InsightDatasetKind.Sections,
					numRows: this.extractResultValues(parsedData).length
				});
			}
		});

		await Promise.all(filePromises);
	}


// todo：handle when undefined parameter is passed in constructor
	// load the dataset from disk, and convert it to a ts Section[] array
	public jsonToSection(datasetId: string): Section[] {
		this.ensureDirectoryExists(path.join(__dirname, "..", "..", "data"));
		const dataFilePath = path.join(__dirname, "..","..", "data", datasetId + ".json");
		// after readfilesync, it's a json string, need to parse it to json object
		let datafileString = fs.readFileSync(dataFilePath, "utf8");
		// the data is of nested json format,after parse, it's a ts object array
		// the array contains ts objects;  each object element contains a json string(the real data fields for a section)
		let parsedObjectArray = JSON.parse(datafileString);
		// return all the section data in the file as an Object[]
		let sectionRawData = this.extractResultValues(parsedObjectArray);
		let sectionArray: Section[] = [];
		for (let section of sectionRawData) {
			let testsection = new Section(section.Subject, section.Course,
				section.Avg, section.Professor, section.Title,
				section.Pass, section.Fail, section.Audit,
				String(section.id), Number(section.Year));
			sectionArray.push(testsection);
		}
		return sectionArray;
	}

	public extractResultValues(data: any[]): any[] {
		const results: any[] = [];

		data.forEach((item) => {
			for (const key in item) {
				const innerObject = JSON.parse(item[key]);
				if ("result" in innerObject) {
					results.push(...innerObject.result);
				}
			}
		});
		return results;
	}
	public async performQuery(query: unknown): Promise<InsightResult[]> {
		await this._initialization;
		try {
			let parsedQuery = parseQuery(query);
			let idFromQuery = getIDsFromQuery(parsedQuery);
			if (idFromQuery.length > 1) {
				return Promise.reject(new InsightError("Querying multiple datasets is rejected"));
			} else if (idFromQuery.length === 0) {
				return Promise.reject(new InsightError("No key found in the query"));
			}
			let id = idFromQuery[0];
			let dataList = this._currentAddedInsightDataset;
			if (!dataList.some((dataset) => dataset.id === id)) {
				return Promise.reject(new InsightError("Dataset " + id + " does not exist"));
			}

			let dataset = this.jsonToSection(id);
			let queryEngine = new QueryEngine(dataset, query);
			let result: InsightResult[] = queryEngine.runEngine();

			if (result.length > this.MAX_SIZE) {
				return Promise.reject(new ResultTooLargeError("The result is too big. " +
					"Only queries with a maximum of 5000 results are supported."));
			}

			return Promise.resolve(result);
		} catch (error) {
			if (error instanceof InsightError) {
				return Promise.reject(error);
			}
			return Promise.reject(new InsightError("Invalid query"));
		}
	}

	public getCurrentAddedDataset(): InsightDataset[] {
		return this._currentAddedInsightDataset;
	}

	public async  ensureDirectoryExists(dataFolderPath: string) {
		await this._initialization;
		await fs_extra.ensureDir(dataFolderPath);
	}

	public setCurrentAddedDataset(value: InsightDataset[]) {
		this._currentAddedInsightDataset = value;
	}
}
