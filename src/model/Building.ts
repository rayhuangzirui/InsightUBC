import {GeoService} from "../controller/GeoService";
import {InsightError} from "../controller/IInsightFacade";
import {GeoResponse} from "../controller/GeoResponse";
import {Room} from "./Room";

export class Building {
	private _lat: number;
	private _lon: number;
	private _fullname: string;
	private _shortname: string;
	private _address: string;
	private _href: string;
	private _rooms: Room[] = [];

	constructor(lat: number, lon: number, fullname: string, shortname: string, address: string, href: string) {
		this._lat = lat;
		this._lon = lon;
		this._fullname = fullname;
		this._shortname = shortname;
		this._address = address;
		this._href = href;
	}

	public getLat(): number {
		return this._lat;
	}

	public setLat(value: number) {
		this._lat = value;
	}

	public getLon(): number {
		return this._lon;
	}

	public setLon(value: number) {
		this._lon = value;
	}

	public getFullname(): string {
		return this._fullname;
	}

	public setFullname(value: string) {
		this._fullname = value;
	}

	public getShortname(): string {
		return this._shortname;
	}

	public setShortname(value: string) {
		this._shortname = value;
	}

	public getAddress(): string {
		return this._address;
	}

	public setAddress(value: string) {
		this._address = value;
	}

	public getHref(): string {
		return this._href;
	}

	public setHref(value: string) {
		this._href = value;
	}

	public getRooms(): Room[] {
		return this._rooms;
	}

	public setRooms(value: Room[]) {
		this._rooms = value;
	}

	public addRoom(room: Room) {
		this._rooms.push(room);
	}


	/*	public getGeoService(): GeoService{
		return this._geoService;
	}

	public setGeoService(geoService: GeoService){
		this._geoService = geoService;
	}*/

	public setLatLon(geoResponse: GeoResponse) {
		if (geoResponse.lon && geoResponse.lat && !geoResponse.error) {
			this.setLat(geoResponse.lat);
			this.setLon(geoResponse.lon);
		} else {
			throw new InsightError("error in geoResponse");
		}
	}

	public toPlainObject(): object {
		return {
			_lat: this._lat,
			_lon: this._lon,
			_fullname: this._fullname,
			_shortname: this._shortname,
			_address: this._address,
			_href: this._href,
			_rooms: this._rooms.map((room) => room.toPlainObject())
		};
	}
}
/* function jsonToBuilding(fieldNode: any): Building[] {
	let buildingList: Building[] = [];
	if (fieldNode.childNodes) {
		for (let child of fieldNode.childNodes || []) {
			if (child.tagName === "tr") {
				for (let td of child.childNodes || []) {

					// short name
					let shortnameAttr;
					if (td.attrs) {
						const tmpShortName = td.attrs.find((attr: any) =>
							attr.name === "class" &&
							attr.value.includes("views-field") &&
							attr.value.includes("views-field-field-building-code")
						);
						if (tmpShortName) {
							shortnameAttr = tmpShortName;
						}
					}
					if (!shortnameAttr) {
						throw new Error("No shortname attribute found");
					}
					let shortname: string = shortnameAttr.value;

					// address
					let address: string = td.attrs.find((attr: any) =>
						attr.name === "class" && attr.value.includes("views-field")
						&& attr.value.includes("views-field-field-building-address")).value;
// eslint-disable-next-line max-lines

					// todo: get real lat and lon
					let lat = 0;
					let lon = 0;

					// full name and href
					let fullname: string;
					let href: string = "";

					const titleAttr = td.attrs.find((attr: any) =>
						attr.name === "class" && attr.value.includes("views-field-title") &&
						attr.value.includes("views-field")
					);

					if (!titleAttr) {
						throw new Error("No title field td found");
					}
					fullname = titleAttr.value;
					if (!td.childNodes) {
						throw new Error("No href field a found");
					}
					href = "";
					let building = new Building(lat, lon, fullname, shortname, address, href);
					buildingList.push(building);
				}
				return buildingList;
			}
		}
	}
}*/


