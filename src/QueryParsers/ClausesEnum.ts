export enum WhereClause {
  WHERE = "WHERE"
}

export enum OptionsClause {
  OPTIONS = "OPTIONS"
}

export enum TransformationsClause {
  TRANSFORMATIONS = "TRANSFORMATIONS"
}

export enum GroupClause {
  GROUP = "GROUP"
}

export enum ApplyClause {
  APPLY = "APPLY"
}

export enum ColumnsClause {
  COLUMNS = "COLUMNS"
}

export enum OrderClause {
  ORDER = "ORDER"
}

export enum LOGIC {
  AND= "AND",
  OR = "OR",
}

export enum MCOMPARATOR {
  LT = "LT",
  GT = "GT",
  EQ = "EQ",
}


export enum IS {
  IS = "IS",
}

export enum NOT {
  NOT = "NOT"
}

export enum Mfield {
  AVG = "avg",
  PASS = "pass",
  FAIL = "fail",
  AUDIT = "audit",
  YEAR = "year",

  // Rooms dataset Mfileds
  LAT = "lat",
  LON = "lon",
  SEATS = "seats",
}
export enum Sfield {
  DEPT = "dept",
  ID = "id",
  INSTRUCTOR = "instructor",
  TITLE = "title",
  UUID = "uuid",

  // Rooms dataset Sfields
  FULLNAME = "fullname",
  SHORTNAME = "shortname",
  NUMBER = "number",
  NAME = "name",
  ADDRESS = "address",
  TYPE = "type",
  FURNITURE = "furniture",
  LINK = "href",
}

export enum APPLYTOKEN {
  MAX = "MAX",
  MIN = "MIN",
  AVG = "AVG",
  COUNT = "COUNT",
  SUM = "SUM"
}

export enum DIRECTION {
  UP = "UP",
  DOWN = "DOWN"
}
