export class Building {
	private _lat: number;
	private _lon: number;
	private _fullname: string;
	private _shortname: string;
	private _address: string;
	private _href: string;

	constructor(lat: number, lon: number, fullname: string, shortname: string, address: string, href: string) {
		this._lat = lat;
		this._lon = lon;
		this._fullname = fullname;
		this._shortname = shortname;
		this._address = address;
		this._href = href;
	}

	private get lat(): number {
		return this._lat;
	}

	private set lat(value: number) {
		this._lat = value;
	}

	private get lon(): number {
		return this._lon;
	}

	private set lon(value: number) {
		this._lon = value;
	}

	private get fullname(): string {
		return this._fullname;
	}

	private set fullname(value: string) {
		this._fullname = value;
	}

	private get shortname(): string {
		return this._shortname;
	}

	private set shortname(value: string) {
		this._shortname = value;
	}


	private get address(): string {
		return this._address;
	}

	private set address(value: string) {
		this._address = value;
	}

	private get href(): string {
		return this._href;
	}

	private set href(value: string) {
		this._href = value;
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
