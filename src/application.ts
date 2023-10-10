import {parseData, readZip, unzipToDisk} from "./converter/jsonToSection";
import path from "path";
import JSZip from "jszip";
import * as fs from "fs";
import {Section} from "./model/Section";
import {InsightDatasetKind} from "./controller/IInsightFacade";
import InsightFacade from "./controller/InsightFacade";

async function main() {
	/*		const zipBuffer = await readZip(path.join(__dirname, "./resources/archives/pair.zip"));
			let parsedDataset = await unzipToDisk(zipBuffer);*/
	// const zipBuffer = await readZip(path.join(__dirname, "./resources/archives/courses_chem121.zip"));
	// let pair = fs.readFileSync("./resources/archives/pair.zip").toString("base64");
	// const zip = new JSZip();
	// let result = await facade.addDataset("pair", pair, InsightDatasetKind.Sections);
	/* console.log(result);
	console.log(facade.getCurrentAddedDataset());*/
	// console.log(facade.getCurrentAddedDataset());
	// console.log(facade.getCurrentAddedDataset());
	// let parsedChem121 = await facade.removeDataset("pair");
	// console.log(facade.getCurrentAddedDataset());
	// let jsonstring = '{"Subject": "chem", "Course": "121", "Avg": 100, ' +
	// 	'"Professor": "test", "Title": "test", "Pass": 100, "Fail": 0, "Audit": 0, "id": "test", "Year": "2019"}';
	// console.log(objectafterparse);
	let facade = new InsightFacade();
	let rrr = fs.readFileSync("./resources/archives/pair.zip").toString("base64");
	await facade.addDataset("tes", rrr, InsightDatasetKind.Sections);
	// console.log("before adding any dataset" + facade.getCurrentAddedDataset().toString());
	// await facade.addDataset("tes", rrr, InsightDatasetKind.Sections);
	// console.log("after adding the first dataset" + facade.getCurrentAddedDataset());
	let rr = fs.readFileSync("./resources/archives/course.zip").toString("base64");
	await facade.addDataset("tess", rr, InsightDatasetKind.Sections);
	// console.log("after adding the second dataset" + facade.getCurrentAddedDataset());
	// await facade.loadAddedDatasetFromDisk();
	// console.log(facade.getCurrentAddedDataset());
	let newfacade = new InsightFacade();
	let datasetList = await newfacade.listDatasets();
	console.log("datasetlist " + datasetList);
	// let sections = facade.jsonToSection("tess");
/*
	await facade.addDataset("courses",
		fs.readFileSync("./resources/archives/pair.zip")
			.toString("base64"), InsightDatasetKind.Sections);
*/

}
main();
