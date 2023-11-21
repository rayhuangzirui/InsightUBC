import React, { useState } from "react";
import './InstructorSearchField.css';

interface InstructorSearchFieldProps {
	onChange: (value: string) => void;
}

const InstructorSearchField: React.FC<InstructorSearchFieldProps> = ({ onChange }) => {
	const [instructor, setInstructor] = useState('');
	// const [isSubmitted, setIsSubmitted] = useState(false);
	//
	// const handleSearch = () => {
	// 	if (!instructor) {
	// 		return;
	// 	}
	// 	console.log("Searching for instructor: " + instructor);
	// 	setIsSubmitted(true);
	// };

	return (
		// <form className = "instructor-search-field" onSubmit={(event)=> {
		// 	event.preventDefault();
		// 	handleSearch();
		// }}>
		<div className = "instructor-search-field">
			<input
				type="text"
				id="instructor-input"
				name="instructor"
				className="instructor-input"
				placeholder="Enter an instructor's last name"
				value={instructor}
				onChange={(event) => {
					setInstructor(event.target.value);
					onChange(event.target.value);
				}}
			/>
		</div>
	);
};

export default InstructorSearchField;
