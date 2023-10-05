export interface Query {
  body: WHERE,
  options: OPTIONS,
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

export enum LOGIC {
  AND,
  OR,
  UNKNOWN
}

export interface MCOMPARISON {
  mcomparator: MCOMPARATOR,
  mkey: Mkey,
  num: number,
}

export enum MCOMPARATOR {
  LT,
  GT,
  EQ,
}

export interface Key {
  idstring: string, // handle validation in function
}

export interface Mkey extends Key{
  mfield: Mfield,
}

export enum Mfield {
  AVG = "avg",
  PASS = "pass",
  FAIL = "fail",
  AUDIT = "audit",
  YEAR = "year",
}

export interface SCOMPARISON {
  is: IS,
  skey: Skey,
  inputstring: string,
}

export enum IS {
  IS,
}

export interface Skey extends Key {
  sfield: Sfield,
}

export enum Sfield {
  DEPT = "dept",
  ID = "id",
  INSTRUCTION = "instruction",
  TITLE = "title",
  UUID = "uuid",
}

export interface NEGATION {
  NOT: NOT,
  filter: FILTER,
}

export enum NOT {
  NOT
}

export interface OPTIONS {
  columns: COLUMNS;
  order?: ORDER;
}

export interface COLUMNS {
  key_list: Key[], // list of key, can be mkey or skey
}

export interface ORDER {
  key: Key
}