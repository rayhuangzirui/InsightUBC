import React, { SetStateAction, useState } from "react";
import AutocompleteInput from './AutocompleteInput';
import InstructorSearchField from './InstructorSearchField';
import constructQuery, { QueryParams, QueryType } from "../ConstructQuery";
// Import any additional utilities or services needed for API calls

type Course = {
	sections_instructor: string;
	sections_dept: string;
	sections_id: string;
	sections_title: string;
};

interface ResultsTableProps {
	data: Course[];
}


const CourseSearch = () => {
	const [department, setDepartment] = useState<string>('');
	const [instructor, setInstructor] = useState<string>('');
	const [results, setResults] = useState<Course[]>([]);
	const [error, setError] = useState<string>('');
	const [isSearching, setIsSearching] = useState(false);

	const handleDepartmentSelect = (value: SetStateAction<string>) => {
		setDepartment(value);
	};

	const handleInstructorSearch = (value: SetStateAction<string>) => {
		setInstructor(value);
	};

	const mockAPI = (query: string): Promise<Course[]> => {
		return new Promise((resolve, reject) => {
			setTimeout(() => {
				resolve([
					{
						sections_instructor: "feeley, michael",
						sections_dept: "cpsc",
						sections_id: "210",
						sections_title: "sftwr constructn",
					},
					{
						sections_instructor: "feeley, michael",
						sections_dept: "cpsc",
						sections_id: "210",
						sections_title: "sftwr constructn",
					},
					{
						sections_instructor: "feeley, michael",
						sections_dept: "cpsc",
						sections_id: "210",
						sections_title: "sftwr constructn",
					},
					{
						sections_instructor: "feeley, michael",
						sections_dept: "cpsc",
						sections_id: "213",
						sections_title: "intro comp sys",
					},
					{
						sections_instructor: "feeley, michael",
						sections_dept: "cpsc",
						sections_id: "213",
						sections_title: "intro comp sys",
					},
					{
						sections_instructor: "feeley, michael",
						sections_dept: "cpsc",
						sections_id: "213",
						sections_title: "intro comp sys",
					},
					{
						sections_instructor: "feeley, michael",
						sections_dept: "cpsc",
						sections_id: "213",
						sections_title: "intro comp sys",
					},
					{
						sections_instructor: "feeley, michael",
						sections_dept: "cpsc",
						sections_id: "213",
						sections_title: "intro comp sys",
					},
					{
						sections_instructor: "feeley, michael",
						sections_dept: "cpsc",
						sections_id: "213",
						sections_title: "intro comp sys",
					},
					{
						sections_instructor: "feeley, michael",
						sections_dept: "cpsc",
						sections_id: "213",
						sections_title: "intro comp sys",
					},
					{
						sections_instructor: "feeley, michael",
						sections_dept: "cpsc",
						sections_id: "213",
						sections_title: "intro comp sys",
					},
					{
						sections_instructor: "feeley, michael",
						sections_dept: "cpsc",
						sections_id: "213",
						sections_title: "intro comp sys",
					},
					{
						sections_instructor: "feeley, michael",
						sections_dept: "cpsc",
						sections_id: "313",
						sections_title: "comp hard&os",
					},
					{
						sections_instructor: "feeley, michael",
						sections_dept: "cpsc",
						sections_id: "313",
						sections_title: "comp hard&os",
					},
					{
						sections_instructor: "feeley, michael",
						sections_dept: "cpsc",
						sections_id: "313",
						sections_title: "comp hard&os",
					},
					{
						sections_instructor: "feeley, michael",
						sections_dept: "cpsc",
						sections_id: "313",
						sections_title: "comp hard&os",
					},
					{
						sections_instructor: "feeley, michael",
						sections_dept: "cpsc",
						sections_id: "313",
						sections_title: "comp hard&os",
					},
				]);

				reject("Error: Could not fetch data");
			}, 1000);
		});
	};

	const performSearch = async () => {
		if (!department) {
			setError("Please select a department");
			return;
		}

		if (!instructor) {
			setError("Please enter a professor's last name");
			return;
		}

		// Construct the query based on state
		const queryParams: QueryParams = { department, instructor };
		console.log(queryParams);

		// Call the API and handle the response
		// Return the response or an error message
		// A simulated list of courses
		try {
			const query = constructQuery(QueryType.INSTRUCTOR_AND_DEPARTMENT, queryParams);
			const response = await mockAPI(query);
			setResults(response);
		} catch (error) {
			if (error instanceof Error) {
				setError(error.message);
			} else {
				setError("Error: Could not fetch data");
			}
		}
	};

	const ResultsTable: React.FC<ResultsTableProps> = ({data}) => {
		return (
			<table>
				<thead>
					<tr>
						<th>Department</th>
						<th>Course ID</th>
						<th>Course Title</th>
						<th>Instructor</th>
					</tr>
				</thead>
				<tbody>
					{data.map((course: Course, index) => (
						<tr key={index}>
							<td>{course.sections_dept}</td>
							<td>{course.sections_id}</td>
							<td>{course.sections_title}</td>
							<td>{course.sections_instructor}</td>
						</tr>
					))}
				</tbody>
			</table>
		);
	}

	return (
		<div>
			<AutocompleteInput
				options={['cpsc', 'math', 'biol']} // Replace with actual department data
				onSelect={handleDepartmentSelect}
				placeholder="Select/enter a Department"
			/>
			<InstructorSearchField onSubmit={handleInstructorSearch} />
			<button onClick={performSearch}>Perform Search</button>
			{/* Display results or errors */}
			{results.length > 0 && <ResultsTable data={results} />}
		</div>
	);
};

export default CourseSearch;
