import Server from "./rest/Server";

/**
 * Main app class that is run with the node command. Starts the server.
 */
export class App {
	// receive the port number as a parameter
	public initServer(port: number) {
		console.info(`App::initServer( ${port} ) - start`);
		// server 可能是封装了 express 启动逻辑的自定义类
		const server = new Server(port);
		return server.start().then(() => {
			console.info("App::initServer() - started");
		}).catch((err: Error) => {
			console.error(`App::initServer() - ERROR: ${err.message}`);
		});
	}
}

// This ends up starting the whole system and listens on a hardcoded port (4321)
console.info("App - starting");
const app = new App();
(async () => {
	await app.initServer(4321);
})();
