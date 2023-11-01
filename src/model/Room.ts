export class Room {
	private _room_number: string;
	private _room_name: string;
	private _seats: number;
	private _type: string;
	private _furniture: string;

	constructor(room_number: string, room_name: string, seats: number, type: string, furniture: string) {
		this._room_number = room_number;
		this._room_name = room_name;
		this._seats = seats;
		this._type = type;
		this._furniture = furniture;
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
