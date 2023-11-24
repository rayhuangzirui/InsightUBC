import {App} from "./App";

async function main() {
	let app = new App();
	await app.initServer(4321);
}

// main().then((r) => console.log("Server started")).catch((e) => console.error("Error starting server:", e));
main();
