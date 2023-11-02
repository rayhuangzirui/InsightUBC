import * as http from "http";
import {GeoResponse} from "./GeoResponse";
import {InsightError} from "./IInsightFacade";

export class GeoService {
	private baseURL: string = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team231";
	private httpAgent: http.Agent;

	constructor() {
		this.httpAgent = new http.Agent({keepAlive: true, maxSockets: Infinity});
	}

	public fetchGeolocation(address: string): Promise<GeoResponse> {
		return new Promise((resolve, reject) => {
			const encodedAddress = encodeURIComponent(address);
			const url = new URL(`${this.baseURL}/${encodedAddress}`);
			const options = {
				agent: this.httpAgent,
			};

			http.get(url, options, (response) => {
				let data = "";
				response.on("data", (dataflow) => {
					data += dataflow;
				});
				response.on("end", () => {
					if (response.statusCode !== 200) {
						reject(new InsightError("error parsing geolocation data"));
					} else {
						try {
							const parsedData = JSON.parse(data);
							resolve(parsedData as GeoResponse);
						} catch (e) {
							reject(new InsightError("error parsing geolocation data"));
						}
					}
				});
			}).on("error", (error) => {
				reject(new InsightError("error fetching geolocation data"));
			});
		});
	}
}

