import {IInsightFacade, InsightDataset, InsightDatasetKind, InsightError, InsightResult, NotFoundError,
	ResultTooLargeError
} from "./IInsightFacade";
import JSZip from "jszip";
import path from "path";
import * as fs from "fs";
import * as fs_extra from "fs-extra";
import * as fs_promises from "fs/promises";
import QueryEngine from "./QueryEngine";
import {
	isValidZip,
	isIdKindValid,
	countRowNumSections,
	countRowNumBuildings,
	createTimeoutPromise, processAllBuildings
} from "./InsightHelpers";
import {findValidBuildingRowsInTable, parseBuildingData, updateLatLon} from "./BuildingManager";
import * as building from "./BuildingManager";
import {DefaultTreeAdapterMap} from "parse5";
import * as rooms from "./RoomsManager";
import {Building} from "../model/Building";
import {parseQuery} from "../QueryParsers/QueryParser";
import {getDatasetFromKind, getIDsFromQuery} from "../QueryParsers/Validators";
import {findValidRoomRowsInTable} from "./RoomsManager";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
	private _currentAddedInsightDataset: InsightDataset[] = [];
	private MAX_SIZE = 5000;
	// private _initialization: Promise<void>;
	constructor() {
		console.log("InsightFacadeImpl::init()");
		// this._initialization = this.init();
		/*			.then(() => {
						console.log("init success");
					}).catch(() => {
						console.log("init failed");
						throw new InsightError("init failed");
					});
				console.log("InsightFacadeImpl::init()");*/
	}

	private async init() {
		try {
			return await this.loadAddedDatasetFromDisk();
		} catch (e) {
			throw new InsightError("init failed");
		}
	}

	public async addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		/*		try {
					await this._initialization;
				} catch (e) {
					return Promise.reject(new InsightError("init failed"));
				}*/
		if (kind !== InsightDatasetKind.Sections && kind !== InsightDatasetKind.Rooms) {
			return Promise.reject(new InsightError("Invalid kind"));
		}
		if (this._currentAddedInsightDataset.map((dataset) => dataset.id).includes(id)) {
			return Promise.reject(new InsightError("Dataset already exists"));
		}
		if (kind === InsightDatasetKind.Sections) {
			return this.handleSectionsDataset(id, content);
		}
		if (kind === InsightDatasetKind.Rooms) {
			return this.handleRoomsDataset(id, content);
		}
		return Promise.reject(new InsightError("Invalid kind"));
	}

	private async handleSectionsDataset(id: string, content: string): Promise<string[]> {
		/*		if (this._currentAddedInsightDataset.some((dataset) => dataset.id === id)) {
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
				let parsedData;
				try {
					parsedData = await Promise.all(jobs);
				} catch (e) {
					throw new InsightError("error parsing course data");
				}
				await this.writeDataToFile(id, parsedData);
				let datasetToBeAdded: InsightDataset = {
					id: id, kind: InsightDatasetKind.Sections, numRows: countRowNumSections(parsedData)
				};
				this._currentAddedInsightDataset.push(datasetToBeAdded);
				return this._currentAddedInsightDataset.map((dataset) => dataset.id);*/
		return Promise.reject(new InsightError("failed to remove dataset"));
	}

	private async handleRoomsDataset(id: string, content: string): Promise<string[]> {
		let parsedRoomsDataSet = await parseBuildingData(content);
		let table = building.findBuildingTables(parsedRoomsDataSet);
		if (!table) {
			return Promise.reject(new InsightError("no building table found"));
		}
		// let tbody = building.findTbody(table as DefaultTreeAdapterMap["childNode"]);
		let validRows = building.findValidBuildingRowsInTable(table as DefaultTreeAdapterMap["childNode"]);
		// let validRows = building.findValidBuildingRows(candidateRows);
		// console.log(validRows);
		let buildings = building.jsonToBuilding(validRows);
		await updateLatLon(buildings);
		let rowCount = 0;
		let promises = buildings.map(async (b) => {
			let filePath = b.getHref().slice(2);
			let roomcontent = await rooms.parseRoomData(content, filePath);
			let roomTable = rooms.findRoomsTables(roomcontent);
			if (roomTable) {
				let roomTbody = rooms.findValidRoomRowsInTable(roomTable as DefaultTreeAdapterMap["childNode"]);
				let roomsList = rooms.rowsToRooms(roomTbody, b);
				if (roomsList.length > 0) {
					b.setRooms(roomsList);
				} else {
					buildings = buildings.filter((item) => item !== b);
				}
				rowCount += roomsList.length;
			} else {
				buildings = buildings.filter((item) => item !== b);
			}
		});
		await Promise.all(promises);
		await this.writeBuildingsToFile(id, buildings);
		let datasetToBeAdded: InsightDataset = {
			id: id, kind: InsightDatasetKind.Rooms, numRows: rowCount,
		};
		this._currentAddedInsightDataset.push(datasetToBeAdded);
		return this._currentAddedInsightDataset.map((dataset) => dataset.id);
	}
/*
	private async handleRoomsDataset(id: string, content: string): Promise<string[]> {
		const timeoutPromise = createTimeoutPromise(6000, "error in adding dataset");
		const processDatasetPromise = (async () => {
			let parsedRoomsDataSet = await parseBuildingData(content);
			let table = building.findBuildingTables(parsedRoomsDataSet);
			if (!table) {
				throw new InsightError("no building table found");
			}
			let validRows = building.findValidBuildingRowsInTable(table as DefaultTreeAdapterMap["childNode"]);
			let buildings = building.jsonToBuilding(validRows);
			await updateLatLon(buildings);
			let rowCount = await processAllBuildings(buildings, content, rooms);

			buildings = buildings.filter((b) => b.getRooms().length > 0);
			await this.writeBuildingsToFile(id, buildings);
			let datasetToBeAdded: InsightDataset = {
				id: id, kind: InsightDatasetKind.Rooms, numRows: rowCount
			};
			this._currentAddedInsightDataset.push(datasetToBeAdded);
			return this._currentAddedInsightDataset.map((dataset) => dataset.id);
		})();
		return Promise.race([processDatasetPromise, timeoutPromise]) as Promise<string[]>;
	}
*/

	private async writeDataToFile(id: string, parsedData: any[]): Promise<void> {
		try {
			const pathToWrite = path.join(__dirname, "..", "..", "data", "Sections" + "_" + id + ".json");
			let stringfiedData = JSON.stringify(parsedData, null, 2);
			await this.ensureDirectoryExists(path.join(__dirname, "..", "..", "data"));
			await fs_promises.writeFile(pathToWrite, stringfiedData);
		} catch (e) {
			throw new InsightError("error writing to file");
		}
	}

	private async writeBuildingsToFile(id: string, buildingData: Building[]): Promise<void> {
		try {
			const plainData = buildingData.map((b) => b.toPlainObject());
			const stringfiedData = JSON.stringify(plainData, null, 2);
			const pathToWrite = path.join(__dirname, "..", "..", "data", "Buildings" + "_" + id + ".json");
			await this.ensureDirectoryExists(path.join(__dirname, "..", "..", "data"));
			await fs_promises.writeFile(pathToWrite, stringfiedData);
		} catch (e) {
			throw new InsightError("error writing to file");
		}
	}

	public async removeDataset(id: string): Promise<string> {
		/*		try {
					await this._initialization;
				} catch (e) {
					return Promise.reject(new InsightError("init failed"));
				}
				try {
					if (!isIdKindValid(id, InsightDatasetKind.Sections) && !isIdKindValid(id, InsightDatasetKind.Rooms)) {
						return Promise.reject(new InsightError());
					}
					const datasetExists = this._currentAddedInsightDataset.some((dataset) => dataset.id === id);
					if (!datasetExists) {
						return Promise.reject(new NotFoundError("Dataset not found"));
					}
					const datasetToRemove = this._currentAddedInsightDataset.find((dataset) => dataset.id === id);
					if (datasetToRemove?.kind === InsightDatasetKind.Sections) {
						this._currentAddedInsightDataset = this._currentAddedInsightDataset
							.filter((dataset) => dataset.id !== id);
						const pathToDelete = path.join(__dirname, "..","..", "data", "Sections" + "_" + id + ".json");
						await fs.promises.unlink(pathToDelete);
						return id;
					} else if (datasetToRemove?.kind === InsightDatasetKind.Rooms) {
						this._currentAddedInsightDataset = this._currentAddedInsightDataset
							.filter((dataset) => dataset.id !== id);
						const pathToDelete = path.join(__dirname, "..","..", "data", "Buildings" + "_" + id + ".json");
						await fs.promises.unlink(pathToDelete);
						return id;
					}
					return Promise.reject(new InsightError("Invalid kind"));
				} catch (error) {
					return Promise.reject(new InsightError("failed to remove dataset"));
				}*/
		return Promise.reject(new InsightError("failed to remove dataset"));
	}

	public async listDatasets(): Promise<InsightDataset[]> {
		/*		try {
					await this._initialization;
				} catch (e) {
					return Promise.reject(new InsightError("init failed"));
				}
				try {
					return this._currentAddedInsightDataset;
				} catch (error) {
					return Promise.reject(error);
				}*/
		return Promise.reject(new InsightError("failed to remove dataset"));
	}

	public async loadAddedDatasetFromDisk(): Promise<void> {
		try {
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
					if (file.startsWith("Sections")) {
						this._currentAddedInsightDataset.push({
							id: file.split(".")[0].split("_")[1],
							kind: InsightDatasetKind.Sections,
							numRows: countRowNumSections(parsedData)
						});
					} else if (file.startsWith("Buildings")) {
						this._currentAddedInsightDataset.push({
							id: file.split(".")[0].split("_")[1],
							kind: InsightDatasetKind.Rooms,
							numRows: countRowNumBuildings(parsedData)
						});
					}
				}
			});
			await Promise.all(filePromises);
		} catch (e) {
			throw new InsightError("error loading dataset from disk");
		}
	}

	public async performQuery(query: unknown): Promise<InsightResult[]> {
		return Promise.reject(new InsightError("failed to remove dataset"));
	}

	public async ensureDirectoryExists(dataFolderPath: string) {
		// await this._initialization;
		await fs_extra.ensureDir(dataFolderPath);
	}
}
