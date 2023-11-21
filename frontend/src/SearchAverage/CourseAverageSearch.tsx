import React, { SetStateAction, useState } from "react";
import constructQuery, { QueryParams } from "../ConstructQuery";
import { QueryType } from "../ConstructQuery";

type CourseAvg = {
	sections_dept: string;
	sections_id: string;
	sections_avg: number;
	sections_year: number;
	// sections_title: string;
	sections_uuid: string;
};

interface ResultsTableProps {
	data: CourseAvg[];
}

const CourseAverageSearch = () => {
	const [courseId, setCourseId] = useState<string>('');
	const [year, setYear] = useState<number>(1900);
	const [courseData, setCourseData] = useState<CourseAvg[]>([]);
	const [error, setError] = useState<string>('');

	const handleCourseId = (value: SetStateAction<string>) => {
		setCourseId(value);
	}

	const handleYear = (value: SetStateAction<number>) => {
		setYear(value);
	};

	const mockAPI = (query: string): Promise<CourseAvg[]> => {
		return new Promise((resolve, reject) => {
			setTimeout(() => {
				resolve([
					{
						sections_dept: "cpsc",
						sections_id: "310",
						sections_avg: 81.17,
						sections_year: 2016,
						sections_uuid: "3393",
					},
					{
						sections_dept: "cpsc",
						sections_id: "310",
						sections_avg: 81.18,
						sections_year: 2015,
						sections_uuid: "62386",
					},
					{
						sections_dept: "cpsc",
						sections_id: "310",
						sections_avg: 77.13,
						sections_year: 2015,
						sections_uuid: "62385",
					},
					{
						sections_dept: "cpsc",
						sections_id: "310",
						sections_avg: 79.12,
						sections_year: 2014,
						sections_uuid: "67312",
					},
					{
						sections_dept: "cpsc",
						sections_id: "310",
						sections_avg: 80.35,
						sections_year: 2014,
						sections_uuid: "1294",
					},
					{
						sections_dept: "cpsc",
						sections_id: "310",
						sections_avg: 78.69,
						sections_year: 2014,
						sections_uuid: "1293",
					},
				]);

				reject("Error: Could not fetch data");
			}, 1000);
		});
	};
	const handleSearch = async () => {
		if (!courseId) {
			setError('Please enter a valid CS course number.');
			return;
		}
		// setError('');
		const courseNumberRegex = new RegExp('^[1-5][0-9]{2}$');

		const validateCourseNumber = (input: string) => {
			return courseNumberRegex.test(input);
		}

		if (!validateCourseNumber(courseId)) {
			console.log("Invalid course number: " + courseId + ".");
			setError('Please enter a valid CS course number, 1XX, 2XX, 3XX, 4XX, or 5XX.');
			return;
		} else {
			console.log("Valid course number: " + courseId + ".");
		}

		// May be extracted from backend dataset
		const yearRange = [1900, 2016];
		const validateYear = (input: number) => {
			return input >= yearRange[0] && input <= yearRange[1];
		}

		if (!validateYear(year)) {
			console.log("Invalid year: " + year + ".");
			setError('Please enter a valid year between 1900 and 2016.');
			return;
		} else {
			console.log("Valid year: " + year + ".");
		}

		const queryParams: QueryParams = { courseId, year};

		try {
			const query = constructQuery(QueryType.COURSE_AVG, queryParams);
			const response = await mockAPI(query);
			setCourseData(response);
		} catch (error) {
			setError('Failed to fetch course data.');
		}
	};

	const ResultsTable: React.FC<ResultsTableProps> = ({ data }) => {
		return (
			<table>
				<thead>
					<tr>
						<th>Course ID</th>
						<th>Course Average</th>
						<th>Year</th>
						<th>Section Identifier</th>
					</tr>
				</thead>
				<tbody>
					{data.map((course, index) => (
						<tr key={index}>
							<td>{course.sections_dept + ' ' + course.sections_id}</td>
							<td>{course.sections_avg}</td>
							<td>{course.sections_year}</td>
							<td>{course.sections_uuid}</td>
						</tr>
					))}
				</tbody>
			</table>
		);
	}

	return (
		<div>
			<input
				type="text"
				value={courseId}
				onChange={(e) => setCourseId(e.target.value)}
				placeholder="Enter CS course number"
			/>
			<input
				type="number"
				value={year}
				onChange={(e) => setYear(e.target.valueAsNumber)}
				placeholder="Enter year"
			/>
			<button onClick={handleSearch}>Search</button>
			{error && <div className="error">{error}</div>}
			{courseData.length > 0 && <ResultsTable data={courseData} />}
		</div>
	);
};

export default CourseAverageSearch;
