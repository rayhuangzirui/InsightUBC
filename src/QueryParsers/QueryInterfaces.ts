
import {NOT, Sfield, Mfield, LOGIC, MCOMPARATOR, IS, APPLYTOKEN, DIRECTION} from "./ClausesEnum";

export interface Query {
	body: WHERE;
	options: OPTIONS;
  transformations?: TRANSFORMATIONS;
}

// Updated Query Interface for new dataset Rooms
export interface TRANSFORMATIONS {
  group: GROUP;
  apply: APPLYRULE[]; // can be empty
}

export interface GROUP {
  keys: Key[];
}

// export interface APPLY {
//   applyrules?: APPLYRULE[];
// }

export interface APPLYRULE {
  applykey: string;
  applytoken: APPLYTOKEN;
  key: Key;
}

export interface WHERE {
  filter?: FILTER;
}

export interface FILTER {
  logicComp?: LOGICCOMPARISON;
  mComp?: MCOMPARISON;
  sComp?: SCOMPARISON;
  negation?: NEGATION;
}
export interface LOGICCOMPARISON {
  logic: LOGIC;
  filter_list: FILTER[];
}

export interface MCOMPARISON {
  mcomparator: MCOMPARATOR;
  mkey: Mkey;
  num: number;
}

export interface Key {
	idstring: string;
	field: Mfield | Sfield;
}

export interface Mkey extends Key{
  field: Mfield;
}

export interface Skey extends Key {
  field: Sfield;
}

export interface SCOMPARISON {
  is: IS;
  skey: Skey;
  inputstring: string;
}

export interface NEGATION {
  NOT: NOT;
  filter: FILTER;
}

// Update OPTIONS interface for new dataset Rooms
export interface OPTIONS {
  columns: COLUMNS;
  order?: ORDER; // SORT
}

export interface COLUMNS {
  anykey_list: ANYKEY[]; // can be mkey, skey, or applykey
}

export interface SingleKeyOrder {
  anykey: ANYKEY;
}

export interface MultiKeyOrder {
  dir: DIRECTION;
  keys: ANYKEY[];
}

export type ANYKEY = Key | string; // can be mkey, skey, or applykey
export type ORDER = SingleKeyOrder | MultiKeyOrder;
