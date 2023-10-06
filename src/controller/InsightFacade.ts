import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError
} from "./IInsightFacade";
import JSZip from "jszip";
import path from "path";
import * as fs from "fs";
import {Section} from "../model/Section";

type DatasetId = string;
type CourseName = string;

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
	private _currentAddedInsightDataset: InsightDataset[] = [];
	private _currentAddedDatasetId: string[] = [];
	// This map contains the real data for all added datasets
	private _addedDatasets: Array<{[key: string]: Section[]}>;

	constructor() {
		console.log("InsightFacadeImpl::init()");
	}
	public async addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
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
		} catch (e) {
			throw new InsightError("error parsing course data");
		}

		let rowNumber = this.countRowNum(parsedData);
		// todo: use code to create data directory
		const pathToWrite = path.join(__dirname, "..", "data", id + ".json");
		let stringfiedData = JSON.stringify(parsedData, null, 2);

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
			const datasetExists = this._currentAddedInsightDataset.some((dataset) => dataset.id === id);
			if (!datasetExists) {
				return Promise.reject(new NotFoundError("Dataset not found"));
			}
			// remove from memory cache
			this._currentAddedInsightDataset = this._currentAddedInsightDataset.filter((dataset) => dataset.id !== id);
			const pathToDelete = path.join(__dirname, "..", "data", id + ".json");
			await fs.promises.unlink(pathToDelete);
			return id;

		} catch (error) {
			return Promise.reject(new InsightError("failed to remove dataset"));
		}
	}


	public async listDatasets(): Promise<InsightDataset[]> {
		try {
			return this._currentAddedInsightDataset;
		} catch (error) {
			return Promise.reject(error);
		}
	}

	public async loadAddedDatasetFromDisk(): Promise<void> {
		const content = await fs.promises.readdir(path.join(__dirname, "..", "data"));
	}

	// convert each section record within a dataset json file to a Section object
/*	public jsonToSection(sectionRecordJson: any): Section {
	}
		const sectionObject = JSON.parse(sectionRecordJson, (key, value) => {
			if (key === "Year") {

		}
		return new Section();

	}*/
// todo：handle when undefined parameter is passed in constructor
	public jsonToSection(json: string): Section {
		let parsedObject = JSON.parse(json);
		console.log(parsedObject.Subject);
		return new Section(parsedObject.Subject, parsedObject.Course,
			parsedObject.Avg, parsedObject.Professor, parsedObject.Title,
			parsedObject.Pass, parsedObject.Fail, parsedObject.Audit,
			parsedObject.id, parsedObject.Year);
	}

	public performQuery(query: unknown): Promise<InsightResult[]> {
		return Promise.reject("Not implemented.");
	}


	public getCurrentAddedDataset(): InsightDataset[] {
		return this._currentAddedInsightDataset;
	}

	public setCurrentAddedDataset(value: InsightDataset[]) {
		this._currentAddedInsightDataset = value;
	}
}
