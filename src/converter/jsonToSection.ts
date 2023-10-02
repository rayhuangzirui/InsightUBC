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
export async function unzipToDisk(zipBuffer: Buffer): Promise<void> {
	const zip = new JSZip();
	let zipData;
	try {
		// zipdata is of type Buffer, a binary representation of the zip file
		zipData = await zip.loadAsync(zipBuffer);
	} catch (error) {
		console.error("Error loading ZIP buffer:", error);
		return;
	}
	// define the path to write the unzipped files to
	try {
		const pathToWrite = path.join(__dirname, "..", "data");
		console.log("path to write: " + pathToWrite);
		let writeJobs: Array<Promise<string>> = [];
		zipData.forEach((relativePath, zipEntry) => {
			if (!zipEntry.dir) {
				// console.log("zipEntry" + zipEntry);
				writeJobs.push(zipEntry.async("text"));
			}
		});
		let unzipped = await Promise.all(writeJobs);
		console.log("unzipped[10]: " + unzipped[502]);
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
	} catch (error) {
		console.error("Error unzipping data:", error);
		return;
	}
/*	zipData.forEach((relativePath, zipEntry) => {
		if (!zipEntry.dir) {
			writeJobs.push(zipEntry.async("nodebuffer"));
		}
	});*/

/*	let unzipped;
	try {
		unzipped = await Promise.all(writeJobs);
	} catch (error) {
		console.error("Error unzipping data:", error);
		return;
	}

*/
}

