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
import {extractResultValues,jsonToSection,isValidZip,isIdKindValid,countRowNum} from "./InsightHelpers";

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
			}).catch(() => {
				console.log("init failed");
				throw new InsightError("init failed");
			});
		console.log("InsightFacadeImpl::init()");
	}

	private async init() {
		try {
			return await this.loadAddedDatasetFromDisk();
		} catch (e) {
			throw new InsightError("init failed");
		}
	}
	public async addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		try {
			await this._initialization;
		} catch (e) {
			return Promise.reject(new InsightError("init failed"));
		}
		if (!isIdKindValid(id, kind)) {
			return Promise.reject(new InsightError());
		}
		if (this._currentAddedInsightDataset.some((dataset) => dataset.id === id)) {
			return Promise.reject(new InsightError("Dataset already exists"));
		}
		let zip = new JSZip();
		let jobs: Array<Promise<{[course: string]: string}>> = [];
		let loadedContent;
		try {
			loadedContent = await zip.loadAsync(content, {base64: true});
			const isValid = await isValidZip(loadedContent);
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
				}).catch((error) => {
					throw new InsightError("error parsing section data");
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
		await this.writeDataToFile(id, parsedData);
		let datasetToBeAdded: InsightDataset = {
			id: id, kind: kind, numRows: countRowNum(parsedData)
		};
		this._currentAddedInsightDataset.push(datasetToBeAdded);
		return this._currentAddedInsightDataset.map((dataset) => dataset.id);
	}

	private async writeDataToFile(id: string, parsedData: any[]): Promise<void> {
		try {
			const pathToWrite = path.join(__dirname, "..", "..", "data", id + ".json");
			let stringfiedData = JSON.stringify(parsedData, null, 2);
			await this.ensureDirectoryExists(path.join(__dirname, "..", "..", "data"));
			fs.writeFileSync(pathToWrite, stringfiedData);
		} catch (e) {
			throw new InsightError("error writing to file");
		}
	}

	public async removeDataset(id: string): Promise<string> {
		try {
			await this._initialization;
		} catch (e) {
			return Promise.reject(new InsightError("init failed"));
		}
		try {
			if (!isIdKindValid(id, InsightDatasetKind.Sections)) {
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
		try {
			await this._initialization;
		} catch (e) {
			return Promise.reject(new InsightError("init failed"));
		}
		try {
			return this._currentAddedInsightDataset;
		} catch (error) {
			return Promise.reject(error);
		}
	}

	// push the existing dataset to the _currentAddedInsightDataset for handling crashes
	public async loadAddedDatasetFromDisk(): Promise<void> {
		try {
			// to ensure the data folder exists
			await this.ensureDirectoryExists(path.join(__dirname, "..", "..", "data"));
			const files = await fs_extra.promises.readdir(path.join(__dirname, "..", "..", "data"));
			const filePromises = files.map(async (file) => {
				if (file === ".gitkeep") {
					return;
				}
				const filePath = path.join(__dirname, "..", "..", "data", file);
				const stat = await fs_extra.stat(filePath);

				if (stat.isFile()) {
					const fileContent = await fs_extra.readFile(filePath, "utf8");
					const parsedData = (JSON.parse(fileContent) as any[]);

					this._currentAddedInsightDataset.push({
						id: file.split(".")[0],
						kind: InsightDatasetKind.Sections,
						numRows: extractResultValues(parsedData).length
					});
				}
			});

			await Promise.all(filePromises);
		} catch (e) {
			throw new InsightError("error loading dataset from disk");
		}
	}

	public async performQuery(query: unknown): Promise<InsightResult[]> {
		try {
			await this._initialization;
		} catch (e) {
			return Promise.reject(new InsightError("init failed"));
		}
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

			let dataset = jsonToSection(id);
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
