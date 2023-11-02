import {InsightError} from "../controller/IInsightFacade";
import {GeoResponse} from "../controller/GeoResponse";
import {Room} from "./Room";

export class Building {
	public _lat: number;
	public _lon: number;
	public _fullname: string;
	public _shortname: string;
	public _address: string;
	public _href: string;
	public _rooms: Room[] = [];

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
			// _href: this._href,
			_rooms: this._rooms.map((room) => room.toPlainObject())
		};
	}
}


