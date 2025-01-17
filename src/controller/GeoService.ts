import {GeoResponse} from "./GeoResponse";
import http from "http";
import {InsightError} from "./IInsightFacade";

export class GeoService {
	private baseURL: string = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team231";

	public fetchGeolocation(address: string): Promise<GeoResponse> {
		// console.log(address);
		return new Promise((resolve, reject) => {
			const encodedAddress = encodeURIComponent(address);
			const url = new URL(`${this.baseURL}/${encodedAddress}`);
			http.get(url, (response) => {
				let data = "";
				response.on("data", (dataflow) => {
					data += dataflow;
				});
				response.on("end", () => {
					if (response.statusCode !== 200) {
						reject(new InsightError("error parsing geolocation data"));
					} else {
						resolve(JSON.parse(data) as GeoResponse);
					}
				});
			}).on("error", (error) => {
				reject(new InsightError("error parsing geolocation data"));
			});
		});
	}
}

