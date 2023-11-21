import React, { SetStateAction, useState } from "react";
import constructQuery, { QueryParams } from "../ConstructQuery";
import { QueryType } from "../ConstructQuery";
import performApiCall from "../apiCall";

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
			const response = await performApiCall(query, 'query');
			console.log("Response received: " + JSON.stringify(response));
			setCourseData(response.result);
		} catch (error) {
			setError('Failed to fetch course data.');
		}
	};

	const ResultsTable: React.FC<ResultsTableProps> = ({ data }) => {
		return (
			<table>
				<thead>
					<tr>
						<th>Course</th>
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
				id="course-id-input"
				name="course-id"
				value={courseId}
				onChange={(e) => setCourseId(e.target.value)}
				placeholder="Enter CS course number"
			/>
			<input
				type="number"
				id="year-input"
				name="year"
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
