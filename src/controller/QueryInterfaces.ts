
import {NOT, Sfield, Mfield, LOGIC, MCOMPARATOR, IS} from "./ClausesEnum";

export interface Query {
	body: WHERE;
	options: OPTIONS;
}

export interface WHERE {
  filter?: FILTER,
}

export interface FILTER {
  logicComp?: LOGICCOMPARISON,
  mComp?: MCOMPARISON,
  sComp?: SCOMPARISON,
  negation?: NEGATION,
}
export interface LOGICCOMPARISON {
  logic: LOGIC,
  filter_list: FILTER[],
}

export interface MCOMPARISON {
  mcomparator: MCOMPARATOR,
  mkey: Mkey,
  num: number,
}

export interface Key {
	idstring: string,
	field: Mfield | Sfield
}

export interface Mkey extends Key{
  field: Mfield,
}
export interface Skey extends Key {
  field: Sfield,
}

export interface SCOMPARISON {
  is: IS,
  skey: Skey,
  inputstring: string,
}


export interface NEGATION {
  NOT: NOT,
  filter: FILTER,
}

export interface OPTIONS {
  columns: COLUMNS,
  order?: ORDER,
}

export interface COLUMNS {
  key_list: Key[], // list of key, can be mkey or skey
}

export interface ORDER {
  key: Key
}
