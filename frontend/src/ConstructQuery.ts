export type QueryParams = {
	// Parameters for instructor and department search
	department?: string;
	instructor?: string;

	// Parameter for search course avg
	courseId?: string;
	year?: number;

	// Parameter for search room
	roomType?: string;
	furnitureType?: string;
	minSeats?: number;
}

export enum QueryType {
	INSTRUCTOR_AND_DEPARTMENT = "INSTRUCTOR_AND_DEPARTMENT",
	// other query types
	COURSE_AVG = "COURSE_AVG",
	ROOM_SEARCH = "ROOM_SEARCH",
}

const constructQuery = (queryType: QueryType, params: QueryParams): string => {
	switch (queryType) {
		case QueryType.INSTRUCTOR_AND_DEPARTMENT:
			return (
				JSON.stringify(
					{
						"WHERE": {
							"AND": [
								{
									"IS": {
										"sections_instructor": params.instructor?.toLowerCase()+"*"
									}
								},
								{
									"IS": {
										"sections_dept": params.department
									}
								}
							]
						},
						"OPTIONS": {
							"COLUMNS": [
								"sections_instructor",
								"sections_dept",
								"sections_id",
								"sections_title"
							],
							"ORDER": "sections_dept"
						}
					}
				)
			);
		case QueryType.COURSE_AVG:
			return (
				JSON.stringify(
					{
						"WHERE": {
							"AND": [
								{
									"IS": {
										"sections_dept": "cpsc"
									}
								},
								{
									"IS": {
										"sections_id": params.courseId
									}
								},
								{
									"GT": {
										"sections_year": params.year
									}
								}
							]
						},
						"OPTIONS": {
							"COLUMNS": [
								"sections_dept",
								"sections_id",
								"sections_avg",
								"sections_year",
								"sections_uuid" // section identifier
							],
							"ORDER": {
								"dir": "DOWN",
								"keys": [
									"sections_year",
									"sections_uuid" // section identifier
								]
							}
						}
					}
				)
			)
		case QueryType.ROOM_SEARCH:
			return (
				JSON.stringify(
					{
						"WHERE": {
							"AND": [
								{
									"IS": {
										"rooms_type": params.roomType
									}
								},
								{
									"IS": {
										"rooms_furniture": params.furnitureType
									}
								},
								{
									"GT": {
										"rooms_seats": params.minSeats
									}
								}
							]
						},
						"OPTIONS": {
							"COLUMNS": [
								"rooms_name",
								"rooms_furniture",
								"rooms_type",
								"maxSeats"
							],
							"ORDER": {
								"dir": "DOWN",
								"keys": [
									"maxSeats"
								]
							}
						},
						"TRANSFORMATIONS": {
							"GROUP": [
								"rooms_name",
								"rooms_type",
								"rooms_furniture"
							],
							"APPLY": [
								{
									"maxSeats": {
										"MAX": "rooms_seats"
									}
								}
							]
						}
					}
				)
			)
		default:
			throw new Error("Invalid query type");
	}
}

export default constructQuery;
