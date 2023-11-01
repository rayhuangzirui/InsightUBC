export class Room {
	public _room_number: string;
	public _room_name: string;
	public _seats: number;
	public _type: string;
	public _furniture: string;
	public _lat?: number;
	public _lon?: number;
	public _fullname?: string;
	public _shortname?: string;
	public _address?: string;
	public _href?: string;

	constructor(
		room_number: string,
		room_name: string,
		seats: number,
		type: string,
		furniture: string,
		lat?: number,
		lon?: number,
		fullname?: string,
		shortname?: string,
		address?: string,
		href?: string
	) {
		this._room_number = room_number;
		this._room_name = room_name;
		this._seats = seats;
		this._type = type;
		this._furniture = furniture;
		this._lat = lat;
		this._lon = lon;
		this._fullname = fullname;
		this._shortname = shortname;
		this._address = address;
		this._href = href;
	}

	public getRoomNumber(): string {
		return this._room_number;
	}

	public setRoomNumber(value: string) {
		this._room_number = value;
	}

	public getRoomName(): string {
		return this._room_name;
	}

	public setRoomName(value: string) {
		this._room_name = value;
	}

	public getSeats(): number {
		return this._seats;
	}

	public setSeats(value: number) {
		this._seats = value;
	}

	public getType(): string {
		return this._type;
	}

	public setType(value: string) {
		this._type = value;
	}

	public getFurniture(): string {
		return this._furniture;
	}

	public setFurniture(value: string) {
		this._furniture = value;
	}

	public toPlainObject(): object {
		return {
			_room_number: this._room_number,
			_room_name: this._room_name,
			_seats: this._seats,
			_type: this._type,
			_furniture: this._furniture
		};
	}
}
