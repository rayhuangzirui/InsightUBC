import React, { SetStateAction, useEffect, useState } from "react";
import AutocompleteInput from './AutocompleteInput';
import InstructorSearchField from './InstructorSearchField';
import constructQuery, { QueryParams, QueryType } from "../ConstructQuery";
import performApiCall from "../apiCall";
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
	const [departments, setDepartmentList] = useState<string[]>([]);
	// const [isSearching, setIsSearching] = useState(false);

	useEffect(() => {
		fetchDepartments().then(() => console.log("Departments fetched"));
	}, []);

	const fetchDepartments = async () => {
		try {
			const query = constructQuery(QueryType.DEPARTMENT, {});
			const response = await performApiCall(query, 'query');
			console.log("Response received: " + response.result);
			const departResult = response.result.map((department: any) => department.sections_dept);
			setDepartmentList(departResult);
		} catch (error) {
			if (error instanceof Error) {
				setError(error.message);
			} else {
				setError("Error: Could not fetch data");
			}
		}
	}

	const handleDepartmentSelect = (value: SetStateAction<string>) => {
		setDepartment(value);
	};

	const handleInstructorSearch = (value: SetStateAction<string>) => {
		setInstructor(value);
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

		try {
			const query = constructQuery(QueryType.INSTRUCTOR_AND_DEPARTMENT, queryParams);
			const response = await performApiCall(query, 'query');
			console.log("Response received: " + response.result);
			setResults(response.result);
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
				options={departments}
				onSelect={handleDepartmentSelect}
				placeholder="Select/enter a Department"
				id="department-input"
				name="department"
			/>
			<InstructorSearchField onChange={handleInstructorSearch} />
			<button onClick={performSearch}>Perform Search</button>
			{error && <div className="error">{error}</div>}
			{results.length > 0 && <ResultsTable data={results} />}
		</div>
	);
};

export default CourseSearch;
