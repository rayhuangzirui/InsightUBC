import {GeoResponse} from "./GeoResponse";

export class GeoService {
	private baseURL: string = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team231";

	public async fetchGeolocation(address: string): Promise<GeoResponse> {
		const encodedAddress = encodeURIComponent(address);
		const url = `${this.baseURL}/${encodedAddress}`;
		const response = await fetch(url);

		if (!response.ok) {
			throw new Error(`Failed to fetch geolocation: ${response.statusText}`);
		}
		return await response.json() as GeoResponse;
	}
}

