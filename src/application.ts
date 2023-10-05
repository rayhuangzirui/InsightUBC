import {parseData, readZip, unzipToDisk} from "./converter/jsonToSection";
import path from "path";
import JSZip from "jszip";
import * as fs from "fs";
import InsightFacade from "./controller/InsightFacade";
import {InsightDatasetKind} from "./controller/IInsightFacade";

async function main() {
	try {
/*		const zipBuffer = await readZip(path.join(__dirname, "./resources/archives/pair.zip"));
		let parsedDataset = await unzipToDisk(zipBuffer);*/
		let facade = new InsightFacade();
		// const zipBuffer = await readZip(path.join(__dirname, "./resources/archives/courses_chem121.zip"));
		let chem121 = fs.readFileSync("./resources/archives/courses_chem121.zip").toString("base64");
		// const zip = new JSZip();
		let parsedChem121 = await facade.addDataset("chem121", chem121, InsightDatasetKind.Sections);
/*		let parsedChem121 = await zip.loadAsync(chem121, {base64: true});
		console.log(parsedChem121);*/
		/*		const zip = new JSZip();
                let zipData = await zip.loadAsync(zipBuffer);
                for(let key in zipData.files){
                    let count = 3;
                    if(count >= 100) {
                        break;
                    }
                    let file = zipData.files[key];
                    console.log("file name: " + file.name);
                    count++;
                }*/
		/*		const pathToWrite = path.join(__dirname, "..", "data");
                console.log("path to write: " + pathToWrite);

                // console.log("successfully parsed the data into data folder");
            } catch (error) {
                console.error("error occurred during parsing:", error);
            }*/
	} catch (error) {
		console.error("error occurred during parsing:", error);
	}
}
main();
