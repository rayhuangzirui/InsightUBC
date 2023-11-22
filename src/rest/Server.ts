import express, {Application, Request, Response} from "express";
import * as http from "http";
import cors from "cors";
import InsightFacade from "../controller/InsightFacade";
import {InsightDatasetKind, InsightResult} from "../controller/IInsightFacade";
import fs from "fs";

export default class Server {
	private readonly port: number;
	// used to store the express instance; used to register middleware and routes
	private express: Application;
	// http server is used to start the server and listen on the specified port
	// this server can listen to the client's requests and send responses
	private server: http.Server | undefined;
	private insightFacade: InsightFacade = new InsightFacade();

	constructor(port: number) {
		console.info(`Server::<init>( ${port} )`);
		this.port = port;
		this.express = express();
		// make sure the middleware and routes are before server starting to listen to requests
		this.registerMiddleware();
		this.registerRoutes();
		// NOTE: you can serve static frontend files in from your express server
		// by uncommenting the line below. This makes files in ./frontend/public
		// accessible at http://localhost:<port>/
		// this.express.use(express.static("./frontend/public"))
	}

	/**
	 * Starts the server. Returns a promise that resolves if success. Promises are used
	 * here because starting the server takes some time and we want to know when it
	 * is done (and if it worked).
	 *
	 * @returns {Promise<void>}
	 */
	public start(): Promise<void> {
		if (this.server !== undefined) {
			console.error("Server::start() - ERROR: server already started");
			return Promise.reject(new Error("Server already started"));
		}
		return new Promise((resolve, reject) => {
			this.server = this.express.listen(this.port, () => {
				console.info(`Server::start() - started at http://localhost:${this.port}`);
				resolve();
			}).on("error", (err: Error) => {
				console.error(`Server::start() - ERROR: ${err.message}`);
				reject(err);
			});
/*			this.loadInitialDatasets()
				.then(() => {
					this.server = this.express
						.listen(this.port, () => {
							console.info(`Server::start() server listening ${this.port}`);
							resolve();
						})
						.on("error", async (e: Error) => {
							if ((e as any).code === "EADDRINUSE") {
								console.error(`Server::start() - ERROR: Port ${this.port} is already in use`);
								try {
									await this.stop();
									console.log("Server stopped successfully.");
								} catch (error) {
									console.error("Error stopping the server:", error);
								}
							} else {
								console.error(`Server::start() - server ERROR: ${(e as Error).message}`);
								reject(e);
							}
						});
				})
				.catch((e: Error) => {
					console.error(`Server::start() - ERROR loading datasets: ${(e as Error).message}`);
					reject(e);
				});*/
		});
	}

	/**
	 * Stops the server. Again returns a promise so we know when the connections have
	 * actually been fully closed and the port has been released.
	 *
	 * @returns {Promise<void>}
	 */
	public stop(): Promise<void> {
		console.info("Server::stop()");
		return new Promise((resolve, reject) => {
			if (this.server === undefined) {
				console.error("Server::stop() - ERROR: server not started");
				reject();
			} else {
				this.server.close(() => {
					console.info("Server::stop() - server closed");
					resolve();
				});
			}
		});
	}

	private loadInitialDatasets(): Promise<void> {
		// let insightFacade = new InsightFacade();
		return new Promise((resolve, reject) => {
			let rooms: string = fs.readFileSync("./resources/archives/campus.zip").toString("base64");
			let sections: string = fs.readFileSync("./resources/archives/pair.zip").toString("base64");

			// insightFacade.addDataset("sections", sections, InsightDatasetKind.Sections)
			this.insightFacade
				.addDataset("sections", sections, InsightDatasetKind.Sections)
				.then(() => {
					return this.insightFacade.addDataset("rooms", rooms, InsightDatasetKind.Rooms);
				})
				.then(() => {
					resolve();
				})
				.catch((error: Error) => {
					if (error.message.includes("Dataset already exists")) {
						console.log("Dataset already exists, continuing.");
						resolve();
					} else {
						reject(error);
					}
				});
		});
	}

	// Registers middleware to parse request before passing them to request handlers
	private registerMiddleware() {
		// JSON parser must be place before raw parser because of wildcard matching done by raw parser below
		// register a built-in express middleware
		// this middleware parses incoming requests with JSON payloads and put the parsed object in req.body
		this.express.use(express.json());
		this.express.use(express.raw({type: "application/*", limit: "10mb"}));
		// enable cors in request headers to allow cross-origin HTTP requests
		this.express.use(cors());
	}

	// Registers all request handlers to routes
	private registerRoutes() {
		// This is an example endpoint this you can invoke by accessing this URL in your browser:
		// http://localhost:4321/echo/hello
		this.express.get("/echo/:msg", Server.echo);
		this.express.get("/", (req, res) => {
			res.send("Welcome to the server!");
		});
		this.express.post("/query", this.handleQuery.bind(this));
		this.express.put("/dataset/:id/:kind", this.handleAddDataset.bind(this));
		this.express.delete("/dataset/:id", this.handleRemoveDataset.bind(this));
		this.express.get("/datasets", this.handleListDatasets.bind(this));
	}

	private handleAddDataset(req: Request, res: Response) {
		try {
			const id = req.params.id;
			// const kind = req.params.kind;
			let kind;
/*			const kind = req.params.kind.toLowerCase().trim() === "rooms" ?
				InsightDatasetKind.Rooms : InsightDatasetKind.Sections;*/
			if (req.params.kind.toLowerCase().trim() === "rooms") {
				kind = InsightDatasetKind.Rooms;
			} else if (req.params.kind.toLowerCase().trim() === "sections") {
				kind = InsightDatasetKind.Sections;
			} else {
				res.status(400).json({success: false, error: "Invalid dataset kind"});
				return;
			}
			const content = req.body.toString("base64");
			this.insightFacade.addDataset(id, content, kind).then((result) => {
				res.status(200).json({success: true, result: result});
			}).catch((error) => {
				res.status(400).json({success: false, error: error});
			});
		} catch (error) {
			res.status(400).json({success: false, error: error});
		}
	}

	private handleRemoveDataset(req: Request, res: Response) {
		try {
			const id = req.params.id;
			this.insightFacade.removeDataset(id).then((result) => {
				res.status(200).json({success: true, result: result});
			}).catch((error) => {
				res.status(400).json({success: false, error: error});
			});
		} catch (error) {
			res.status(400).json({success: false, error: error});
		}
	}

	private handleListDatasets(req: Request, res: Response) {
		try {
			this.insightFacade.listDatasets().then((result) => {
				res.status(200).json({success: true, result: result});
			}).catch((error) => {
				res.status(400).json({success: false, error: error});
			});
		} catch (error) {
			res.status(400).json({success: false, error: error});
		}
	}

	// The next two methods handle the echo service.
	// These are almost certainly not the best place to put these, but are here for your reference.
	// By updating the Server.echo function pointer above, these methods can be easily moved.
	private static echo(req: Request, res: Response) {
		try {
			console.log(`Server::echo(..) - params: ${JSON.stringify(req.params)}`);
			const response = Server.performEcho(req.params.msg);
			console.log("hello");
			res.status(200).json({result: response});
		} catch (err) {
			console.log("hello");
			res.status(400).json({error: err});
		}
	}

	private static performEcho(msg: string): string {
		if (typeof msg !== "undefined" && msg !== null) {
			return `${msg}...${msg}`;
		} else {
			return "Message not provided";
		}
	}

	private async handleQuery(req: Request, res: Response) {
		const queryData = req.body;
		try {
			const result = await this.insightFacade.performQuery(queryData);
			console.log(result);
			res.status(200).json({success: true, result: result});
		} catch (err) {
			console.log(err);
			res.status(400).json({error: err});
		}
	}
}
