// src/converters/converter.ts
import JSZip from "jszip";
import * as fs from "fs";
import * as path from "path";

export async function readZip(zipFilePath: string): Promise<Buffer> {
	try {
		return await fs.promises.readFile(zipFilePath);
	} catch (error) {
		console.error("Error reading file:", error);
		throw error;
	}
}
export async function unzipToDisk(zipBuffer: Buffer): Promise<string> {
	const zip = new JSZip();
	let zipData;
	try {
		// zipdata is of type JSZip
		// zipData.files is of type object: files: {[key: string]: JSZip.JSZipObject};
		// js objects are key value pairs
		zipData = await zip.loadAsync(zipBuffer);
		return JSON.stringify(zipData, null, 4);
	} catch (error) {
		console.error("Error loading ZIP buffer:", error);
		throw error;
	}
	// define the path to write the unzipped files to
	/*	try {
            const pathToWrite = path.join(__dirname, "..", "data","parsedData.json");
            console.log("path to write: " + pathToWrite);
            let writeJobs: Array<Promise<string>> = [];
            zipData.forEach((relativePath, zipEntry) => {
                if (!zipEntry.dir) {
                    // console.log("zipEntry" + zipEntry);
                    writeJobs.push(zipEntry.async("text"));
                }
            });
            console.log(zipData);
            let unzipped = await Promise.all(writeJobs);
            const datasetObject = {
                data: unzipped
            };*/

	// fs.writeFileSync(pathToWrite, jsonOutput);
	// console.log("unzipped[10]: " + unzipped[503]);
	/*		for (const section of unzipped) {
                try {
                    // const relativePath = Object.keys(zipData)[unzipped.indexOf(data)];
                    //section is of type string
                    section.
                    const filePath = path.join(dataFolderPath, relativePath);
                    fs.writeFileSync(filePath, data);
                } catch (error) {
                    console.error("Error writing file:", error);
                }
            }*/
	/*	} catch (error) {
            console.error("Error unzipping data:", error);
            return;
        }*/
	/*	zipData.forEach((relativePath, zipEntry) => {
            if (!zipEntry.dir) {
                writeJobs.push(zipEntry.async("nodebuffer"));
            }
        });*/
}
export async function parseData(datasetPath: string): Promise<void> {
	try {
		const zipBuffer = await readZip(datasetPath);
		let parsedDataset = await unzipToDisk(zipBuffer);
		const pathToWrite = path.join(__dirname, "..", "data",extractFileName(datasetPath) + ".json");
		fs.writeFileSync(pathToWrite, parsedDataset);
	} catch (error) {
		console.error("error occurred during parsing:", error);
	}
}

function extractFileName(filePath: string): string | null {
	const match = filePath.match(/\/([^/]+)\.zip$/);
	return match ? match[1] : null;
}


