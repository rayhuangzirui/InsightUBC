import {parseData, readZip, unzipToDisk} from "./converter/jsonToSection";
import path from "path";
import JSZip from "jszip";

async function main() {
	try {
/*		const zipBuffer = await readZip(path.join(__dirname, "./resources/archives/pair.zip"));
		let parsedDataset = await unzipToDisk(zipBuffer);*/
		await parseData("./resources/archives/pair.zip");
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
