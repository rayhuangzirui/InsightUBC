import path from "path";
import JSZip from "jszip";
import * as fs from "fs";
import * as fs_promise from "fs/promises";
import {Section} from "./model/Section";
import {InsightDatasetKind} from "./controller/IInsightFacade";
// import InsightFacade from "./controller/InsightFacade";
import * as parse5 from "parse5" ;
import {tableToRooms} from "./controller/InsightHelpers";
// eslint-disable-next-line import/namespace
import InsightFacade from "./controller/InsightFacade";
import {App} from "./App";
import {getDatasetFromKind,prepareForQuery} from "./QueryParsers/Validators";
import {getContentFromArchives} from "../test/TestUtil";
import {findValidBuildingRowsInTable, jsonToRooms} from "./controller/BuildingManager";

async function main() {
	let facade = new InsightFacade();
	let app = new App();
	await app.initServer(4321);
}

main();
