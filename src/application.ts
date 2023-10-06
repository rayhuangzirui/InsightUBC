import {parseData, readZip, unzipToDisk} from "./converter/jsonToSection";
import path from "path";
import JSZip from "jszip";
import * as fs from "fs";
import InsightFacade from "./controller/InsightFacade";
import {InsightDatasetKind} from "./controller/IInsightFacade";

let facade = new InsightFacade();
async function main() {
	/*		const zipBuffer = await readZip(path.join(__dirname, "./resources/archives/pair.zip"));
			let parsedDataset = await unzipToDisk(zipBuffer);*/
	// const zipBuffer = await readZip(path.join(__dirname, "./resources/archives/courses_chem121.zip"));
	let pair = fs.readFileSync("./resources/archives/pair.zip").toString("base64");
	// const zip = new JSZip();
	let result = await facade.addDataset("pair", pair, InsightDatasetKind.Sections);
	/* console.log(result);
	console.log(facade.getCurrentAddedDataset());*/
	console.log(facade.getCurrentAddedDataset());
	// console.log(facade.getCurrentAddedDataset());
	// let parsedChem121 = await facade.removeDataset("pair");
	console.log(facade.getCurrentAddedDataset());
}
main();
