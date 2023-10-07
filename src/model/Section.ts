
export class Section {
	private _dept: string;
	// course id
	private _id: string;
	private _avg: number;
	private _instructor: string;
	private _title: string;
	// number of students who passed
	private _pass: number;
	// number of students who failed
	private _fail: number;
	// number of students who audited
	private _audit: number;
	// section id
	private _uuid: string;
	private _year: number;

	constructor(dept: string, id: string, avg: number,
		instructor: string, title: string,
		pass: number, fail: number, audit: number,
		uuid: string, year: number) {
		this._dept = dept;
		this._id = id;
		this._avg = avg;
		this._instructor = instructor;
		this._title = title;
		this._pass = pass;
		this._fail = fail;
		this._audit = audit;
		this._uuid = uuid;
		this._year = year;
	}
/*	constructor() {
	}*/


	public get dept(): string {
		return this._dept;
	}

	public set dept(value: string) {
		this._dept = value;
	}

	public get id(): string {
		return this._id;
	}

	public set id(value: string) {
		this._id = value;
	}

	public get avg(): number {
		return this._avg;
	}

	public set avg(value: number) {
		this._avg = value;
	}

	public get instructor(): string {
		return this._instructor;
	}

	public set instructor(value: string) {
		this._instructor = value;
	}

	public get title(): string {
		return this._title;
	}

	public set title(value: string) {
		this._title = value;
	}

	public get pass(): number {
		return this._pass;
	}

	public set pass(value: number) {
		this._pass = value;
	}

	public get fail(): number {
		return this._fail;
	}

	public set fail(value: number) {
		this._fail = value;
	}

	public get audit(): number {
		return this._audit;
	}

	public set audit(value: number) {
		this._audit = value;
	}

	public get uuid(): string {
		return this._uuid;
	}

	public set uuid(value: string) {
		this._uuid = value;
	}

	public get year(): number {
		return this._year;
	}

	public set year(value: number) {
		this._year = value;
	}

	public jsonToSection(json: any): Section {
		return new Section(json.Subject, json.Course, json.Avg, json.Professor,
			json.Title, json.Pass, json.Fail, json.Audit, json.id, json.Year);
	}
}
